const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TimeSeriesModel = sequelize.define('TimeSeriesModel', {
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
    algorithm: {
      type: DataTypes.STRING,
      allowNull: false
    },
    parameters: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    metrics: {
      type: DataTypes.TEXT
    },
    modelPath: {
      type: DataTypes.STRING
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
    tableName: 'TimeSeriesModels' // Important: Match the SQL table name
  });

  TimeSeriesModel.associate = (models) => {
    TimeSeriesModel.belongsTo(models.User, { foreignKey: 'userId' });
    TimeSeriesModel.belongsTo(models.FinancialDataset, { foreignKey: 'datasetId' });
  };

  return TimeSeriesModel;
};
