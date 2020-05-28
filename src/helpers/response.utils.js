'use strict'

module.exports = {
  success: (data) => {
    return {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'x-requested-with'
      },
      statusCode: 200,
      body: data && JSON.stringify(data),
      isBase64Encoded: false
    }
  },

  failure: (err) => {
    console.log("FAILURE ===>>>", err)
    return {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'x-requested-with'
      },
      statusCode: 500,
      body: JSON.stringify({
        error: err.message ? err.message : 'Function error not identified.'
      }),
      isBase64Encoded: false
    }
  },

  image: (data) => {
    return {
      headers: {
        'Content-Type': 'image/webp',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'private, max-age=1195723'
      },
      statusCode: 200,
      body: data.toString('base64'),
      isBase64Encoded: true
    }
  },

  buffer: (data) => {
    return {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'private, max-age=1195723'
      },
      statusCode: 200,
      body: data.toString('base64'),
      isBase64Encoded: true
    }
  }
}
