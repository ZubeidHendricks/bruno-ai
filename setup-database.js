const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Create database connection
const config = {
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'bruno_ai_db',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: console.log
};

// Create Sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: config.logging,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const db = require('./src/database/models');

// Create data directory
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Sample data
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

const expenseCSV = `Date,Department,Category,Amount,Description
2024-01-10,Sales,Travel,3500,Client meetings in Chicago
2024-01-15,Engineering,Equipment,12000,Development server upgrades
2024-01-28,Marketing,Advertising,8500,Social media campaign
2024-02-05,HR,Training,4200,Leadership workshop
2024-02-18,Finance,Software,2800,Accounting software licenses
2024-03-05,Sales,Entertainment,1500,Client dinner event
2024-03-15,Engineering,Salaries,85000,Engineering team monthly payroll
2024-03-28,Marketing,Services,6200,SEO optimization services
2024-04-05,Operations,Utilities,3700,Office utilities monthly bill
2024-04-18,Sales,Commissions,12500,Q1 sales commissions
2024-05-02,Engineering,Equipment,9800,Hardware upgrades
2024-05-15,Marketing,Events,15000,Industry conference sponsorship`;

const customerCSV = `CustomerID,Segment,AnnualSpend,LastPurchase,LoyaltyScore
C001,Premium,125000,2024-04-15,92
C002,Standard,47500,2024-03-12,78
C003,Premium,98000,2024-04-22,85
C004,Basic,18500,2024-02-05,54
C005,Premium,135000,2024-04-18,95
C006,Standard,52000,2024-03-28,72
C007,Basic,23500,2024-01-15,48
C008,Premium,112000,2024-04-05,89`;

