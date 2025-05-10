const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user'
    },
    lastLogin: {
      type: DataTypes.DATE
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
    tableName: 'Users' // Important: Match the SQL table name
  });

  User.associate = (models) => {
    User.hasMany(models.FinancialDataset, { foreignKey: 'userId' });
    User.hasMany(models.DataTransformation, { foreignKey: 'userId' });
    User.hasMany(models.TimelineEvent, { foreignKey: 'userId' });
    User.hasMany(models.AnalysisReport, { foreignKey: 'userId' });
    User.hasMany(models.ApiKey, { foreignKey: 'userId' });
    User.hasMany(models.ErpConnection, { foreignKey: 'userId' });
    User.hasMany(models.DashboardSetting, { foreignKey: 'userId' });
  };

  return User;
};
