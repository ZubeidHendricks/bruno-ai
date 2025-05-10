const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Create Sequelize instance based on environment variables
const setupSequelize = () => {
  let sequelizeInstance;
  
  try {
    // Use connection URL if provided
    if (process.env.DB_URL) {
      console.log('Using database connection URL');
      sequelizeInstance = new Sequelize(process.env.DB_URL, {
        dialect: 'postgres',
        logging: process.env.NODE_ENV !== 'production',
        dialectOptions: {
          ssl: process.env.DB_SSL === 'false' ? false : {
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
      });
    } else {
      // Use individual connection parameters
      console.log('Using individual database connection parameters');
      sequelizeInstance = new Sequelize(
        process.env.DB_NAME || 'postgres',
        process.env.DB_USERNAME || 'postgres',
        process.env.DB_PASSWORD || 'postgres',
        {
          host: process.env.DB_HOST || 'localhost',
          dialect: 'postgres',
          logging: process.env.NODE_ENV !== 'production',
          dialectOptions: {
            ssl: process.env.DB_SSL === 'false' ? false : {
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
        }
      );
    }
    
    return sequelizeInstance;
  } catch (error) {
    console.error('Error setting up Sequelize:', error);
    // In production, return a dummy Sequelize instance that won't crash the app
    if (process.env.NODE_ENV === 'production') {
      console.warn('Creating fallback Sequelize instance for production');
      // Return a real sequelize instance but operations will likely fail
      return new Sequelize('sqlite::memory:');
    }
    throw error;
  }
};

// Set up database connection with error handling
let sequelize;
try {
  sequelize = setupSequelize();
} catch (error) {
  console.error('Failed to initialize Sequelize:', error);
  if (process.env.NODE_ENV === 'production') {
    console.warn('Using memory SQLite as fallback in production');
    sequelize = new Sequelize('sqlite::memory:');
  } else {
    throw error;
  }
}

const db = {};

// Import all model files with error handling
try {
  fs.readdirSync(__dirname)
    .filter(file => (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) === '.js'))
    .forEach(file => {
      try {
        const model = require(path.join(__dirname, file))(sequelize);
        db[model.name] = model;
      } catch (error) {
        console.error(`Error loading model ${file}:`, error);
        // In production, continue loading other models
        if (process.env.NODE_ENV !== 'production') {
          throw error;
        }
      }
    });

  // Define associations with error handling
  Object.keys(db).forEach(modelName => {
    if (db[modelName] && db[modelName].associate) {
      try {
        db[modelName].associate(db);
      } catch (error) {
        console.error(`Error setting up associations for ${modelName}:`, error);
        // In production, continue with other models
        if (process.env.NODE_ENV !== 'production') {
          throw error;
        }
      }
    }
  });

  // Define model associations with error handling
  try {
    if (db.User && db.FinancialDocument) {
      db.User.hasMany(db.FinancialDocument, { foreignKey: 'userId' });
      db.FinancialDocument.belongsTo(db.User, { foreignKey: 'userId' });
    }

    if (db.User && db.FinancialDataset) {
      db.User.hasMany(db.FinancialDataset, { foreignKey: 'userId' });
      db.FinancialDataset.belongsTo(db.User, { foreignKey: 'userId' });
    }

    if (db.User && db.DataTransformation) {
      db.User.hasMany(db.DataTransformation, { foreignKey: 'userId' });
      db.DataTransformation.belongsTo(db.User, { foreignKey: 'userId' });
    }

    if (db.FinancialDataset && db.DataTransformation) {
      db.FinancialDataset.hasMany(db.DataTransformation, { foreignKey: 'datasetId' });
      db.DataTransformation.belongsTo(db.FinancialDataset, { foreignKey: 'datasetId' });
    }
  } catch (error) {
    console.error('Error setting up associations:', error);
    // In production, continue anyway
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
  }
} catch (error) {
  console.error('Error setting up models:', error);
  // In production, provide minimal DB object
  if (process.env.NODE_ENV === 'production') {
    console.warn('Providing minimal DB object for production');
  } else {
    throw error;
  }
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Test database connection on startup
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

db.testConnection = testConnection;

module.exports = db;