const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

// Define models
const User = sequelize.define('User', {
  username: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  role: {
    type: Sequelize.STRING,
    defaultValue: 'user'
  }
});

const FinancialDataset = sequelize.define('FinancialDataset', {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT
  },
  sourceType: {
    type: Sequelize.STRING
  },
  format: {
    type: Sequelize.STRING
  },
  columns: {
    type: Sequelize.TEXT, // JSON stringified
    get() {
      const value = this.getDataValue('columns');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('columns', JSON.stringify(value));
    }
  },
  rowCount: {
    type: Sequelize.INTEGER
  },
  dataHash: {
    type: Sequelize.STRING
  },
  storageKey: {
    type: Sequelize.STRING
  },
  fileContent: {
    type: Sequelize.TEXT // Storing CSV content directly
  }
});

const DataTransformation = sequelize.define('DataTransformation', {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  operation: {
    type: Sequelize.STRING
  },
  parameters: {
    type: Sequelize.TEXT, // JSON stringified
    get() {
      const value = this.getDataValue('parameters');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('parameters', JSON.stringify(value));
    }
  },
  originalDataHash: {
    type: Sequelize.STRING
  },
  resultPreview: {
    type: Sequelize.TEXT, // JSON stringified
    get() {
      const value = this.getDataValue('resultPreview');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('resultPreview', JSON.stringify(value));
    }
  },
  status: {
    type: Sequelize.STRING
  },
  executionTime: {
    type: Sequelize.INTEGER
  }
});

const FinancialDocument = sequelize.define('FinancialDocument', {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  type: {
    type: Sequelize.STRING
  },
  content: {
    type: Sequelize.TEXT
  },
  metadata: {
    type: Sequelize.TEXT, // JSON stringified
    get() {
      const value = this.getDataValue('metadata');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('metadata', JSON.stringify(value));
    }
  },
  vectorId: {
    type: Sequelize.STRING
  }
});

const TimelineEvent = sequelize.define('TimelineEvent', {
  sessionId: {
    type: Sequelize.STRING
  },
  stepKey: {
    type: Sequelize.STRING
  },
  details: {
    type: Sequelize.TEXT, // JSON stringified
    get() {
      const value = this.getDataValue('details');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('details', JSON.stringify(value));
    }
  },
  timestamp: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
});

// Define associations
User.hasMany(FinancialDocument, { foreignKey: 'userId' });
FinancialDocument.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(FinancialDataset, { foreignKey: 'userId' });
FinancialDataset.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(DataTransformation, { foreignKey: 'userId' });
DataTransformation.belongsTo(User, { foreignKey: 'userId' });

FinancialDataset.hasMany(DataTransformation, { foreignKey: 'datasetId' });
DataTransformation.belongsTo(FinancialDataset, { foreignKey: 'datasetId' });

User.hasMany(TimelineEvent, { foreignKey: 'userId' });
TimelineEvent.belongsTo(User, { foreignKey: 'userId' });

FinancialDataset.hasMany(TimelineEvent, { foreignKey: 'datasetId' });
TimelineEvent.belongsTo(FinancialDataset, { foreignKey: 'datasetId' });

// Export models
const models = {
  User,
  FinancialDataset,
  DataTransformation,
  FinancialDocument,
  TimelineEvent
};

