const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FinancialDataset = sequelize.define('FinancialDataset', {
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
    sourceType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    format: {
      type: DataTypes.STRING,
      allowNull: false
    },
    columns: {
      type: DataTypes.TEXT
    },
    rowCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    dataHash: {
      type: DataTypes.STRING
    },
    storageKey: {
      type: DataTypes.STRING
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
    tableName: 'FinancialDatasets' // Important: Match the SQL table name
  });

  FinancialDataset.associate = (models) => {
    FinancialDataset.belongsTo(models.User, { foreignKey: 'userId' });
    FinancialDataset.hasMany(models.DataTransformation, { foreignKey: 'datasetId' });
    FinancialDataset.hasMany(models.TimelineEvent, { foreignKey: 'datasetId' });
    FinancialDataset.hasMany(models.VectorEmbedding, { foreignKey: 'datasetId' });
    FinancialDataset.hasMany(models.AnalysisReport, { foreignKey: 'datasetId' });
    FinancialDataset.hasMany(models.TimeSeriesModel, { foreignKey: 'datasetId' });
  };

  return FinancialDataset;
};
