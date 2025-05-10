-- PostgreSQL Setup Script for Bruno AI
-- Run this script against your Supabase PostgreSQL database

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_datasets_user" ON "FinancialDatasets" ("userId");
CREATE INDEX IF NOT EXISTS "idx_transformations_dataset" ON "DataTransformations" ("datasetId");
CREATE INDEX IF NOT EXISTS "idx_timeline_session" ON "TimelineEvents" ("sessionId");
CREATE INDEX IF NOT EXISTS "idx_timeline_user" ON "TimelineEvents" ("userId");
CREATE INDEX IF NOT EXISTS "idx_embeddings_dataset" ON "VectorEmbeddings" ("datasetId");

-- Verify tables were created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';