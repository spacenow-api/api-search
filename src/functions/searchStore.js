'use strict'

require('./../helpers/mysql.server').initInstance()
require('./../helpers/redis.server').initInstance()

const searchService = require('./../services/search.service')

/**
 * Store a set of listing data on Redis to futures search with one o more filters.
 */
module.exports.main = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false
  try {
    const data = JSON.parse(event.body)
    if (!data.userId || !data.listings)
      throw new Error('User ID or Listings payload are missing.')
    const searchResult = await searchService.searchStore(
      event.pathParameters.latlng,
      data.userId,
      data.listings
    )
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
