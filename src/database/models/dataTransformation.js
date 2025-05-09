const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DataTransformation = sequelize.define('DataTransformation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
      type: DataTypes.TEXT,
      allowNull: false
    },
    resultPreview: {
      type: DataTypes.TEXT
    },
    datasetId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'FinancialDatasets',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'DataTransformations' // Important: Match the SQL table name
  });

  DataTransformation.associate = (models) => {
    DataTransformation.belongsTo(models.FinancialDataset, { foreignKey: 'datasetId' });
    DataTransformation.belongsTo(models.User, { foreignKey: 'userId' });
    DataTransformation.hasMany(models.TimelineEvent, { foreignKey: 'transformationId' });
    DataTransformation.hasMany(models.AnalysisReport, { foreignKey: 'transformationId' });
  };

  return DataTransformation;
};
