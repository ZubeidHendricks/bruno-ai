# Basic Examples

This document provides basic examples of using the Bruno AI Time Series Forecasting module.

## Simple Forecasting

```javascript
const timeSeriesForecaster = require('bruno-ai').timeSeries;

// Sample data
const timeValues = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];
const values = [10, 12, 13, 15, 16];
const frequency = 'daily';

// Generate forecasts
async function generateSimpleForecasts() {
  try {
    const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, frequency, {
      horizon: 7 // Forecast 7 periods ahead
    });
    
    console.log('Best forecasting method:', forecasts.bestMethod);
    console.log('Forecast values:', forecasts.methods[forecasts.bestMethod].values);
    console.log('Future dates:', forecasts.horizonDates);
  } catch (error) {
    console.error('Error generating forecasts:', error.message);
  }
}

generateSimpleForecasts();
```

## Forecasting with Confidence Intervals

```javascript
const timeSeriesForecaster = require('bruno-ai').timeSeries;

// Sample data
const timeValues = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];
const values = [10, 12, 13, 15, 16];
const frequency = 'daily';

// Generate forecasts with confidence intervals
async function generateForecastsWithCI() {
  try {
    // Generate forecasts
    const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, frequency, {
      horizon: 7
    });
    
    // Add confidence intervals
    const forecastsWithCI = timeSeriesForecaster.generateConfidenceIntervals(values, forecasts, 0.95);
    
    const bestMethod = forecastsWithCI.bestMethod;
    const bestForecasts = forecastsWithCI.methods[bestMethod];
    
    console.log('Best method:', bestMethod);
    console.log('Forecast values:', bestForecasts.values);
    console.log('Lower bounds:', bestForecasts.confidenceIntervals.lower);
    console.log('Upper bounds:', bestForecasts.confidenceIntervals.upper);
  } catch (error) {
    console.error('Error generating forecasts with confidence intervals:', error.message);
  }
}

generateForecastsWithCI();
```

## Using a Specific Forecasting Method

```javascript
const timeSeriesForecaster = require('bruno-ai').timeSeries;

// Sample data
const timeValues = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];
const values = [10, 12, 13, 15, 16];
const frequency = 'daily';

// Generate forecasts with a specific method
async function generateForecastWithMethod() {
  try {
    const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, frequency, {
      method: 'exponentialSmoothing', // Use exponential smoothing
      alpha: 0.5, // Set alpha parameter
      horizon: 10 // Forecast 10 periods ahead
    });
    
    console.log('Exponential smoothing forecast:', forecasts.methods.exponentialSmoothing.values);
    console.log('Future dates:', forecasts.horizonDates);
  } catch (error) {
    console.error('Error generating forecasts with specific method:', error.message);
  }
}

generateForecastWithMethod();
```

## Working with Monthly Data

```javascript
const timeSeriesForecaster = require('bruno-ai').timeSeries;

// Monthly data
const timeValues = [
  '2023-01-01', '2023-02-01', '2023-03-01', '2023-04-01', '2023-05-01',
  '2023-06-01', '2023-07-01', '2023-08-01', '2023-09-01', '2023-10-01',
  '2023-11-01', '2023-12-01', '2024-01-01'
];
const values = [120, 132, 145, 138, 152, 165, 172, 168, 175, 182, 196, 205, 210];
const frequency = 'monthly';

// Generate forecasts for monthly data
async function generateMonthlyForecasts() {
  try {
    const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, frequency, {
      horizon: 6 // Forecast 6 months ahead
    });
    
    console.log('Best method for monthly data:', forecasts.bestMethod);
    console.log('Forecast values:', forecasts.methods[forecasts.bestMethod].values);
    console.log('Future months:', forecasts.horizonDates);
  } catch (error) {
    console.error('Error generating monthly forecasts:', error.message);
  }
}

generateMonthlyForecasts();
```

## Handling Seasonal Data

```javascript
const timeSeriesForecaster = require('bruno-ai').timeSeries;

// Monthly data with yearly seasonality (24 months)
const timeValues = [
  '2022-01-01', '2022-02-01', '2022-03-01', '2022-04-01', '2022-05-01', '2022-06-01',
  '2022-07-01', '2022-08-01', '2022-09-01', '2022-10-01', '2022-11-01', '2022-12-01',
  '2023-01-01', '2023-02-01', '2023-03-01', '2023-04-01', '2023-05-01', '2023-06-01',
  '2023-07-01', '2023-08-01', '2023-09-01', '2023-10-01', '2023-11-01', '2023-12-01'
];
const values = [
  100, 105, 115, 125, 130, 140, 150, 155, 145, 135, 120, 110, // 2022
  105, 110, 120, 130, 135, 145, 155, 160, 150, 140, 125, 115  // 2023
];
const frequency = 'monthly';

// Generate forecasts for seasonal data
async function generateSeasonalForecasts() {
  try {
    const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, frequency, {
      horizon: 12, // Forecast 12 months ahead
      seasonalPeriod: 12 // Specify yearly seasonality
    });
    
    console.log('Best method for seasonal data:', forecasts.bestMethod);
    console.log('Forecast values:', forecasts.methods[forecasts.bestMethod].values);
    
    // Seasonal methods should perform better
    console.log('Seasonal Naive Accuracy:', forecasts.methods.seasonalNaive?.accuracy);
    console.log('Holt-Winters Accuracy:', forecasts.methods.holtWinters?.accuracy);
  } catch (error) {
    console.error('Error generating seasonal forecasts:', error.message);
  }
}

generateSeasonalForecasts();
```

