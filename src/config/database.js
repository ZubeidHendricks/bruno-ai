const { Sequelize } = require('sequelize');

// Debug env variables (masking sensitive info)
console.log('========== DATABASE CONNECTION CONFIG ==========');
console.log('DB_URL:', process.env.DB_URL ? '***PROVIDED***' : '***MISSING***');
console.log('POSTGRES_USER:', process.env.POSTGRES_USER || '***MISSING***');
console.log('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD ? '***PROVIDED***' : '***MISSING***');
console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST || '***MISSING***');
console.log('POSTGRES_DATABASE:', process.env.POSTGRES_DATABASE || '***MISSING***');
console.log('DB_SSL:', process.env.DB_SSL || 'true');
console.log('=============================================');

// Database connection - Supabase specific configuration
const config = {
  username: process.env.POSTGRES_USER || 'postgres.vatitwmdtipuemrvxpne',
  password: process.env.POSTGRES_PASSWORD || '',
  database: process.env.POSTGRES_DATABASE || 'postgres',
  host: process.env.POSTGRES_HOST || 'aws-0-us-east-1.pooler.supabase.com',
  port: 6543, // Supabase pooler port
  dialect: 'postgres',
  logging: process.env.NODE_ENV !== 'production',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
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
        rejectUnauthorized: false
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
      port: config.port,
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