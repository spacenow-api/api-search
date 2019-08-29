'use strict'

const { Op } = require('sequelize')
const crypto = require('crypto')

const googleAPI = require('./../commons/google')
const redis = require('./../helpers/redis.server')

const { Location, Listing } = require('./../models')

function getRedisKey(value) {
  return crypto
    .createHash('sha256')
    .update(value, 'utf8')
    .digest('hex')
}

function getLatLngObj(latlng) {
  const latAndLng = latlng && latlng.split(',')
  if (!latlng || !latAndLng || latAndLng.length <= 0)
    throw new Error('Latitude or longitude are missing to call Google Maps API.')
  return {
    lat: latAndLng[0],
    lng: latAndLng[1]
  }
}

async function searchListingIds(latlng) {
  const latlngObj = getLatLngObj(latlng)
  const geoLocations = await googleAPI.getGeocode(latlngObj.lat, latlngObj.lng)
  const latArray = geoLocations.map((o) => o.lat)
  const lngArray = geoLocations.map((o) => o.lng)
  const locations = await Location.findAll({
    raw: true,
    attributes: ['id'],
    where: {
      lat: { [Op.in]: latArray },
      lng: { [Op.in]: lngArray }
    }
  })
  const locationIds = locations ? locations.map((o) => o.id) : []
  const listingIds = await Listing.findAll({
    raw: true,
    attributes: ['id'],
    where: { locationId: { [Op.in]: locationIds } }
  })
  return listingIds ? listingIds.map((o) => o.id) : []
}

async function searchStore(latlng, userId, listings) {
  const hashKey = getRedisKey(`${latlng}-${userId}`)
  redis.set(hashKey, JSON.stringify(listings))
  return { searchKey: hashKey }
}

module.exports = { searchListingIds, searchStore }
