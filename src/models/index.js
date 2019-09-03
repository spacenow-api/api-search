'use strict'

const { DataTypes } = require('sequelize')

const { getInstance } = require('./../helpers/mysql.server')

const Location = require('./../models/location.model')(getInstance(), DataTypes)
const Listing = require('./../models/listing.model')(getInstance(), DataTypes)
const ListingData = require('./../models/listingData.model')(getInstance(), DataTypes)
const ListSettingsParent = require('./../models/listSettingsParent.model')(getInstance(), DataTypes)
const ListSettings = require('./../models/listSettings.model')(getInstance(), DataTypes)
const User = require('./../models/user.model')(getInstance(), DataTypes)
const UserProfile = require('./../models/userProfile.model')(getInstance(), DataTypes)
const ListingPhotos = require('./../models/listingPhotos.model')(getInstance(), DataTypes)
const SubcategorySpecifications = require('./../models/subCategorySpecifications.model')(getInstance(), DataTypes)

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
