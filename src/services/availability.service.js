'use strict'

const { Op } = require('sequelize')
const crypto = require('crypto')
const moment = require('moment')

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
  SubcategorySpecifications,
  Availabilities
} = require('./../models')

const sequelize = mysqlInstance()

function mapReservations(availability) {
  const reservationsString = availability.blockedDates
  availability.blockedDates = []
  if (reservationsString)
    availability.blockedDates = reservationsString.split(',')
  return availability
}

function hasBlockAvailabilities(bookings, reservationDates) {
  try {
    let reservationsFromBooking = bookings.map((o) => o.reservations)
    reservationsFromBooking = [].concat.apply([], reservationsFromBooking)
    const similars = []
    reservationsFromBooking.forEach((fromBooking) => {
      reservationDates.forEach((toCreate) => {
        if (moment(fromBooking).isSame(toCreate, 'day')) {
          if (similars.indexOf(toCreate) === -1) {
            similars.push(toCreate)
          }
        }
      })
    })
    return similars.length > 0
  } catch (err) {
    console.error(err)
    return true // to block reservations if has a error...
  }
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
