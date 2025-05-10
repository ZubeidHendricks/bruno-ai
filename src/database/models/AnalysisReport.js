const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AnalysisReport = sequelize.define('AnalysisReport', {
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
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    results: {
      type: DataTypes.TEXT,
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
    tableName: 'AnalysisReports' // Important: Match the SQL table name
  });

  AnalysisReport.associate = (models) => {
    AnalysisReport.belongsTo(models.User, { foreignKey: 'userId' });
    AnalysisReport.belongsTo(models.FinancialDataset, { foreignKey: 'datasetId' });
    AnalysisReport.belongsTo(models.DataTransformation, { foreignKey: 'transformationId' });
  };

  return AnalysisReport;
};