// Function to set up database
async function setupDatabase() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    console.log('Syncing database models...');
    await sequelize.sync({ force: true });
    console.log('Database models synchronized successfully.');
    
    console.log('Seeding database...');
    await seedDatabase();
    console.log('Database seeded successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

// Function to seed database with initial data
async function seedDatabase() {
  // Create users
  const users = await db.User.bulkCreate([
    {
      username: 'admin',
      email: 'admin@bruno-ai.com',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'demo',
      email: 'demo@bruno-ai.com',
      password: await bcrypt.hash('demo123', 10),
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  
  console.log(`Created ${users.length} users.`);
  
  // Create user data directories
  fs.mkdirSync(path.join(DATA_DIR, 'user_1'), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'user_2'), { recursive: true });
  
  // Define dataset hashes
  const revenueHash = 'abc123def456';
  const expenseHash = 'def456abc789';
  const customerHash = '789abc123def';
  
  // Create directories for dataset storage
  fs.mkdirSync(path.join(DATA_DIR, 'user_1', revenueHash), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'user_1', expenseHash), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'user_2', customerHash), { recursive: true });
  
  // Write CSV files
  fs.writeFileSync(path.join(DATA_DIR, 'user_1', revenueHash, 'revenue_2024.csv'), revenueCSV);
  fs.writeFileSync(path.join(DATA_DIR, 'user_1', expenseHash, 'expenses_2024.csv'), expenseCSV);
  fs.writeFileSync(path.join(DATA_DIR, 'user_2', customerHash, 'customer_segments.csv'), customerCSV);
  
  // Create financial datasets
  const datasets = await db.FinancialDataset.bulkCreate([
    {
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
      dataHash: revenueHash,
      storageKey: `user_1/${revenueHash}/revenue_2024.csv`,
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Expense Report 2024',
      description: 'Detailed breakdown of company expenses',
      sourceType: 'upload',
      format: 'csv',
      columns: JSON.stringify([
        { name: 'Date', type: 'date' },
        { name: 'Department', type: 'string' },
        { name: 'Category', type: 'string' },
        { name: 'Amount', type: 'number' },
        { name: 'Description', type: 'string' }
      ]),
      rowCount: 12,
      dataHash: expenseHash,
      storageKey: `user_1/${expenseHash}/expenses_2024.csv`,
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Customer Segments',
      description: 'Customer segmentation data based on purchase behavior',
      sourceType: 'upload',
      format: 'csv',
      columns: JSON.stringify([
        { name: 'CustomerID', type: 'string' },
        { name: 'Segment', type: 'string' },
        { name: 'AnnualSpend', type: 'number' },
        { name: 'LastPurchase', type: 'date' },
        { name: 'LoyaltyScore', type: 'number' }
      ]),
      rowCount: 8,
      dataHash: customerHash,
      storageKey: `user_2/${customerHash}/customer_segments.csv`,
      userId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  
  console.log(`Created ${datasets.length} datasets.`);
  
  // Create data transformations
  const transformations = await db.DataTransformation.bulkCreate([
    {
      name: 'Filter European Sales',
      operation: 'filter',
      parameters: JSON.stringify({
        columns: ['Region'],
        conditions: {
          column: 'Region',
          value: 'Europe'
        }
      }),
      originalDataHash: revenueHash,
      resultPreview: JSON.stringify([
        { Date: '2024-01-22', Product: 'Widget B', Region: 'Europe', Revenue: 62500, Quantity: 500 },
        { Date: '2024-02-15', Product: 'Widget A', Region: 'Europe', Revenue: 32000, Quantity: 640 },
        { Date: '2024-03-15', Product: 'Widget C', Region: 'Europe', Revenue: 38500, Quantity: 770 }
      ]),
      status: 'completed',
      executionTime: 1200,
      userId: 1,
      datasetId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Sort by Revenue',
      operation: 'sort',
      parameters: JSON.stringify({
        columns: ['Revenue'],
        conditions: {
          order: 'desc'
        }
      }),
      originalDataHash: revenueHash,
      resultPreview: JSON.stringify([
        { Date: '2024-04-18', Product: 'Widget B', Region: 'North America', Revenue: 81500, Quantity: 652 },
        { Date: '2024-03-01', Product: 'Widget B', Region: 'North America', Revenue: 72000, Quantity: 576 },
        { Date: '2024-06-05', Product: 'Widget B', Region: 'North America', Revenue: 67800, Quantity: 542 }
      ]),
      status: 'completed',
      executionTime: 850,
      userId: 1,
      datasetId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Filter Marketing Expenses',
      operation: 'filter',
      parameters: JSON.stringify({
        columns: ['Department'],
        conditions: {
          column: 'Department',
          value: 'Marketing'
        }
      }),
      originalDataHash: expenseHash,
      resultPreview: JSON.stringify([
        { Date: '2024-01-28', Department: 'Marketing', Category: 'Advertising', Amount: 8500, Description: 'Social media campaign' },
        { Date: '2024-03-28', Department: 'Marketing', Category: 'Services', Amount: 6200, Description: 'SEO optimization services' },
        { Date: '2024-05-15', Department: 'Marketing', Category: 'Events', Amount: 15000, Description: 'Industry conference sponsorship' }
      ]),
      status: 'completed',
      executionTime: 750,
      userId: 1,
      datasetId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  
  console.log(`Created ${transformations.length} data transformations.`);
  
  // Create financial documents
  const documents = await db.FinancialDocument.bulkCreate([
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
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
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
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Expense Policy',
      type: 'policy',
      content: 'Company expense policy detailing approved expense categories, reimbursement procedures, and spending limits by department. Travel expenses require manager approval for any amount over $500. Software purchases must go through IT procurement. Equipment purchases over $2,000 require director-level approval. All expense reports must be submitted within 30 days.',
      metadata: JSON.stringify({
        author: 'Finance Team',
        dateCreated: '2024-01-15',
        confidentiality: 'public'
      }),
      vectorId: 'vec_789012',
      userId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  
  console.log(`Created ${documents.length} financial documents.`);
  
  // Create timeline events
  const timeline = await db.TimelineEvent.bulkCreate([
    {
      userId: 1,
      sessionId: 'session_123456',
      stepKey: 'DATA_UPLOAD',
      datasetId: 1,
      details: JSON.stringify({
        fileName: 'revenue_2024.csv',
        fileSize: 1024,
        mimeType: 'text/csv'
      }),
      timestamp: new Date('2024-04-15T14:30:00'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      userId: 1,
      sessionId: 'session_123456',
      stepKey: 'DATA_VALIDATION',
      datasetId: 1,
      details: JSON.stringify({
        validRows: 12,
        invalidRows: 0,
        columnsValidated: 5
      }),
      timestamp: new Date('2024-04-15T14:30:15'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      userId: 1,
      sessionId: 'session_123456',
      stepKey: 'NLP_PROCESSING',
      datasetId: 1,
      details: JSON.stringify({
        userInput: 'Filter data to show only European sales',
        intent: 'filter',
        confidence: 0.95
      }),
      timestamp: new Date('2024-04-15T14:31:00'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      userId: 1,
      sessionId: 'session_123456',
      stepKey: 'DATA_TRANSFORMATION',
      datasetId: 1,
      details: JSON.stringify({
        operation: 'filter',
        resultRowCount: 4
      }),
      timestamp: new Date('2024-04-15T14:31:30'),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  
  console.log(`Created ${timeline.length} timeline events.`);
}

// Run the setup
setupDatabase();
