const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FinancialDataset = sequelize.define('FinancialDataset', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    sourceType: {
      type: DataTypes.ENUM('upload', 'integration', 'generated'),
      defaultValue: 'upload'
    },
    format: {
      type: DataTypes.STRING,
      allowNull: false
    },
    columns: {
      type: DataTypes.JSONB,
      comment: 'Schema of the dataset columns'
    },
    rowCount: {
      type: DataTypes.INTEGER
    },
    dataHash: {
      type: DataTypes.STRING,
      comment: 'Hash of data for integrity verification'
    },
    storageKey: {
      type: DataTypes.STRING,
      comment: 'Key for retrieving the actual data from storage'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true
  });

  return FinancialDataset;
};