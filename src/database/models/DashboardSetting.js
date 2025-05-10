const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DashboardSetting = sequelize.define('DashboardSetting', {
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
    settings: {
      type: DataTypes.TEXT,
      allowNull: false
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
    tableName: 'DashboardSettings' // Important: Match the SQL table name
  });

  DashboardSetting.associate = (models) => {
    DashboardSetting.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return DashboardSetting;
};
