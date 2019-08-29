'use strict'

const { Op } = require('sequelize')

const googleAPI = require('./../commons/google')

const { Location, Listing } = require('./../models')

async function searchCreate(latlng) {
  const latAndLng = latlng.split(',')
  if (!latAndLng)
    throw new Error('Latitude or longitude are missing to call Google Maps API.')
  const geoLocations = await googleAPI.getGeocode(latAndLng[0], latAndLng[1])
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

module.exports = { searchCreate }
