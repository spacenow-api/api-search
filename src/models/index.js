'use strict'

const { DataTypes } = require('sequelize')

const { getInstance } = require('./../helpers/mysql.server')

const Location = require('./../models/location.model')(getInstance(), DataTypes)
const Listing = require('./../models/listing.model')(getInstance(), DataTypes)

module.exports = {
  Location,
  Listing
}
