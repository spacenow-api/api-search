'use strict'

require('./../helpers/mysql.server').initInstance()
require('./../helpers/redis.server').initInstance()

const searchService = require('./../services/search.service')

/**
 * Get a list of listing Ids by a lat and lng.
 */
module.exports.main = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false
  try {
    const searchResult = await searchService.searchListingIds(event.pathParameters.latlng)
    return {
      statusCode: 200,
      body: JSON.stringify(searchResult),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      }
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: err.message ? err.message : 'Function error not identified.'
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      }
    }
  }
}
