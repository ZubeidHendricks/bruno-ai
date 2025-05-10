const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TimelineEvent = sequelize.define('TimelineEvent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    sessionId: {
      type: DataTypes.STRING
    },
    stepKey: {
      type: DataTypes.STRING,
      allowNull: false
    },
    datasetId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'FinancialDatasets',
        key: 'id'
      }
    },
    transformationId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'DataTransformations',
        key: 'id'
      }
    },
    details: {
      type: DataTypes.TEXT
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
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
    tableName: 'TimelineEvents' // Important: Match the SQL table name
  });

  TimelineEvent.associate = (models) => {
    TimelineEvent.belongsTo(models.User, { foreignKey: 'userId' });
    TimelineEvent.belongsTo(models.FinancialDataset, { foreignKey: 'datasetId' });
    TimelineEvent.belongsTo(models.DataTransformation, { foreignKey: 'transformationId' });
  };

  return TimelineEvent;
};
