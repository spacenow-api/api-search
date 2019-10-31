'use strict'

const { Op } = require('sequelize')
const moment = require('moment')

const { Availabilities } = require('./../models')

function mapReservations(availability) {
  const reservationsString = availability.blockedDates
  availability.blockedDates = []
  if (reservationsString)
    availability.blockedDates = reservationsString.split(',')
  return availability
}

function isListingFreeForBooking(blockedDates, datesSelected) {
  let is = true
  for (let i = 0, size = blockedDates.length; i < size; i += 1) {
    const date = blockedDates[i]
    const filtered = datesSelected.filter((o) => moment(o).isSame(date, 'day'))
    if (filtered.length > 0) {
      is = false
      break
    }
  }
  return is
}

async function filterOnlyFree(filteredResult, datesSelected) {
  const listingIds = filteredResult.map((o) => o.id)
  let availabilities = await Availabilities.findAll({
    where: { listingId: { [Op.in]: listingIds } },
    attributes: ['availabilityId', 'listingId', 'blockedDates']
  })
  availabilities = availabilities.map(mapReservations)
  const freeListings = []
  for (let i = 0, size = filteredResult.length; i < size; i += 1) {
    const listing = filteredResult[i]
    const availability = availabilities.find((o) => o.listingId == listing.id)
    if (availability) {
      if (isListingFreeForBooking(availability.blockedDates, datesSelected)) {
        freeListings.push(listing)
      }
    } else {
      freeListings.push(listing)
    }
  }
  return freeListings
}

module.exports = { filterOnlyFree }
