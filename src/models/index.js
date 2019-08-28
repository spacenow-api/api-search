'use strict'

const Sequelize = require('sequelize')
const { DataTypes } = require('sequelize')

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_SCHEMA,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  logging: process.env.DEBUG ? console.debug : false
})

const Location = require('./../models/location.model')(sequelize, DataTypes)

module.exports = {
  Location
}
