'use strict'

const r = require('./../../helpers/response.utils')
const searchService = require('./../../services/search.service')

module.exports.main = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  searchService
    .searchSimilar(event.pathParameters.listingId)
    .then((data) => callback(null, r.success(data)))
    .catch((err) => callback(null, r.failure(err)))
}
