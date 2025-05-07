const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'analyst', 'viewer'),
      defaultValue: 'analyst'
    },
    lastLogin: {
      type: DataTypes.DATE
    },
    apiKey: {
      type: DataTypes.STRING,
      unique: true
    }
  }, {
    timestamps: true
  });

  return User;
};