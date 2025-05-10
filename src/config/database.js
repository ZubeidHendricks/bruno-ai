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

// Database connection - Try multiple connection strings
const config = {
  // Default config using individual params
  username: process.env.POSTGRES_USER || process.env.DB_USERNAME || 'bruno_ai_db_owner',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'npg_W7AH0svxRmLr',
  database: process.env.POSTGRES_DATABASE || process.env.DB_NAME || 'bruno_ai_db',
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'ep-hidden-frog-a412hxf4-pooler.us-east-1.aws.neon.tech',
  port: 5432,
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

// Try multiple connection strings in order
const connectionStrings = [
  // Try the provided DB_URL first
  process.env.DB_URL,
  
  // Try the Neon PostgreSQL connection string
  "postgresql://bruno_ai_db_owner:npg_W7AH0svxRmLr@ep-hidden-frog-a412hxf4-pooler.us-east-1.aws.neon.tech/bruno_ai_db?sslmode=require",
  
  // Try different Supabase connection formats
  `postgresql://postgres:${process.env.POSTGRES_PASSWORD || 'RqNtxWvpcw6DiKzf'}@db.vatitwmdtipuemrvxpne.supabase.co:5432/postgres?sslmode=require`,
  
  `postgresql://postgres.vatitwmdtipuemrvxpne:${process.env.POSTGRES_PASSWORD || 'RqNtxWvpcw6DiKzf'}@db.vatitwmdtipuemrvxpne.supabase.co:5432/postgres?sslmode=require`
];

// Filter out undefined or empty connection strings
const validConnectionStrings = connectionStrings.filter(cs => cs && cs.trim() !== '');

// Log connection attempt strategy
console.log(`Attempting to connect using ${validConnectionStrings.length} different connection strings...`);

if (validConnectionStrings.length > 0) {
  console.log('Using database connection URL');
  
  // Use the first connection string
  const connectionUrl = validConnectionStrings[0];
  // Mask the password in the log
  const maskedUrl = connectionUrl.replace(/:[^:]*@/, ':***@');
  console.log('Trying connection string (masked):', maskedUrl);
  
  sequelize = new Sequelize(connectionUrl, {
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
  console.log('Host:', config.host);
  console.log('Database:', config.database);
  console.log('Username:', config.username);
  
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

// Test database connection with fallback to alternative connection strings
const testConnection = async () => {
  let retries = 5;
  let currentConnectionIndex = 0;
  
  while (retries) {
    try {
      await sequelize.authenticate();
      console.log('Database connection has been established successfully.');
      return true;
    } catch (error) {
      console.error(`Unable to connect to the database (${retries} retries left):`, error);
      
      // Try the next connection string if available
      currentConnectionIndex++;
      if (currentConnectionIndex < validConnectionStrings.length) {
        const nextConnectionUrl = validConnectionStrings[currentConnectionIndex];
        const maskedUrl = nextConnectionUrl.replace(/:[^:]*@/, ':***@');
        console.log(`Trying alternative connection string ${currentConnectionIndex}:`, maskedUrl);
        
        sequelize = new Sequelize(nextConnectionUrl, {
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
        
        // Don't decrement retries when trying a new connection string
        continue;
      }
      
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