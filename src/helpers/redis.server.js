'use strict'

const Redis = require('ioredis')

let redis = null

function initInstance() {
  if (!redis) {
    console.info('Initializing Redis connection.')
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: 6379,
      connectTimeout: 10000,
      reconnectOnError: function () { return true }
    })
  }
}

function getInstance() {
  if (!redis) {
    initInstance()
  }
  return redis
}

module.exports = { initInstance, getInstance }
