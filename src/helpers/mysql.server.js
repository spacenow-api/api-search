'use strict'

const Sequelize = require('sequelize')

let sequelize = null

async function initInstance() {
  if (!sequelize) {
    console.info('Initializing Sequelize connection.')
    try {
      sequelize = await new Sequelize({
        dialect: 'mysql',
        host: process.env.DATABASE_HOST,
        database: process.env.DATABASE_SCHEMA,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        logging: process.env.DEBUG ? console.debug : false
      })
    } catch (err) {
      console.error(err)
    }
  }
}

function getInstance() {
  if (!sequelize) {
    initInstance()
  }
  return sequelize
}

module.exports = { initInstance, getInstance }
