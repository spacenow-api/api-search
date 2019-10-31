'use strict'

const { Op } = require('sequelize')
const crypto = require('crypto')

const { getInstance: mysqlInstance } = require('./../helpers/mysql.server')
const { getInstance: redisInstance } = require('./../helpers/redis.server')
const { filterOnlyFree } = require('./availability.service')

const {
  Listing,
  ListingData,
  ListSettingsParent,
  ListSettings,
  ListingPhotos,
  User,
  UserProfile,
  SubcategorySpecifications
} = require('./../models')

const sequelize = mysqlInstance()
const redis = redisInstance()

const RADIUS_DEFAULT = 10
const PAGINATION_LIMIT_DEFAULT = 12

function getRedisKey(value) {
  return crypto
    .createHash('sha256')
    .update(value, 'utf8')
    .digest('hex')
}

async function cacheStore(latlng, salt, listings) {
  const hashKey = getRedisKey(`${latlng}-${salt}`)
  await redis.set(hashKey, JSON.stringify(listings), 'EX', 86400) // to expire key after 24 hours
  return hashKey
}

function getLatLngObj(latlng) {
  const latAndLng = latlng && latlng.split(',')
  if (!latlng || !latAndLng || latAndLng.length <= 0)
    throw new Error(
      'Latitude or longitude are missing to call Google Maps API.'
    )
  return {
    lat: latAndLng[0],
    lng: latAndLng[1]
  }
}

async function searchListingIds(latlng, filters) {
  let byRadius = (filters && filters.radius) || RADIUS_DEFAULT
  byRadius = byRadius <= 0 ? `` : `< ${byRadius}`
  const latlngObj = getLatLngObj(latlng)
  const queryResults = await sequelize.query(`
    SELECT 
      id, country, address1, buildingName, city, state, zipcode, lat, lng 
    FROM Location 
    WHERE (1=1) 
      AND ACOS(SIN(RADIANS(lat)) * SIN(RADIANS(${latlngObj.lat})) + COS(RADIANS(lat)) * COS(RADIANS(${latlngObj.lat})) * COS(RADIANS(lng) - RADIANS(${latlngObj.lng}))) * 6380 ${byRadius}
    ORDER BY ACOS(SIN(RADIANS(lat)) * SIN(RADIANS(${latlngObj.lat})) + COS(RADIANS(lat)) * COS(RADIANS(${latlngObj.lat})) * COS(RADIANS(lng) - RADIANS(${latlngObj.lng}))) * 6380
  `)
  let locations = []
  let locationIds = []
  if (queryResults) {
    locations = queryResults[0]
    locationIds = locations.map((o) => o.id)
  }
  const listings = await Listing.findAll({
    raw: true,
    attributes: [
      'id',
      'title',
      'userId',
      'locationId',
      'bookingPeriod',
      'listSettingsParentId'
    ],
    where: {
      locationId: { [Op.in]: locationIds },
      isReady: true,
      isPublished: true,
      status: 'active'
    },
    order: sequelize.literal(`FIELD(locationId, ${locationIds.join(',')})`)
  })
  const listingsResult = await fillListings(listings, locations)
  const searchKey = await cacheStore(latlng, Date.now(), listingsResult)
  return searchQuery(searchKey, filters)
}

