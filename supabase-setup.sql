-- Bruno AI Database Setup for Supabase
-- Copy and paste this into Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS "Users" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) DEFAULT 'user',
  "lastLogin" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create a default admin user if none exists
INSERT INTO "Users" ("username", "email", "password", "role")
SELECT 'admin', 'admin@bruno-ai.com', '$2b$10$7JL4FjHH9TEieznJrQJBJe6TlQJFYyB5vbHFZ5YUPRZgWYGqNj8tq', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM "Users" LIMIT 1);

-- Financial Datasets Table
CREATE TABLE IF NOT EXISTS "FinancialDatasets" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "sourceType" VARCHAR(50) NOT NULL,
  "format" VARCHAR(50) NOT NULL,
  "columns" TEXT,
  "rowCount" INTEGER NOT NULL DEFAULT 0,
  "dataHash" VARCHAR(255),
  "storageKey" VARCHAR(255),
  "userId" INTEGER REFERENCES "Users"("id"),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Data Transformations Table
CREATE TABLE IF NOT EXISTS "DataTransformations" (
  "id" SERIAL PRIMARY KEY,
  "datasetId" INTEGER REFERENCES "FinancialDatasets"("id"),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "operation" VARCHAR(100) NOT NULL,
  "parameters" TEXT NOT NULL,
  "resultPreview" TEXT,
  "userId" INTEGER REFERENCES "Users"("id"),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Timeline Events Table
CREATE TABLE IF NOT EXISTS "TimelineEvents" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "Users"("id"),
  "sessionId" VARCHAR(255),
  "stepKey" VARCHAR(100) NOT NULL,
  "datasetId" INTEGER REFERENCES "FinancialDatasets"("id"),
  "transformationId" INTEGER REFERENCES "DataTransformations"("id"),
  "details" TEXT,
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Vector Embeddings Table
CREATE TABLE IF NOT EXISTS "VectorEmbeddings" (
  "id" SERIAL PRIMARY KEY,
  "datasetId" INTEGER REFERENCES "FinancialDatasets"("id"),
  "rowIndex" INTEGER NOT NULL,
  "vectorData" TEXT NOT NULL,
  "metadata" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Dashboard Settings Table
CREATE TABLE IF NOT EXISTS "DashboardSettings" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "Users"("id"),
  "settings" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Analysis Reports Table
CREATE TABLE IF NOT EXISTS "AnalysisReports" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "datasetId" INTEGER REFERENCES "FinancialDatasets"("id"),
  "transformationId" INTEGER REFERENCES "DataTransformations"("id"),
  "type" VARCHAR(100) NOT NULL,
  "results" TEXT NOT NULL,
  "userId" INTEGER REFERENCES "Users"("id"),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Time Series Models Table
CREATE TABLE IF NOT EXISTS "TimeSeriesModels" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "datasetId" INTEGER REFERENCES "FinancialDatasets"("id"),
  "algorithm" VARCHAR(100) NOT NULL,
  "parameters" TEXT NOT NULL,
  "metrics" TEXT,
  "modelPath" VARCHAR(255),
  "userId" INTEGER REFERENCES "Users"("id"),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- API Keys Table
CREATE TABLE IF NOT EXISTS "ApiKeys" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "Users"("id"),
  "keyName" VARCHAR(255) NOT NULL,
  "keyValue" VARCHAR(255) NOT NULL,
  "permissions" TEXT,
  "lastUsed" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ERP Connections Table
CREATE TABLE IF NOT EXISTS "ErpConnections" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "Users"("id"),
  "name" VARCHAR(255) NOT NULL,
  "type" VARCHAR(100) NOT NULL,
  "config" TEXT NOT NULL,
  "status" VARCHAR(50) DEFAULT 'active',
  "lastSync" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SAMPLE DATA

-- Sample Financial Datasets
INSERT INTO "FinancialDatasets" (name, description, "sourceType", format, columns, "rowCount", "dataHash", "storageKey", "userId", "createdAt", "updatedAt")
VALUES
  ('Revenue Analysis 2024', 'Quarterly revenue data for financial year 2024', 'upload', 'csv', 
   '[{"name":"quarter","type":"string"},{"name":"revenue","type":"number"},{"name":"expenses","type":"number"},{"name":"profit","type":"number"}]', 
   4, 'abc123', 'sample_data/revenue_2024.csv', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  ('Customer Segmentation', 'Customer segmentation data with revenue contributions', 'upload', 'csv', 
   '[{"name":"segment","type":"string"},{"name":"count","type":"number"},{"name":"revenue","type":"number"},{"name":"average_value","type":"number"}]', 
   5, 'def456', 'sample_data/customer_segments.csv', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  ('Monthly Expenses 2024', 'Detailed monthly expenses breakdown', 'upload', 'csv', 
   '[{"name":"month","type":"string"},{"name":"category","type":"string"},{"name":"amount","type":"number"},{"name":"department","type":"string"}]', 
   48, 'ghi789', 'sample_data/monthly_expenses.csv', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Sample Data Transformations
INSERT INTO "DataTransformations" (name, description, operation, parameters, "resultPreview", "datasetId", "userId", "createdAt", "updatedAt")
VALUES
  ('Filter Q1 Data', 'Filter data to show only Q1 figures', 'filter', 
   '{"column":"quarter","value":"Q1"}', 
   '{"filtered_count":1}', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  ('Sort by Revenue', 'Sort customer segments by revenue', 'sort', 
   '{"column":"revenue","order":"desc"}', 
   '{"sorted":true}', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  ('Remove Duplicate Categories', 'Remove redundant expense categories', 'remove_duplicates', 
   '{"columns":["category"]}', 
   '{"removed_count":3}', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Sample Dashboard Settings
INSERT INTO "DashboardSettings" ("userId", settings, "createdAt", "updatedAt")
VALUES
  (1, '{"theme":"light","layout":"grid","charts":[{"type":"bar","datasetId":1,"title":"Revenue by Quarter"},{"type":"pie","datasetId":2,"title":"Customer Segment Revenue"},{"type":"line","datasetId":3,"title":"Monthly Expenses Trend"}]}', 
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Sample Analysis Reports
INSERT INTO "AnalysisReports" (name, description, type, results, "datasetId", "transformationId", "userId", "createdAt", "updatedAt")
VALUES
  ('Q1 Revenue Analysis', 'Detailed analysis of Q1 revenue figures', 'financial', 
   '{"summary":{"revenue_total":125000,"expenses_total":75000,"profit_total":50000},"insights":["Q1 showed 15% increase YoY","Profit margins improved by 3%"]}', 
   1, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  ('Customer Segment Profitability', 'Analysis of most profitable customer segments', 'segment', 
   '{"summary":{"most_profitable":"Enterprise","least_profitable":"Small Business"},"insights":["Enterprise segment has 35% higher LTV","SMB segment shows fastest growth rate"]}', 
   2, 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Verify tables created and data insertion
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';