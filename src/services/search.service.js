'use strict'

const { Op } = require('sequelize')

const googleAPI = require('./../commons/google')

const { Location, Listing } = require('./../models')

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

async function searchStore(latlng, listingPayload) {
  const latlngObj = getLatLngObj(latlng)
}

module.exports = { searchListingIds, searchStore }
