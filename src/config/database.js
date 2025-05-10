const { Sequelize } = require('sequelize');

// Database connection
const config = {
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'bruno_ai_db',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: process.env.NODE_ENV !== 'production',
  dialectOptions: {
    ssl: process.env.DB_SSL === 'false' ? false : {
      require: true,
      rejectUnauthorized: false // This is the key setting to fix the SSL issue
    }
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Use connection URL if provided, otherwise use individual params
let sequelize;
if (process.env.DB_URL) {
  console.log('Using database connection URL');
  sequelize = new Sequelize(process.env.DB_URL, {
    dialect: 'postgres',
    logging: config.logging,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Disables certificate validation
      }
    },
    pool: config.pool
  });
} else {
  console.log('Using individual database connection parameters');
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      dialect: config.dialect,
      logging: config.logging,
      dialectOptions: config.dialectOptions,
      pool: config.pool
    }
  );
}

// Test database connection
const testConnection = async () => {
  let retries = 5;
  while (retries) {
    try {
      await sequelize.authenticate();
      console.log('Database connection has been established successfully.');
      return true;
    } catch (error) {
      console.error(`Unable to connect to the database (${retries} retries left):`, error);
      retries -= 1;
      if (retries === 0) {
        if (process.env.NODE_ENV === 'production') {
          console.error('Failed to connect to database in production, but continuing anyway');
          return false;
        }
        return false;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  return false;
};

module.exports = {
  sequelize,
  testConnection
};