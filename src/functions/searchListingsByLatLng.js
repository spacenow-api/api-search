'use strict'

const Sequelize = require('sequelize')
const { DataTypes } = require('sequelize')

const r = require('./../helpers/response.utils')
// const searchService = require('./../services/search.service')

// module.exports.main = (event, context, callback) => {
//   context.callbackWaitsForEmptyEventLoop = false
//   searchService
//     .searchListingIds(event.pathParameters.latlng)
//     .then((data) => callback(null, r.success(data)))
//     .catch((err) => callback(null, r.failure(err)))
// }

module.exports.main = async (event, context, callback) => {
  const instance = new Sequelize({
    dialect: 'mysql',
    host: 'sandpit-spacenow-mysql.ceux00skpbdx.ap-southeast-2.rds.amazonaws.com', //process.env.DATABASE_HOST,
    database: 'spacenow_2019', // process.env.DATABASE_SCHEMA,
    username: 'spacenowtest', // process.env.DATABASE_USERNAME,
    password: 'wPm9r5E9iF7S2y', // process.env.DATABASE_PASSWORD,
    logging: console.log
  })
  console.info('Sequelize instance ->', instance)
  // const Location = require('./../models/location.model')(instance, DataTypes)
  // console.log('Location instance ->', Location)
  // const locations = await Location.findAll()
  // console.log('Locations ->', locations)
  try {
    await instance.authenticate()
    callback(null, r.success({ status: 'OK' }))
  } catch (err) {
    callback(null, r.failure(err))
  }
}
