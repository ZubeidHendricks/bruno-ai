const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VectorEmbedding = sequelize.define('VectorEmbedding', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    datasetId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'FinancialDatasets',
        key: 'id'
      }
    },
    rowIndex: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    vectorData: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    metadata: {
      type: DataTypes.TEXT
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
    tableName: 'VectorEmbeddings' // Important: Match the SQL table name
  });

  VectorEmbedding.associate = (models) => {
    VectorEmbedding.belongsTo(models.FinancialDataset, { foreignKey: 'datasetId' });
  };

  return VectorEmbedding;
};
