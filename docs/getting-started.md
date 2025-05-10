# Getting Started with Bruno AI

This guide will help you get started with Bruno AI, focusing on the Time Series Forecasting module.

## Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- Git (for installation from repository)

## Installation

### Option 1: Install from npm

```bash
npm install bruno-ai
```

### Option 2: Install from GitHub

```bash
# Clone the repository
git clone https://github.com/yourusername/bruno-ai.git

# Navigate to the project directory
cd bruno-ai

# Install dependencies
npm install
```

## Basic Usage

### Time Series Forecasting

```javascript
const timeSeriesForecaster = require('bruno-ai').timeSeries;

// Sample data
const timeValues = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];
const values = [10, 12, 13, 15, 16];
const frequency = 'daily';

// Generate forecasts
async function generateForecasts() {
  try {
    const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, frequency, {
      horizon: 7 // Forecast 7 periods ahead
    });
    
    console.log('Best forecasting method:', forecasts.bestMethod);
    console.log('Forecast values:', forecasts.methods[forecasts.bestMethod].values);
    
    // Add confidence intervals
    const forecastsWithCI = timeSeriesForecaster.generateConfidenceIntervals(values, forecasts, 0.95);
    console.log('Confidence intervals:', forecastsWithCI.methods[forecastsWithCI.bestMethod].confidenceIntervals);
  } catch (error) {
    console.error('Error generating forecasts:', error.message);
  }
}

generateForecasts();
```

## Using the ML Pipeline

The ML pipeline provides enhanced forecasting capabilities:

```javascript
const { pipeline } = require('bruno-ai').timeSeries.ml;

async function runForecastingPipeline() {
  try {
    // Sample data
    const timeValues = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];
    const values = [10, 12, 13, 15, 16];
    const frequency = 'daily';
    
    // Run the full ML pipeline
    const pipelineResults = await pipeline.runPipeline(timeValues, values, frequency, {
      enableHyperparameterTuning: true,
      includeExternalFeatures: true,
      methods: ['exponentialSmoothing', 'doubleExponentialSmoothing', 'holtWinters']
    });
    
    console.log('Best model:', pipelineResults.model);
    console.log('Forecast:', pipelineResults.forecasts.methods[pipelineResults.forecasts.bestMethod].values);
    console.log('Model ID:', pipelineResults.modelId);
  } catch (error) {
    console.error('Error running pipeline:', error.message);
  }
}

runForecastingPipeline();
```

## Step-by-Step Guide

### 1. Prepare Your Data

Prepare your time series data as arrays of time values and corresponding numeric values:

```javascript
const timeValues = ['2024-01-01', '2024-01-02', '2024-01-03', ...]; // Dates or timestamps
const values = [10, 12, 13, ...]; // Numeric values
```

### 2. Identify Data Frequency

Determine the frequency of your data:

- `daily`: Daily data
- `weekly`: Weekly data
- `monthly`: Monthly data
- `quarterly`: Quarterly data
- `yearly`: Yearly data

### 3. Generate Forecasts

```javascript
const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, frequency, {
  horizon: 10, // Number of periods to forecast
  method: 'auto' // 'auto' tries all methods and selects the best one
});
```

### 4. Analyze Results

```javascript
// Get the best method
const bestMethod = forecasts.bestMethod;
console.log('Best method:', bestMethod);

// Get forecast values
const forecastValues = forecasts.methods[bestMethod].values;
console.log('Forecast values:', forecastValues);

// Get future dates
const futureDates = forecasts.horizonDates;
console.log('Future dates:', futureDates);
```

### 5. Add Confidence Intervals

```javascript
const forecastsWithCI = timeSeriesForecaster.generateConfidenceIntervals(values, forecasts, 0.95);

// Get confidence intervals
const confidenceIntervals = forecastsWithCI.methods[bestMethod].confidenceIntervals;
console.log('Lower bounds:', confidenceIntervals.lower);
console.log('Upper bounds:', confidenceIntervals.upper);
```

### 6. Use Advanced ML Pipeline (Optional)

```javascript
const pipelineResults = await pipeline.runPipeline(timeValues, values, frequency, {
  enableHyperparameterTuning: true,
  includeExternalFeatures: false
});

// Get model ID for future use
const modelId = pipelineResults.modelId;

// Get forecast values
const mlForecastValues = pipelineResults.forecasts.methods[pipelineResults.forecasts.bestMethod].values;
```

### 7. Retrain Model with New Data (Optional)

```javascript
const newTimeValues = ['2024-02-01', '2024-02-02', ...];
const newValues = [22, 25, ...];

const retrainingResults = await pipeline.retrainModel(modelId, newTimeValues, newValues);
```

## Working with Different Data Types

### CSV Data

```javascript
const fs = require('fs');
const csv = require('csv-parser');

// Read CSV file
const timeValues = [];
const values = [];

fs.createReadStream('data.csv')
  .pipe(csv())
  .on('data', (row) => {
    timeValues.push(row.date);
    values.push(parseFloat(row.value));
  })
  .on('end', async () => {
    // Generate forecasts
    const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, 'daily');
    console.log(forecasts);
  });
```

### JSON Data

```javascript
const fs = require('fs');

// Read JSON file
fs.readFile('data.json', 'utf8', async (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  
  const jsonData = JSON.parse(data);
  const timeValues = jsonData.map(item => item.date);
  const values = jsonData.map(item => item.value);
  
  // Generate forecasts
  const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, 'daily');
  console.log(forecasts);
});
```

### Database Data

```javascript
const mysql = require('mysql2/promise');

async function forecastFromDatabase() {
  // Create connection
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'timeseries'
  });
  
  // Query data
  const [rows] = await connection.execute('SELECT date, value FROM timeseries_data ORDER BY date');
  
  // Extract time values and values
  const timeValues = rows.map(row => row.date);
  const values = rows.map(row => row.value);
  
  // Generate forecasts
  const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, 'daily');
  console.log(forecasts);
  
  // Close connection
  await connection.end();
}

forecastFromDatabase();
```

## Next Steps

- Read the [Usage Guide](../src/services/timeSeries/docs/USAGE_GUIDE.md) for more detailed examples
- Learn about the [Time Series Forecasting Algorithms](../src/services/timeSeries/docs/ALGORITHMS.md)
- Explore the [ML Pipeline](../src/services/timeSeries/ml/README.md) for advanced features
- Check the [API Reference](time-series-api.md) for detailed documentation of all functions
