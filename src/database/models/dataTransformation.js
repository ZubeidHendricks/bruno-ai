const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DataTransformation = sequelize.define('DataTransformation', {
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
    operation: {
      type: DataTypes.STRING,
      allowNull: false
    },
    parameters: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    originalDataHash: {
      type: DataTypes.STRING,
      comment: 'Hash of original data for tracking changes'
    },
    resultPreview: {
      type: DataTypes.JSONB
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    executionTime: {
      type: DataTypes.INTEGER,
      comment: 'Time in milliseconds to execute transformation'
    }
  }, {
    timestamps: true
  });

  return DataTransformation;
};