async function fillListings(listings, locations) {
  try {
    const searchResults = []
    for (const listingObj of listings) {
      // Getting listing data...
      const listingData = await ListingData.findOne({
        attributes: [
          'id',
          'basePrice',
          'currency',
          'minTerm',
          'capacity',
          'size',
          'meetingRooms',
          'isFurnished',
          'carSpace',
          'sizeOfVehicle',
          'maxEntranceHeight',
          'spaceType',
          'bookingType',
          'accessType'
        ],
        where: { listingId: listingObj.id }
      })

      // Specifications...
      const specificationsData = await SubcategorySpecifications.findAll({
        attributes: ['listSettingsSpecificationId'],
        where: { listSettingsParentId: listingObj.listSettingsParentId }
      })
      const specificationsArray = []
      for (const item of specificationsData) {
        const settingsObj = await ListSettings.findOne({
          attributes: ['id', 'typeId', 'itemName', 'otherItemName', 'specData'],
          where: { id: item.listSettingsSpecificationId }
        })
        specificationsArray.push(settingsObj)
      }

      // Getting location data...
      const locationData = locations.find((o) => o.id == listingObj.locationId)

      // Getting category & sub-category...
      const parentObj = await ListSettingsParent.findOne({
        attributes: ['listSettingsParentId', 'listSettingsChildId'],
        where: { id: listingObj.listSettingsParentId }
      })
      const categoryObj = await ListSettings.findOne({
        attributes: ['id', 'typeId', 'itemName', 'otherItemName'],
        where: { id: parentObj.listSettingsParentId }
      })
      const subCategoryObj = await ListSettings.findOne({
        attributes: ['id', 'typeId', 'itemName', 'otherItemName'],
        where: { id: parentObj.listSettingsChildId }
      })

      // Getting photos...
      const photosArray = await ListingPhotos.findAll({
        attributes: ['id', 'name', 'isCover', 'type'],
        where: { listingId: listingObj.id }
      })

      // Getting user host details...
      const hostUser = await User.findOne({
        raw: true,
        attributes: ['id', 'email'],
        where: { id: listingObj.userId }
      })
      const hostProfile = await UserProfile.findOne({
        attributes: [
          'profileId',
          'firstName',
          'lastName',
          'displayName',
          'picture'
        ],
        where: { userId: listingObj.userId }
      })

      searchResults.push({
        ...listingObj,
        listingData: listingData,
        specifications: specificationsArray,
        location: locationData,
        category: categoryObj,
        subcategory: subCategoryObj,
        photos: photosArray,
        host: {
          ...hostUser,
          profile: hostProfile
        }
      })
    }
    return searchResults
  } catch (err) {
    throw new Error(err)
  }
}

function getPaginator(content, toPage, byLimit) {
  const items = content || []
  const page = toPage || 1
  const limit = byLimit || PAGINATION_LIMIT_DEFAULT
  const offset = (page - 1) * limit
  const paginatedItems = items.slice(offset).slice(0, limit)
  const totalPages = Math.ceil(items.length / limit)
  return {
    page: page,
    perPage: limit,
    prePage: page - 1 ? page - 1 : null,
    nextPage: totalPages > page ? page + 1 : null,
    total: items.length,
    totalPages: totalPages,
    result: paginatedItems
  }
}

async function searchQuery(searchKey, filters) {
  const listingData = await redis.get(searchKey)
  if (!listingData) return { status: 'EMPTY' }
  let filteredResult = JSON.parse(listingData)
  if (filters) {
    // Check categories...
    if (filters.categories) {
      const categoryIds = filters.categories
        .split(',')
        .map((o) => parseInt(o, 10))
      if (categoryIds.length > 0) {
        filteredResult = filteredResult.filter((o) =>
          categoryIds.includes(o.category.id)
        )
      }
    }
    // Check duration...
    if (filters.duration) {
      const durationTypes = filters.duration.split(',')
      if (durationTypes.length > 0) {
        filteredResult = filteredResult.filter((o) =>
          durationTypes.includes(o.bookingPeriod)
        )
      }
    }
    // Check minimum price...
    if (filters.priceMin && filters.priceMin > 0) {
      filteredResult = filteredResult.filter(
        (o) => o.listingData.basePrice >= filters.priceMin
      )
    }
    // Check maximun price...
    if (filters.priceMax && filters.priceMax > 0) {
      filteredResult = filteredResult.filter(
        (o) => o.listingData.basePrice <= filters.priceMax
      )
    }
    // Check instant booking...
    if (filters.instant) {
      const boolValue = /true/i.test(filters.instant)
      filteredResult = filteredResult.filter(
        (o) => (o.listingData.bookingType === 'instant') === boolValue
      )
    }
    // Check availability...
    if (filters.availability && filters.availability.length > 0) {
      filteredResult = await filterOnlyFree(
        filteredResult,
        filters.availability
      )
    }
  }
  const dataPaginated = getPaginator(
    filteredResult,
    filters.page,
    filters.limit
  )
  return { status: 'OK', searchKey, ...dataPaginated }
}

module.exports = { searchListingIds, searchQuery }
