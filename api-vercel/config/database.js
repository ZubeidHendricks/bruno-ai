const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database configuration with SSL for cloud hosting
const sequelize = new Sequelize(process.env.DB_URL || process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: process.env.DB_SSL === 'true',
      rejectUnauthorized: false
    }
  },
  logging: process.env.NODE_ENV === 'development'
});

// Function to test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

module.exports = { sequelize, testConnection };
