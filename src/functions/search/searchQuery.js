'use strict'

const r = require('./../../helpers/response.utils')
const searchService = require('./../../services/search.service')

module.exports.main = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  searchService
    .searchQuery(event.pathParameters.key, getPayload(event.body))
    .then((data) => callback(null, r.success(data)))
    .catch((err) => callback(null, r.failure(err)))
}

function getPayload(data) {
  let payload
  try {
    payload = JSON.parse(data)
  } catch (ignore) {
    const jsonFromBuffer = Buffer.from(data || '{}', 'base64')
    payload = JSON.parse(jsonFromBuffer.toString('utf8'))
  }
  return payload
}
