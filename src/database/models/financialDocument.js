const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FinancialDocument = sequelize.define('FinancialDocument', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    documentType: {
      type: DataTypes.ENUM('invoice', 'statement', 'report', 'analysis', 'other'),
      defaultValue: 'other'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    vectorId: {
      type: DataTypes.STRING,
      comment: 'Reference to vector in Weaviate'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    category: {
      type: DataTypes.STRING
    },
    date: {
      type: DataTypes.DATE
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2)
    }
  }, {
    timestamps: true
  });

  return FinancialDocument;
};