'use strict'

module.exports = {
  success: (data) => {
    return {
      statusCode: 200,
      body: data && JSON.stringify(data),
      headers: {
        'Access-Control-Allow-Origin': process.env.DOMAIN,
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Headers': 'x-requested-with'
      }
    }
  },

  failure: (err) => {
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message ? err.message : 'Function error not identified.' }),
      headers: {
        'Access-Control-Allow-Origin': process.env.DOMAIN,
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Headers': 'x-requested-with'
      }
    }
  }
}
