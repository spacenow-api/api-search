'use strict'

const { DataTypes } = require('sequelize')

const { getInstance } = require('./../helpers/mysql.server')

const sequelizeInstance = getInstance()

const Location = require('./../models/location.model')(sequelizeInstance, DataTypes)
const Listing = require('./../models/listing.model')(sequelizeInstance, DataTypes)
const ListingData = require('./../models/listingData.model')(sequelizeInstance, DataTypes)
const ListSettingsParent = require('./../models/listSettingsParent.model')(sequelizeInstance, DataTypes)
const ListSettings = require('./../models/listSettings.model')(sequelizeInstance, DataTypes)
const User = require('./../models/user.model')(sequelizeInstance, DataTypes)
const UserProfile = require('./../models/userProfile.model')(sequelizeInstance, DataTypes)
const ListingPhotos = require('./../models/listingPhotos.model')(sequelizeInstance, DataTypes)
const SubcategorySpecifications = require('./../models/subCategorySpecifications.model')(sequelizeInstance, DataTypes)

module.exports = {
  Location,
  Listing,
  ListingData,
  ListSettingsParent,
  ListSettings,
  User,
  UserProfile,
  ListingPhotos,
  SubcategorySpecifications
}
