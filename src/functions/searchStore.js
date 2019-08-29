'use strict'

const searchService = require('./../services/search.service')

/**
 * Store a set of listing data on Redis to futures search with one o more filters.
 */
module.exports.main = async (event) => {
  try {
    const searchResult = await searchService.searchStore(event.pathParameters.latlng, JSON.parse(event.body))
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
