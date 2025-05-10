// Database setup script for Bruno AI
// Run this with: node setup-database.js

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection details
const connectionString = process.env.DB_URL || 
  'postgresql://postgres.vatitwmdtipuemrvxpne:RqNtxWvpcw6DiKzf@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require';

console.log('========== DATABASE SETUP SCRIPT ==========');
console.log('Connection string (partially masked):', 
  connectionString.replace(/:[^:]*@/, ':***@'));

async function setupDatabase() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('\nConnecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Run setup script
    const setupScriptPath = path.join(__dirname, 'db-setup.sql');
    console.log(`\nRunning database setup script from ${setupScriptPath}...`);
    
    if (!fs.existsSync(setupScriptPath)) {
      throw new Error(`Setup script not found at ${setupScriptPath}`);
    }
    
    const setupScript = fs.readFileSync(setupScriptPath, 'utf8');
    await client.query(setupScript);
    console.log('✅ Database tables created successfully');

    // Run sample data script
    const sampleDataPath = path.join(__dirname, 'sample-data.sql');
    console.log(`\nAdding sample data from ${sampleDataPath}...`);
    
    if (!fs.existsSync(sampleDataPath)) {
      throw new Error(`Sample data script not found at ${sampleDataPath}`);
    }
    
    const sampleDataScript = fs.readFileSync(sampleDataPath, 'utf8');
    await client.query(sampleDataScript);
    console.log('✅ Sample data added successfully');

    // Check if data was inserted correctly
    console.log('\nVerifying table counts:');
    const countResult = await client.query(`
      SELECT table_name, record_count FROM (
        SELECT 'Users' as table_name, COUNT(*) as record_count FROM "Users"
        UNION ALL
        SELECT 'FinancialDatasets', COUNT(*) FROM "FinancialDatasets"
        UNION ALL
        SELECT 'DataTransformations', COUNT(*) FROM "DataTransformations"
        UNION ALL
        SELECT 'TimelineEvents', COUNT(*) FROM "TimelineEvents"
        UNION ALL
        SELECT 'VectorEmbeddings', COUNT(*) FROM "VectorEmbeddings"
        UNION ALL
        SELECT 'DashboardSettings', COUNT(*) FROM "DashboardSettings"
        UNION ALL
        SELECT 'AnalysisReports', COUNT(*) FROM "AnalysisReports"
        UNION ALL
        SELECT 'TimeSeriesModels', COUNT(*) FROM "TimeSeriesModels"
        UNION ALL
        SELECT 'ApiKeys', COUNT(*) FROM "ApiKeys"
        UNION ALL
        SELECT 'ErpConnections', COUNT(*) FROM "ErpConnections"
      ) as counts
    `);
    
    countResult.rows.forEach(row => {
      console.log(`• ${row.table_name}: ${row.record_count} records`);
    });

    console.log('\n✅ Database setup completed successfully!');
    console.log('\nYou can now use the database with Bruno AI.');
    console.log('Default admin user: admin@bruno-ai.com');
    
  } catch (error) {
    console.error('\n❌ Error setting up database:', error);
  } finally {
    await client.end();
  }
}

setupDatabase();
