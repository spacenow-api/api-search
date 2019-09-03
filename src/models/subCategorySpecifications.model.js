'use strict'

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'SubcategorySpecifications',
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
      listSettingsSpecificationId: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        references: {
          model: 'ListSettings',
          key: 'id'
        }
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'SubcategorySpecifications'
    }
  )
}
