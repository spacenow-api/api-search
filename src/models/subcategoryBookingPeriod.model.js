'use strict'

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'SubcategoryBookingPeriod',
    {
      id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      listSettingsParentId: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        references: {
          model: 'ListSettingsParent',
          key: 'id'
        }
      },
      monthly: {
        type: DataTypes.INTEGER(1),
        allowNull: true,
        defaultValue: '0'
      },
      weekly: {
        type: DataTypes.INTEGER(1),
        allowNull: true,
        defaultValue: '0'
      },
      daily: {
        type: DataTypes.INTEGER(1),
        allowNull: true,
        defaultValue: '0'
      },
      hourly: {
        type: DataTypes.INTEGER(1),
        allowNull: true,
        defaultValue: '0'
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
      tableName: 'SubcategoryBookingPeriod'
    }
  )
}
