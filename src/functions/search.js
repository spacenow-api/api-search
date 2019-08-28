'use strict'

const searchService = require('./../services/search.service')

module.exports.main = async (event) => {
  const searchResult = searchService.searchListings()
  return {
    statusCode: 200,
    body: JSON.stringify(searchResult),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    }
  }
}
