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
  UserProfile
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
  const latlngObj = getLatLngObj(latlng)
  const queryResults = await mysqlInstance().query(
    `SELECT * FROM Location WHERE ACOS(SIN(RADIANS(lat)) * SIN(RADIANS(${latlngObj.lat})) + COS(RADIANS(lat)) * COS(RADIANS(${latlngObj.lat})) * COS(RADIANS(lng) - RADIANS(${latlngObj.lng}))) * 6380 < 10`
  )
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
  const listingResult = JSON.parse(listingData)
  return { status: 'OK', searchKey, result: listingResult }
}

module.exports = { searchListingIds, searchQuery }
