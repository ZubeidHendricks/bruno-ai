const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class TimelineEvent extends Model {
    static associate(models) {
      // Associate with user
      TimelineEvent.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      // Associate with dataset
      TimelineEvent.belongsTo(models.FinancialDataset, {
        foreignKey: 'datasetId',
        as: 'dataset'
      });
      
      // Associate with transformation
      TimelineEvent.belongsTo(models.DataTransformation, {
        foreignKey: 'transformationId',
        as: 'transformation'
      });
    }
  }
  
  TimelineEvent.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    datasetId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    transformationId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'For grouping events in the same session'
    },
    step: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Step number in the process (1-8)'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of the step (e.g., "Data Ingestion")'
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Brief description of the step'
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Detailed information about the step'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed'),
      defaultValue: 'completed',
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in milliseconds'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional contextual data'
    }
  }, {
    sequelize,
    modelName: 'TimelineEvent',
    tableName: 'timeline_events',
    timestamps: true
  });
  
  return TimelineEvent;
};
