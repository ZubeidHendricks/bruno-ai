# ERP Integration Module

This module provides seamless integration with various Enterprise Resource Planning (ERP) systems, allowing Bruno AI to connect with, import from, and export to popular ERP platforms.

## Overview

The ERP Integration module:

- Connects to multiple ERP systems (SAP, Oracle, Microsoft Dynamics)
- Provides adapters for transforming data between systems
- Manages synchronization of data
- Maintains connection security and authentication
- Offers flexible configuration options

## Supported ERP Systems

The module currently supports the following ERP systems:

### 1. SAP ERP

**Connector**: `SAPConnector`  
**Adapter**: `SAPAdapter`  
**Entities**: Customers, Vendors, Materials, Sales Orders, Purchase Orders, Invoices, Deliveries, Financial Records, Cost Centers, Profit Centers

### 2. Oracle ERP Cloud

**Connector**: `OracleConnector`  
**Adapter**: `OracleAdapter`  
**Entities**: Customers, Suppliers, Items, Sales Orders, Purchase Orders, Invoices, Receipts, Journal Entries, Accounting Periods, Assets

### 3. Microsoft Dynamics 365 Finance and Operations

**Connector**: `MicrosoftConnector`  
**Adapter**: `MicrosoftAdapter`  
**Entities**: Customers, Vendors, Products, Sales Orders, Purchase Orders, Invoices, Payments, Ledger Journals, Dimensions, Warehouses, Budgets

## Architecture

The module follows a layered architecture:

1. **Connectors**: Handle authentication and communication with ERP systems
2. **Adapters**: Implement system-specific data operations (fetch, push, query)
3. **Transformers**: Convert data between ERP formats and Bruno AI format
4. **Sync Manager**: Coordinates data synchronization between systems
5. **Data Transformer**: Handles data transformations and validations

## Basic Usage

### Connection Setup

```javascript
const { ERPIntegrationService } = require('./services/erpIntegration');

// Initialize the ERP Integration Service
const erpService = new ERPIntegrationService({
  autoSync: true,
  syncInterval: 3600000 // 1 hour
});

// Create a connection to SAP
const sapConfig = {
  baseUrl: 'https://sap-server.example.com',
  username: 'username',
  password: 'password',
  client: '100',
  language: 'EN',
  authType: 'basic'
};

const sapConnection = await erpService.createConnection('sap', sapConfig);
```

### Data Import Example

```javascript
// Import customers from SAP
const customers = await erpService.importData('sap', sapConnection, 'customers', {
  limit: 100,
  filters: {
    CustomerGroup: 'RETAIL'
  }
});

console.log(`Imported ${customers.length} customers from SAP`);
```

### Data Export Example

```javascript
// Export invoices to Oracle
const invoices = [/* Array of invoice objects */];

const exportResults = await erpService.exportData('oracle', oracleConnection, 'invoices', invoices, {
  updateExisting: true,
  continueOnError: true
});

console.log(`Exported ${exportResults.success} invoices to Oracle (${exportResults.failed} failed)`);
```

### Direct Query Example

```javascript
// Execute a direct query on Microsoft Dynamics
const query = "Customers?$filter=CustomerGroup eq 'RETAIL' and CreditLimit gt 10000";
const results = await erpService.queryERP('microsoft', microsoftConnection, query);

console.log(`Query returned ${results.length} results`);
```

## Synchronization

The ERP Integration Service includes a synchronization manager for automated data syncing between systems:

```javascript
// Get synchronization history
const syncHistory = await erpService.getSyncHistory('sap', 'customers');
console.log(`Last synchronized: ${syncHistory[0].timestamp}`);

// Start automatic synchronization
erpService.startAutoSync();

// Stop automatic synchronization
erpService.stopAutoSync();
```

## Data Transformation

The module handles data transformation between different ERP systems and the Bruno AI format:

```javascript
// Import data from SAP (automatically transformed to Bruno AI format)
const sapCustomers = await erpService.importData('sap', sapConnection, 'customers');

// Export data to Oracle (automatically transformed from Bruno AI format to Oracle format)
await erpService.exportData('oracle', oracleConnection, 'customers', sapCustomers);
```

## Error Handling

The module provides custom error classes for better error handling:

```javascript
const { ERPError, SAPError } = require('./services/erpIntegration/utils/errors');

try {
  await erpService.importData('sap', sapConnection, 'unknownEntity');
} catch (error) {
  if (error instanceof SAPError) {
    console.error('SAP error:', error.message);
  } else if (error instanceof ERPError) {
    console.error('General ERP error:', error.message);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Configuration Options

The ERP Integration Service accepts the following configuration options:

- **autoSync**: Whether to start automatic synchronization (default: false)
- **syncInterval**: Interval between automatic synchronizations in milliseconds (default: 3600000 - 1 hour)
- **retryAttempts**: Number of retry attempts for failed operations (default: 3)
- **cacheExpiration**: Time in milliseconds before cache expires (default: 300000 - 5 minutes)

## Adding New ERP Systems

The module is designed to be extensible. To add a new ERP system:

1. Create a new connector in the `connectors` directory
2. Create a new adapter in the `adapters` directory
3. Create transformers for each entity type
4. Register the connector and adapter in their respective index.js files

## Contributing

When contributing to the ERP integration module, please follow these guidelines:

1. Each ERP system should have its own directory in the `adapters` directory
2. Transformers should handle both import and export transformations
3. All external calls should include proper error handling and retries
4. Follow the established naming and structure conventions

## License

This module is part of the Bruno AI platform and is covered by the same license.
