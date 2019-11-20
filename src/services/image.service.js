'use strict'

const sharp = require('sharp')
const axios = require('axios')
const crypto = require('crypto')

const { getInstance: redisInstance } = require('./../helpers/redis.server')

const redis = redisInstance()

const MAX_W = 2048
const MAX_H = 2048

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
  const transform = sharp(buffer).toFormat('jpeg')
  if (width || height) {
    transform.resize(width, height)
  }
  return transform.toBuffer()
}

async function resizeAndCache(path, width, height) {
  try {
    console.log('Redis Flushing...')
    await redis.flushall()
    let key = '__image__' + path
    if (width && height) {
      key = key + width + height
    }
    const redisKey = getRedisKey(key)
    const imageData = await redis.getBuffer(redisKey)
    if (imageData) {
      return imageData
    } else {
      let widthInt = 1024
      if (width && parseInt(width) <= MAX_W) {
        widthInt = parseInt(width)
      }
      let heightInt = 1024
      if (height && parseInt(height) <= MAX_H) {
        heightInt = parseInt(height)
      }
      const resizedBuffer = await getResizeImage(path, widthInt, heightInt)
      await redis.set(redisKey, resizedBuffer)
      return resizedBuffer
    }
  } catch (err) {
    throw new Error(err)
  }
}

module.exports = { resizeAndCache }
