'use strict'

const Sequelize = require('sequelize')

const r = require('./../helpers/response.utils')
// const searchService = require('./../services/search.service')

// module.exports.main = (event, context, callback) => {
//   context.callbackWaitsForEmptyEventLoop = false
//   searchService
//     .searchListingIds(event.pathParameters.latlng)
//     .then((data) => callback(null, r.success(data)))
//     .catch((err) => callback(null, r.failure(err)))
// }

module.exports.main = (event, context, callback) => {
  const instance = new Sequelize({
    dialect: 'mysql',
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_SCHEMA,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    logging: true
  })
  console.info(instance)
  callback(null, r.success({ status: 'OK' }))
}
