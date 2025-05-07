const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const config = require('../../config/database');

// Create Sequelize instance
let sequelize;
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      dialect: config.dialect,
      logging: config.logging ? console.log : false,
      pool: config.pool
    }
  );
}

const db = {};

// Import all model files
fs.readdirSync(__dirname)
  .filter(file => (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) === '.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize);
    db[model.name] = model;
  });

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Define model associations
db.User.hasMany(db.FinancialDocument, { foreignKey: 'userId' });
db.FinancialDocument.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.FinancialDataset, { foreignKey: 'userId' });
db.FinancialDataset.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.DataTransformation, { foreignKey: 'userId' });
db.DataTransformation.belongsTo(db.User, { foreignKey: 'userId' });

db.FinancialDataset.hasMany(db.DataTransformation, { foreignKey: 'datasetId' });
db.DataTransformation.belongsTo(db.FinancialDataset, { foreignKey: 'datasetId' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;