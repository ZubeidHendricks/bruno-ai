# Vector-Based Financial Intelligence Platform (Bruno AI)

A sophisticated financial intelligence platform that leverages AI and vector databases to transform financial management for medium-sized enterprises.

## 🚀 Features

- **Chat Data Prep™**: Natural language interface for data transformation
- **Real-time Financial Analytics**: Advanced trend analysis and forecasting
- **Vector-based Pattern Recognition**: Detect patterns across financial data
- **AI-Powered Insights**: Automated financial recommendations
- **Multi-system Integration**: Connect with Excel, SAP, Salesforce
- **Interactive Dashboards**: Visual representation of financial metrics
- **Full API Integration**: Production-ready backend connectivity
- **Time Series Forecasting**: Advanced forecasting with multiple algorithms and ML pipeline
- **ERP System Integration**: Seamless connection with SAP, Oracle, and Microsoft Dynamics

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 Client Interaction Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │
│  │ Web         │  │ Mobile      │  │ API         │  │ Notif.  │  │
│  │ Interface   │  │ Application │  │ Endpoints   │  │         │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Application Layer                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Financial       │  │ Conversation    │  │ Workflow        │  │
│  │ Intelligence    │  │ Processing      │  │ Automation      │  │
│  │ Engine          │  │ Engine          │  │ Engine          │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Core Services Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │
│  │ RAG         │  │ Vector      │  │ Graph       │  │ Natural │  │
│  │ Service     │  │ Search      │  │ Query       │  │ Language│  │
│  │             │  │ Service     │  │ Service     │  │ Service │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Data Integration Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │
│  │ API         │  │ Database    │  │ Auth        │  │ Storage │  │
│  │ Service     │  │ Service     │  │ Service     │  │ Service │  │
│  │             │  │             │  │             │  │         │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL 14+
- Python 3.9+
- OpenAI API key
- Weaviate instance (local or cloud)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/bruno-ai.git
cd bruno-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your configuration:
```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_DEBUG=false
DATABASE_URL=postgres://username:password@localhost:5432/bruno_db
OPENAI_API_KEY=your_openai_api_key
WEAVIATE_HOST=localhost:8080
WEAVIATE_SCHEME=http
JWT_SECRET=your_jwt_secret
```

4. Set up the database:
```bash
npm run setup-database
```

5. Start the development server:
```bash
npm run dev
```

## 🚦 Getting Started

### 1. Upload Your Financial Data

Navigate to the Chat Data Prep™ interface and upload your files:
- Supported formats: CSV, Excel (.xlsx, .xls), JSON
- Maximum file size: 10MB

### 2. Transform Your Data

Use natural language commands to clean and transform your data:
```
"Merge Q3 revenue with customer segments"
"Remove duplicates from the transaction data"
"Calculate monthly averages for revenue"
```

### 3. View Analytics

Access the dashboard to see:
- Key financial metrics
- Trend analysis
- Automated insights
- Forecasting projections

## 📊 Data Transformation Examples

```javascript
// Example 1: Merge datasets
"Combine sales data with customer information using customer ID"

// Example 2: Filter data
"Show only transactions above €1000 from Q3"

// Example 3: Calculate metrics
"Calculate profit margins for each product category"

// Example 4: Detect anomalies
"Find unusual spending patterns in the expense data"
```

## 📈 Time Series Analysis

Bruno AI includes robust time series analysis capabilities, designed specifically for financial data:

### Financial Trend Analysis

```javascript
// Track financial metrics over time periods
analyzeFinancialTrends(data, 'date', 'revenue');
```

The platform provides comprehensive time series functionality:

- **Trend Detection**: Automatically identifies upward/downward trends in financial data
- **Growth Rate Calculation**: Calculates period-over-period growth rates and compound growth
- **Volatility Analysis**: Measures data volatility and statistical variance
- **Forecasting**: Multiple advanced algorithms with ML pipeline integration
- **Anomaly Detection**: Z-score based outlier identification in time series
- **Pattern Recognition**: Automatically detects:
  - Seasonality patterns
  - Cyclical trends with peak/trough identification
  - Trend breaks and regime changes

### Advanced Time Series Forecasting

