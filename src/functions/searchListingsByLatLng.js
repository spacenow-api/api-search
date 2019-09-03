'use strict'

const searchService = require('./../services/search.service')

module.exports.main = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  searchService
    .searchListingIds(event.pathParameters.latlng)
    .then((data) => callback(null, r.success(data)))
    .catch((err) => callback(null, r.failure(err)))
}
