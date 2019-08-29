'use strict'

const Sequelize = require('sequelize')
const { DataTypes } = require('sequelize')

let sequelize = null
if (!sequelize) {
  sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_SCHEMA,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    logging: process.env.DEBUG ? console.debug : false
  })
}

const Location = require('./../models/location.model')(sequelize, DataTypes)
const Listing = require('./../models/listing.model')(sequelize, DataTypes)

module.exports = {
  Location,
  Listing
}