// Setup function
const setupDatabase = async () => {
  try {
    // Sync all models with the database
    await sequelize.sync({ alter: true });
    console.log('Database schema synchronized');
    
    // Check if users exist
    const userCount = await User.count();
    
    // Only seed if no users exist
    if (userCount === 0) {
      console.log('Seeding database with initial data...');
      
      // Create demo users
      const users = await User.bulkCreate([
        {
          username: 'admin',
          email: 'admin@bruno-ai.com',
          password: await bcrypt.hash('password123', 10),
          role: 'admin'
        },
        {
          username: 'demo',
          email: 'demo@bruno-ai.com',
          password: await bcrypt.hash('demo123', 10),
          role: 'user'
        }
      ]);
      console.log(`Created ${users.length} users`);
      
      // Create sample financial documents
      const documents = await FinancialDocument.bulkCreate([
        {
          name: 'Q1 Financial Report',
          type: 'report',
          content: 'This is a sample Q1 financial report showing revenue increased by 15% compared to the previous quarter. Major growth areas include North American markets where Widget B sales exceeded projections by 22%. European markets showed steady growth with Widget C becoming the top performer in March.',
          metadata: JSON.stringify({
            author: 'Finance Team',
            dateCreated: '2024-04-15',
            confidentiality: 'internal'
          }),
          vectorId: 'vec_123456',
          userId: 1
        },
        {
          name: 'Budget Forecast 2025',
          type: 'forecast',
          content: 'Budget forecast for 2025 showing projected growth of 20% in core business units. Marketing budget will increase by 15% to support expansion into APAC markets. R&D allocations will grow by 25% to accelerate Widget D development timeline. Capital expenditures are expected to remain flat year-over-year.',
          metadata: JSON.stringify({
            author: 'Strategic Planning',
            dateCreated: '2024-09-30',
            confidentiality: 'restricted'
          }),
          vectorId: 'vec_654321',
          userId: 1
        }
      ]);
      console.log(`Created ${documents.length} financial documents`);
      
      // Sample CSV data for a revenue dataset
      const revenueCSV = `Date,Product,Region,Revenue,Quantity
2024-01-15,Widget A,North America,58000,1160
2024-01-22,Widget B,Europe,62500,500
2024-02-05,Widget C,Asia Pacific,45000,900
2024-02-15,Widget A,Europe,32000,640
2024-03-01,Widget B,North America,72000,576
2024-03-15,Widget C,Europe,38500,770
2024-04-05,Widget A,Asia Pacific,49200,984
2024-04-18,Widget B,North America,81500,652
2024-05-02,Widget C,Europe,35700,714
2024-05-20,Widget A,Asia Pacific,52300,1046
2024-06-05,Widget B,North America,67800,542
2024-06-22,Widget C,Europe,41200,824`;
      
      // Create sample dataset
      const dataset = await FinancialDataset.create({
        name: 'Q1-Q2 2024 Revenue Data',
        description: 'Six-month revenue breakdown by product and region',
        sourceType: 'upload',
        format: 'csv',
        columns: JSON.stringify([
          { name: 'Date', type: 'date' },
          { name: 'Product', type: 'string' },
          { name: 'Region', type: 'string' },
          { name: 'Revenue', type: 'number' },
          { name: 'Quantity', type: 'number' }
        ]),
        rowCount: 12,
        dataHash: 'abc123def456',
        storageKey: 'user_1/abc123def456/revenue_2024.csv',
        fileContent: revenueCSV,
        userId: 1
      });
      console.log('Created sample dataset');
      
      // Create sample transformation
      const transformation = await DataTransformation.create({
        name: 'Filter European Sales',
        operation: 'filter',
        parameters: JSON.stringify({
          columns: ['Region'],
          conditions: {
            column: 'Region',
            value: 'Europe'
          }
        }),
        originalDataHash: 'abc123def456',
        resultPreview: JSON.stringify([
          { Date: '2024-01-22', Product: 'Widget B', Region: 'Europe', Revenue: 62500, Quantity: 500 },
          { Date: '2024-02-15', Product: 'Widget A', Region: 'Europe', Revenue: 32000, Quantity: 640 },
          { Date: '2024-03-15', Product: 'Widget C', Region: 'Europe', Revenue: 38500, Quantity: 770 }
        ]),
        status: 'completed',
        executionTime: 1200,
        userId: 1,
        datasetId: dataset.id
      });
      console.log('Created sample transformation');
      
      // Create sample timeline event
      const timelineEvent = await TimelineEvent.create({
        userId: 1,
        sessionId: 'session_123456',
        stepKey: 'DATA_TRANSFORMATION',
        datasetId: dataset.id,
        details: JSON.stringify({
          operation: 'filter',
          resultRowCount: 4
        }),
        timestamp: new Date()
      });
      console.log('Created sample timeline event');
    } else {
      console.log('Database already contains data, skipping seed');
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
};

// Export models and setup function
module.exports = {
  sequelize,
  models,
  setupDatabase
};

// If this script is run directly, execute the setup
if (require.main === module) {
  setupDatabase().then(() => {
    console.log('Setup completed, exiting...');
    process.exit(0);
  }).catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}