Bruno AI now includes an enhanced time series forecasting module with:

- **Multiple Forecasting Algorithms**:
  - Naive Forecast: Uses the last observed value for simple forecasts
  - Moving Average: Smooths out short-term fluctuations
  - Linear Regression: Captures linear trends in your data
  - Exponential Smoothing: Gives more weight to recent observations
  - Double Exponential Smoothing: Handles both level and trend components
  - Seasonal Naive: Great for data with strong seasonal patterns
  - Holt-Winters: Triple exponential smoothing for complex seasonal data

- **ML Pipeline Integration**:
  - Feature Engineering: Extracts meaningful features from time series data
  - Hyperparameter Tuning: Automatically finds optimal model parameters
  - Cross-Validation: Robust validation techniques for time series
  - Model Registry: Stores and versions trained models
  - Automated Retraining: Detects when models need retraining

## 🔄 ERP System Integration

Bruno AI now includes seamless integration with popular ERP systems:

### Supported Systems

- **SAP ERP**: Connect to SAP ERP, SAP S/4HANA, and SAP Business One
- **Oracle ERP Cloud**: Integrate with Oracle Fusion Cloud ERP
- **Microsoft Dynamics 365**: Connect with Microsoft Dynamics 365 Finance and Operations

### Key Capabilities

- **Bidirectional Sync**: Import from and export to ERP systems
- **Entity Mapping**: Pre-configured entity mappings for customers, invoices, products, and more
- **Automated Synchronization**: Schedule regular data syncs between systems
- **Conflict Resolution**: Smart handling of data conflicts
- **Transformation Pipeline**: Clean, transform, and validate data during synchronization

### Example Usage

```javascript
// Initialize ERP Integration Service
const erpService = new ERPIntegrationService();

// Connect to SAP
const sapConnection = await erpService.createConnection('sap', {
  baseUrl: 'https://sap-server.example.com',
  username: 'username',
  password: 'password',
  client: '100'
});

// Import customers from SAP
const customers = await erpService.importData('sap', sapConnection, 'customers');

// Use Bruno AI features with the imported data
// ...

// Export modified data back to SAP
await erpService.exportData('sap', sapConnection, 'customers', modifiedCustomers);
```

## Timeline Tracking

The platform includes sophisticated timeline tracking for financial data processing:

```javascript
// Create a timeline of financial events
const session = createTimelineSession(userId);
startTimelineStep({ userId, sessionId, stepKey: 'DATA_INGESTION' });
```

Key timeline capabilities:

- **Process Tracking**: Full audit trail of all data transformations
- **Step-by-Step Analysis**: Detailed tracking of the entire data pipeline
- **Performance Metrics**: Timing and duration analysis for optimization
- **Session Management**: Group related operations for analysis
- **Reversion Support**: Point-in-time recovery of previous data states
- **Statistical Analysis**: Success rates and duration metrics by process type

## 🔧 API Services & Endpoints

Bruno AI implements a comprehensive REST API integration with robust service modules. The platform utilizes a modular service architecture with the following components:

### Core API Services:

```javascript
// Service Modules
- apiService       // Base HTTP client with interceptors
- authService      // Authentication and user management
- dashboardService // Dashboard metrics and visualization
- dataTransformationService // Data processing pipeline
- financialAnalysisService  // Financial calculations and insights
- openaiService    // AI-powered analysis and NLP
- timelineService  // Historical data tracking
- vectorDatabaseService // Vector embedding and similarity search
- timeSeriesService // Advanced time series forecasting
- erpIntegrationService // ERP system integration
```

Each service encapsulates specific business logic and API endpoints with proper authentication, error handling, and logging.

### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "secure_password"
}
```

### Chat Endpoint
```http
POST /api/chat
Content-Type: application/json
Authorization: Bearer {your_token}

{
  "message": "Analyze revenue trends for Q3",
  "sessionId": "abc123"
}
```

### Data Processing Endpoint
```http
POST /api/datasets/process
Content-Type: application/json
Authorization: Bearer {your_token}

{
  "datasetId": "uploaded-file-id",
  "transformation": "merge with customer data",
  "options": {
    "preview": true
  }
}
```

### Financial Analysis Endpoint
```http
POST /api/reports/trends
Content-Type: application/json
Authorization: Bearer {your_token}

