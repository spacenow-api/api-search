'use strict'

const { Op } = require('sequelize')
const crypto = require('crypto')

const { getInstance: mysqlInstance } = require('./../helpers/mysql.server')
const { getInstance: redisInstance } = require('./../helpers/redis.server')

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

function getRedisKey(value) {
  return crypto
    .createHash('sha256')
    .update(value, 'utf8')
    .digest('hex')
}

function cacheStore(latlng, salt, listings) {
  const hashKey = getRedisKey(`${latlng}-${salt}`)
  redisInstance().set(hashKey, JSON.stringify(listings), 'EX', 86400) // to expire key after 24 hours
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

async function searchListingIds(latlng) {
  console.log('searchListingIds -> latlng', latlng)
  const latlngObj = getLatLngObj(latlng)
  const queryResults = await mysqlInstance().query(
    `SELECT * FROM Location WHERE ACOS(SIN(RADIANS(lat)) * SIN(RADIANS(${latlngObj.lat})) + COS(RADIANS(lat)) * COS(RADIANS(${latlngObj.lat})) * COS(RADIANS(lng) - RADIANS(${latlngObj.lng}))) * 6380 < 10`
  )
  console.log('searchListingIds -> queryResults', queryResults)
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
    }
  })
  const listingsResult = await fillListings(listings, locations)
  const searchKey = cacheStore(latlng, Date.now(), listingsResult)
  return { searchKey, listings: listingsResult }
}

async function fillListings(listings, locations) {
  try {
    const searchResults = []
    for (const listingObj of listings) {
      // Getting listing data...
      const listingData = await ListingData.findOne({
        where: { listingId: listingObj.id }
      })

      // Specifications...
      const specificationsData = await SubcategorySpecifications.findAll({
        where: { listSettingsParentId: listingObj.listSettingsParentId },
        raw: true
      })
      const specificationsArray = []
      for (const item of specificationsData) {
        const settingsObj = await ListSettings.findOne({
          where: { id: item.listSettingsSpecificationId },
          raw: true
        })
        specificationsArray.push(settingsObj)
      }

      // Getting location data...
      const locationData = locations.find((o) => o.id == listingObj.locationId)

      // Getting category & sub-category...
      const parentObj = await ListSettingsParent.findOne({
        where: { id: listingObj.listSettingsParentId }
      })
      const categoryObj = await ListSettings.findOne({
        where: { id: parentObj.listSettingsParentId }
      })
      const subCategoryObj = await ListSettings.findOne({
        where: { id: parentObj.listSettingsChildId }
      })

      // Getting photos...
      const photosArray = await ListingPhotos.findAll({
        where: { listingId: listingObj.id }
      })

      // Getting user host details...
      const hostUser = await User.findOne({
        raw: true,
        where: { id: listingObj.userId }
      })
      const hostProfile = await UserProfile.findOne({
        where: { userId: hostUser.id }
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

async function searchQuery(searchKey, filters) {
  const listingData = await redisInstance().get(searchKey)
  if (!listingData) return { status: 'empty' }
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
  }
  return { status: 'OK', searchKey, result: filteredResult }
}

module.exports = { searchListingIds, searchQuery }
