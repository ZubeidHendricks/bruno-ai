-- Sample Data Script for Bruno AI
-- Run this after running db-setup.sql to populate the database with test data

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

-- Sample Timeline Events
INSERT INTO "TimelineEvents" ("userId", "sessionId", "stepKey", "datasetId", "transformationId", details, timestamp, "createdAt", "updatedAt")
VALUES
  (1, 'session_1683025987', 'DATA_UPLOAD', 1, NULL, 
   '{"fileName":"revenue_2024.csv","fileSize":2048,"mimeType":"text/csv"}', 
   CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  (1, 'session_1683025987', 'DATA_TRANSFORMATION', 1, 1, 
   '{"operation":"filter","parameters":{"column":"quarter","value":"Q1"}}', 
   CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  (1, 'session_1683042561', 'DATA_UPLOAD', 2, NULL, 
   '{"fileName":"customer_segments.csv","fileSize":1536,"mimeType":"text/csv"}', 
   CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  (1, 'session_1683042561', 'DATA_TRANSFORMATION', 2, 2, 
   '{"operation":"sort","parameters":{"column":"revenue","order":"desc"}}', 
   CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  (1, 'session_1683124897', 'DATA_UPLOAD', 3, NULL, 
   '{"fileName":"monthly_expenses.csv","fileSize":5120,"mimeType":"text/csv"}', 
   CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  (1, 'session_1683124897', 'DATA_TRANSFORMATION', 3, 3, 
   '{"operation":"remove_duplicates","parameters":{"columns":["category"]}}', 
   CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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

-- Sample Time Series Models
INSERT INTO "TimeSeriesModels" (name, description, algorithm, parameters, metrics, "modelPath", "datasetId", "userId", "createdAt", "updatedAt")
VALUES
  ('Revenue Forecast', 'Quarterly revenue forecast model', 'exponential_smoothing', 
   '{"alpha":0.7,"beta":0.2,"gamma":0.1,"seasonality":4}', 
   '{"mape":4.3,"rmse":12500,"accuracy":93.2}', 
   'models/revenue_forecast_model.json', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  ('Expense Prediction', 'Monthly expense prediction model', 'linear_regression', 
   '{"features":["month","department"],"target":"amount"}', 
   '{"r2":0.87,"rmse":2350,"mae":1750}', 
   'models/expense_prediction_model.json', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Sample API Keys
INSERT INTO "ApiKeys" ("userId", "keyName", "keyValue", permissions, "lastUsed", "createdAt", "updatedAt")
VALUES
  (1, 'Default API Key', 'brn_api_12345678abcdefgh', '{"read":true,"write":true,"admin":true}', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Sample ERP Connections
INSERT INTO "ErpConnections" ("userId", name, type, config, status, "lastSync", "createdAt", "updatedAt")
VALUES
  (1, 'SAP Connection', 'sap', 
   '{"baseUrl":"https://sap-server.example.com","username":"sap_user","client":"100"}', 
   'active', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  (1, 'Microsoft Dynamics', 'dynamics365', 
   '{"baseUrl":"https://dynamics-server.example.com","tenant_id":"tenant123"}', 
   'inactive', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Sample Vector Embeddings (simplified - in real use these would be actual vector representations)
INSERT INTO "VectorEmbeddings" ("datasetId", "rowIndex", "vectorData", metadata, "createdAt", "updatedAt")
VALUES
  (1, 0, '[0.25, 0.1, -0.32, 0.44, -0.78, 0.12]', '{"quarter":"Q1","revenue":125000}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, 1, '[0.33, 0.2, -0.12, 0.54, -0.58, 0.22]', '{"quarter":"Q2","revenue":145000}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, 2, '[0.41, 0.3, -0.22, 0.34, -0.48, 0.32]', '{"quarter":"Q3","revenue":155000}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, 3, '[0.51, 0.4, -0.42, 0.24, -0.38, 0.42]', '{"quarter":"Q4","revenue":185000}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Verify data insertion
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
SELECT 'ErpConnections', COUNT(*) FROM "ErpConnections";