{
  "datasetId": "dataset-id",
  "timeColumn": "date",
  "valueColumn": "revenue"
}
```

### Time Series Forecasting Endpoint
```http
POST /api/timeseries/forecast
Content-Type: application/json
Authorization: Bearer {your_token}

{
  "timeValues": ["2023-01-01", "2023-02-01", ...],
  "values": [100, 120, ...],
  "frequency": "monthly",
  "options": {
    "horizon": 6,
    "method": "auto"
  }
}
```

### ERP Integration Endpoints
```http
// Connect to ERP system
POST /api/erp/connect
Content-Type: application/json
Authorization: Bearer {your_token}

{
  "system": "sap",
  "config": {
    "baseUrl": "https://sap-server.example.com",
    "username": "username",
    "password": "password",
    "client": "100"
  }
}

// Import data from ERP
GET /api/erp/import/{system}/{entity}
Authorization: Bearer {your_token}

// Export data to ERP
POST /api/erp/export/{system}/{entity}
Content-Type: application/json
Authorization: Bearer {your_token}

{
  "data": [/* Array of entities to export */]
}
```

### Dashboard Endpoints
```http
GET /api/dashboard/summary
GET /api/dashboard/activity
GET /api/dashboard/analytics?timeframe=monthly
```

### User Management Endpoints
```http
GET /api/users
GET /api/users/:id
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
PATCH /api/users/:id/role
```

### Settings Endpoints
```http
GET /api/settings
PUT /api/settings
```

## 🔐 Security

- All data is encrypted in transit (HTTPS) and at rest
- API keys are stored securely in environment variables
- JWT token-based authentication with proper expiration
- Session management with automatic token refresh
- Comprehensive request and response interceptors for error handling
- Role-based access control with fine-grained permissions
- Rate limiting prevents abuse
- CSRF protection implemented
- Secure password reset flow with tokenization

## 📈 Performance Optimization

- Axios instance configured with optimal timeout settings
- Vector embeddings are cached for faster retrieval
- Database queries use indexing for efficiency
- Large files are processed in chunks
- Background job processing for heavy computations
- API responses are optimized for minimal payload size
- Conditional console logging based on environment
- Configurable request timeout handling

## 🧪 Testing

Run tests:
```bash
npm test
```

Run integration tests:
```bash
npm run test:integration
```

Run API tests:
```bash
npm run test:api
```

## 📦 Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```bash
docker-compose up -d
```

### Environment Variables for Production
```
NODE_ENV=production
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_DEBUG=false
DATABASE_URL=postgres://username:password@db:5432/bruno_db
OPENAI_API_KEY=your_production_key
WEAVIATE_HOST=your_weaviate_instance
JWT_SECRET=your_secure_jwt_secret
```

## 🔄 Roadmap

### Phase 1: Foundation (Completed)
- ✅ Chat Data Prep™ implementation
- ✅ Basic analytics dashboard
- ✅ Excel data integration
- ✅ Full API integration

### Phase 2: Enhancement (Completed)
- ✅ Advanced time series forecasting with ML pipeline
- ✅ ERP system integration (SAP, Oracle, Microsoft)
- ✅ Multi-language support
- ✅ Performance optimization

### Phase 3: Scale (Planned)
- 📅 Enterprise features
- 📅 Real-time collaboration
- 📅 Advanced reporting
- 📅 Mobile applications

## 📚 Documentation

- [API Reference](docs/api.md)
- [Architecture Guide](docs/architecture.md)
- [User Guide](docs/user-guide.md)
- [Deployment Guide](docs/deployment.md)
- [Integration Guide](docs/integration.md)
- [Time Series Documentation](https://github.com/ZubeidHendricks/bruno-ai/wiki)
- [ERP Integration Guide](src/services/erpIntegration/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@bruno-ai.com or join our [Discord community](https://discord.gg/bruno-ai).

## 🙏 Acknowledgments

- OpenAI for GPT models
- Weaviate for vector database technology
- The open-source community for various libraries used

---

Made with ❤️ by the Bruno AI Team