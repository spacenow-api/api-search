'use strict'

const Redis = require('ioredis')

let redis = null

if (!redis) {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  })
}

module.exports = redis
