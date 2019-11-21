'use strict'

const r = require('./../../helpers/response.utils')
const searchService = require('./../../services/search.service')

module.exports.main = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  console.log('Event Body: ', event.body)
  let payload
  try {
    payload = JSON.parse(event.body)
  } catch (ignore) {
    const jsonFromBuffer = Buffer.from(event.body || '{}', 'base64')
    payload = JSON.parse(jsonFromBuffer.toString('utf8'))
  }
  searchService
    .searchListingIds(event.pathParameters.latlng, payload)
    .then((data) => callback(null, r.success(data)))
    .catch((err) => callback(null, r.failure(err)))
}
