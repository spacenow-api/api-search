'use strict'

module.exports = {
  success: (data) => {
    return {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'x-requested-with'
      },
      statusCode: 200,
      body: data && JSON.stringify(data)
    }
  },

  image: (data) => {
    return {
      headers: {
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'image/webp',
        'Cache-Control': 'private, max-age=1195723'
      },
      statusCode: 200,
      body: data,
      isBase64Encoded: true
    }
  },

  failure: (err) => {
    console.error(err)
    return {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'x-requested-with'
      },
      statusCode: 500,
      body: JSON.stringify({
        error: err.message ? err.message : 'Function error not identified.'
      })
    }
  }
}
