'use strict'

const r = require('./../../helpers/response.utils')
const searchService = require('./../../services/search.service')

module.exports.main = (event, context, callback) => {
  console.log('searchListingIds: ', event.body)
  console.log('searchListingIds: ', Buffer.from(event.body, 'base64').toString('utf8'))
  context.callbackWaitsForEmptyEventLoop = false
  searchService
    .searchListingIds(event.pathParameters.latlng, JSON.parse(event.body || `{}`))
    .then((data) => callback(null, r.success(data)))
    .catch((err) => callback(null, r.failure(err)))
}
