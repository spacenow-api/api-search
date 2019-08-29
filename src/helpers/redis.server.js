'use strict'

const Redis = require('ioredis')

let redis = null

function initInstance() {
  if (!redis) {
    console.info('Initializing Redis connection.')
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
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