## Reading Data from CSV

```javascript
const fs = require('fs');
const csv = require('csv-parser');
const timeSeriesForecaster = require('bruno-ai').timeSeries;

// Read data from CSV file
async function forecastFromCSV(filePath, dateColumn, valueColumn, frequency) {
  return new Promise((resolve, reject) => {
    const timeValues = [];
    const values = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        timeValues.push(row[dateColumn]);
        values.push(parseFloat(row[valueColumn]));
      })
      .on('end', async () => {
        try {
          // Generate forecasts
          const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, frequency, {
            horizon: 10
          });
          resolve(forecasts);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Usage
forecastFromCSV('sales_data.csv', 'date', 'sales', 'monthly')
  .then(forecasts => {
    console.log('Best method:', forecasts.bestMethod);
    console.log('Forecast values:', forecasts.methods[forecasts.bestMethod].values);
  })
  .catch(error => {
    console.error('Error forecasting from CSV:', error.message);
  });
```

## Working with Irregular Data

```javascript
const timeSeriesForecaster = require('bruno-ai').timeSeries;

// Irregular time intervals
const timeValues = [
  '2023-01-05', '2023-01-12', '2023-01-22', '2023-02-03', '2023-02-15',
  '2023-03-01', '2023-03-20', '2023-04-02', '2023-04-22', '2023-05-10'
];
const values = [25, 30, 22, 35, 40, 38, 45, 42, 48, 50];

// Generate forecasts for irregular data
async function generateIrregularForecasts() {
  try {
    const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, 'irregular', {
      horizon: 5
    });
    
    console.log('Best method for irregular data:', forecasts.bestMethod);
    console.log('Forecast values:', forecasts.methods[forecasts.bestMethod].values);
    console.log('Future dates:', forecasts.horizonDates);
  } catch (error) {
    console.error('Error generating forecasts for irregular data:', error.message);
  }
}

generateIrregularForecasts();
```

## Handling Missing Values

```javascript
const timeSeriesForecaster = require('bruno-ai').timeSeries;

// Data with missing values (null)
const timeValues = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', 
                    '2024-01-06', '2024-01-07', '2024-01-08', '2024-01-09', '2024-01-10'];
const values = [10, 12, null, 15, 16, null, null, 22, 25, 27];

// Preprocess data to handle missing values
function preprocessData(timeValues, values) {
  const cleanTimeValues = [];
  const cleanValues = [];
  
  for (let i = 0; i < timeValues.length; i++) {
    if (values[i] !== null && !isNaN(values[i])) {
      cleanTimeValues.push(timeValues[i]);
      cleanValues.push(values[i]);
    }
  }
  
  return { cleanTimeValues, cleanValues };
}

// Generate forecasts with preprocessed data
async function forecastWithMissingValues() {
  try {
    // Preprocess data
    const { cleanTimeValues, cleanValues } = preprocessData(timeValues, values);
    
    // Generate forecasts
    const forecasts = await timeSeriesForecaster.generateForecasts(cleanTimeValues, cleanValues, 'daily', {
      horizon: 7
    });
    
    console.log('Best method:', forecasts.bestMethod);
    console.log('Forecast values:', forecasts.methods[forecasts.bestMethod].values);
  } catch (error) {
    console.error('Error handling missing values:', error.message);
  }
}

forecastWithMissingValues();
```

## Comparing Multiple Methods

```javascript
const timeSeriesForecaster = require('bruno-ai').timeSeries;

// Sample data
const timeValues = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05',
                    '2024-01-06', '2024-01-07', '2024-01-08', '2024-01-09', '2024-01-10'];
const values = [10, 12, 13, 15, 16, 15, 17, 20, 21, 22];
const frequency = 'daily';

// Compare all forecasting methods
async function compareAllMethods() {
  try {
    const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, frequency, {
      horizon: 5
    });
    
    // Compare accuracy of all methods
    console.log('Method Comparison:');
    console.log('-----------------');
    
    for (const method in forecasts.methods) {
      console.log(`${forecasts.methods[method].name}:`);
      console.log(`  Accuracy: ${forecasts.methods[method].accuracy?.toFixed(2) || 'N/A'}%`);
      console.log(`  Forecast: ${forecasts.methods[method].values.join(', ')}`);
      console.log();
    }
    
    console.log(`Best method: ${forecasts.bestMethod}`);
  } catch (error) {
    console.error('Error comparing methods:', error.message);
  }
}

compareAllMethods();
```

## Next Steps

- Explore [Advanced Examples](advanced.md) for more complex use cases
- Learn about the [ML Pipeline](../../src/services/timeSeries/ml/README.md) for enhanced forecasting
- Check the [API Reference](../time-series-api.md) for detailed documentation
