'use strict'

const sharp = require('sharp')
const axios = require('axios')
const crypto = require('crypto')

const { getInstance: redisInstance } = require('./../helpers/redis.server')

const redis = redisInstance()

const MAX_W = 800
const MAX_H = null
const DEFAULT_QUALITY = 80

function getRedisKey(value) {
  return crypto
    .createHash('sha256')
    .update(value, 'utf8')
    .digest('hex')
}

async function getResizeImage(path, width, height) {
  const fileResponse = await axios({
    url: path,
    method: 'GET',
    headers: { 'Accept-Encoding': 'br,gzip,deflate' },
    responseType: 'arraybuffer'
  })
  const buffer = Buffer.from(fileResponse.data, 'base64')
  return sharp(buffer)
    .resize(width, height)
    .webp({ quality: DEFAULT_QUALITY })
    .toBuffer()
}

async function searchImagesAndResize(path, width, height) {
  try {
    let key = '__image__' + path
    if (width && height) {
      key = key + width + height
    }
    const redisKey = getRedisKey(key)
    const imageData = await redis.getBuffer(redisKey)
    if (imageData) {
      return imageData
    } else {
      const widthInt = width ? parseInt(width) : MAX_W
      const heightInt = height ? parseInt(height) : MAX_H
      const resizedBuffer = await getResizeImage(path, widthInt, heightInt)
      await redis.set(redisKey, resizedBuffer)
      return resizedBuffer
    }
  } catch (err) {
    throw new Error(err)
  }
}

module.exports = { searchImagesAndResize }
