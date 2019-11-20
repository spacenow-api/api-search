'use strict'

const r = require('./../../helpers/response.utils')
const imageService = require('./../../services/image.service')

module.exports.main = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  const { path, width, height } = event.queryStringParameters
  imageService
    .searchImagesAndResize(path, width, height)
    .then((data) => callback(null, r.image(data)))
    .catch((err) => callback(null, r.failure(err)))
}
