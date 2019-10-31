'use strict'

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Availabilities',
    {
      availabilityId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        primaryKey: true
      },
      bookingId: {
        type: DataTypes.STRING(36),
        allowNull: true
      },
      listingId: {
        type: DataTypes.INTEGER(11),
        allowNull: false
      },
      blockedDates: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    },
    {
      tableName: 'Availabilities'
    }
  )
}
