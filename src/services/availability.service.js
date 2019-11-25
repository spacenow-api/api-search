'use strict'

const { Op } = require('sequelize')
const moment = require('moment')

const { Availabilities, ListingAccessDays, ListingAccessHours } = require('./../models')

function mapReservations(availability) {
  const reservationsString = availability.blockedDates
  availability.blockedDates = []
  if (reservationsString)
    availability.blockedDates = reservationsString.split(',')
  return availability
}

function isListingFreeForBooking(exceptionDates, datesSelected) {
  let is = true
  for (let i = 0, size = exceptionDates.length; i < size; i += 1) {
    const date = exceptionDates[i]
    const filtered = datesSelected.filter((o) => moment(o).isSame(date, 'day'))
    if (filtered.length > 0) {
      is = false
      break
    }
  }
  return is
}

function doCheckAvailability(listAvailabilities, listingObj, datesSelected) {
  const listingAvailabilities = listAvailabilities.filter((o) => o.listingId == listingObj.id)
  if (listingAvailabilities) {
    const validationDates = []
    listingAvailabilities.forEach((o) => validationDates.push(...o.blockedDates))
    if (isListingFreeForBooking(validationDates, datesSelected)) {
      return true
    }
  } else {
    return true
  }
  return false
}

async function doCheckOpenDays(listingObj, datesSelected) {
  let isOpen = true
  const accessDays = await ListingAccessDays.findOne({
    where: { listingId: listingObj.id }
  })
  for (let index = 0, size = datesSelected.length; index < size; index += 1) {
    const weekDay = moment(datesSelected[index]).day()
    const accessHours = await ListingAccessHours.findOne({
      where: {
        listingAccessDaysId: accessDays.id,
        weekday: `${weekDay}`
      }
    })
    if (!accessHours) {
      isOpen = false
      break
    }
  }
  return isOpen
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
    let isValid = doCheckAvailability(availabilities, listing, datesSelected)
    if (isValid) {
      isValid = await doCheckOpenDays(listing, datesSelected)
      if (isValid) {
        freeListings.push(listing)
      }
    }
  }
  return freeListings
}

module.exports = { filterOnlyFree }
