'use strict'

const { Op } = require('sequelize')
const crypto = require('crypto')

const { getInstance: mysqlInstance } = require('./../helpers/mysql.server')
const { getInstance: redisInstance } = require('./../helpers/redis.server')

const { Listing } = require('./../models')

function getRedisKey(value) {
  return crypto
    .createHash('sha256')
    .update(value, 'utf8')
    .digest('hex')
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
  const locations = await mysqlInstance().query(
    `SELECT * FROM Location WHERE ACOS(SIN(RADIANS(lat)) * SIN(RADIANS(${latlngObj.lat})) + COS(RADIANS(lat)) * COS(RADIANS(${latlngObj.lat})) * COS(RADIANS(lng) - RADIANS(${latlngObj.lng}))) * 6380 < 10`
  )
  let locationIds = []
  if (locations) {
    const firstResult = locations[0]
    locationIds = firstResult.map((o) => o.id)
  }
  const listingIds = await Listing.findAll({
    raw: true,
    attributes: ['id'],
    where: { locationId: { [Op.in]: locationIds } }
  })
  return listingIds ? listingIds.map((o) => o.id) : []
}

async function searchStore(latlng, userId, listings) {
  const hashKey = getRedisKey(`${latlng}-${userId}`)
  redisInstance().set(hashKey, JSON.stringify(listings))
  return { searchKey: hashKey }
}

async function searchQuery(searchkey, filters) {
  const listingData = await redisInstance().get(searchkey)
  if (!listingData) return { status: 'empty' }
  const listingResult = JSON.parse(listingData)
  return { status: 'OK', result: listingResult }
}

module.exports = { searchListingIds, searchStore, searchQuery }
