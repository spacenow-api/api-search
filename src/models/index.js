'use strict'

const { DataTypes } = require('sequelize')

const { getInstance } = require('./../helpers/mysql.server')

const sequelize = getInstance()

const Location = require('./../models/location.model')(sequelize, DataTypes)
const Listing = require('./../models/listing.model')(sequelize, DataTypes)
const ListingData = require('./../models/listingData.model')(sequelize, DataTypes)
const ListSettingsParent = require('./../models/listSettingsParent.model')(sequelize, DataTypes)
const ListSettings = require('./../models/listSettings.model')(sequelize, DataTypes)
const User = require('./../models/user.model')(sequelize, DataTypes)
const UserProfile = require('./../models/userProfile.model')(sequelize, DataTypes)
const ListingPhotos = require('./../models/listingPhotos.model')(sequelize, DataTypes)
const SubcategorySpecifications = require('./../models/subCategorySpecifications.model')(sequelize, DataTypes)
const Availabilities = require('./../models/availabilities.model')(sequelize, DataTypes)

module.exports = {
  Location,
  Listing,
  ListingData,
  ListSettingsParent,
  ListSettings,
  User,
  UserProfile,
  ListingPhotos,
  SubcategorySpecifications,
  Availabilities
}
