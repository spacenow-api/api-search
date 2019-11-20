'use strict'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'x-requested-with'
}

module.exports = {
  success: (data) => {
    return {
      headers,
      statusCode: 200,
      body: data && JSON.stringify(data)
    }
  },

  buffer: (data) => {
    return {
      headers: {
        ...headers,
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private'
      },
      statusCode: 200,
      body: data,
      isBase64Encoded: true
    }
  },

  failure: (err) => {
    console.error(err)
    return {
      headers,
      statusCode: 500,
      body: JSON.stringify({
        error: err.message ? err.message : 'Function error not identified.'
      })
    }
  }
}
