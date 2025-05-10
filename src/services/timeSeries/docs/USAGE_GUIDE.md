# Time Series Forecasting - Usage Guide

This guide provides practical examples and best practices for using the time series forecasting module in your applications.

## Basic Usage

### Importing the Module

```javascript
// Import the entire module with all functionalities
const timeSeriesForecaster = require('../../services/timeSeries');

// Or import specific components
const { generateForecasts, generateConfidenceIntervals } = require('../../services/timeSeries');
```

### Simple Forecasting Example

```javascript
const timeValues = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];
const values = [10, 12, 13, 15, 16];
const frequency = 'daily';

// Generate forecasts with default options
const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, frequency);

// Extract the best forecasting method
const bestMethod = forecasts.bestMethod;
const bestForecast = forecasts.methods[bestMethod];

console.log(`Best method: ${bestForecast.name}`);
console.log(`Forecast values: ${bestForecast.values}`);
```

### Adding Confidence Intervals

```javascript
// Add 95% confidence intervals to the forecasts
const forecastsWithCI = timeSeriesForecaster.generateConfidenceIntervals(values, forecasts);

// Extract confidence intervals
const confidenceIntervals = forecastsWithCI.methods[forecastsWithCI.bestMethod].confidenceIntervals;

console.log(`Lower bounds: ${confidenceIntervals.lower}`);
console.log(`Upper bounds: ${confidenceIntervals.upper}`);
```

## Advanced Usage

### Specifying a Forecast Method

```javascript
// Force using a specific forecasting method
const options = {
  method: 'holtWinters', // Use Holt-Winters method specifically
  horizon: 10,           // Forecast 10 periods ahead
  alpha: 0.2,            // Custom alpha parameter
  beta: 0.1,             // Custom beta parameter
  gamma: 0.05            // Custom gamma parameter (for Holt-Winters)
};

const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, frequency, options);
```

### Custom Seasonality Period

```javascript
// Specify a custom seasonality period
const options = {
  seasonalPeriod: 12, // For monthly data with yearly seasonality
  horizon: 24         // Forecast 2 years ahead
};

const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, 'monthly', options);
```

### Using Individual Forecasting Algorithms

```javascript
// Import a specific algorithm
const holtWintersForecaster = require('../../services/timeSeries/algorithms/holtWintersForecaster');

// Use it directly
const seasonalPeriod = 7; // Weekly seasonality
const alpha = 0.3;
const beta = 0.1;
const gamma = 0.1;
const horizon = 14; // Forecast 2 weeks ahead

const forecasts = holtWintersForecaster.generateHoltWintersForecast(
  values, seasonalPeriod, alpha, beta, gamma, horizon
);

console.log(`Holt-Winters forecasts: ${forecasts}`);
```

## Working with Different Data Frequencies

The module supports various data frequencies:

### Daily Data

```javascript
const dailyDates = [
  '2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05',
  '2024-01-06', '2024-01-07', '2024-01-08', '2024-01-09', '2024-01-10',
  // ... more dates
];
const dailyValues = [10, 11, 13, 12, 15, 16, 14, 17, 18, 19]; // Corresponding values

// Weekly seasonality is often present in daily data
const forecasts = await timeSeriesForecaster.generateForecasts(dailyDates, dailyValues, 'daily');
```

### Monthly Data

```javascript
const monthlyDates = [
  '2023-01-01', '2023-02-01', '2023-03-01', '2023-04-01', '2023-05-01',
  '2023-06-01', '2023-07-01', '2023-08-01', '2023-09-01', '2023-10-01',
  '2023-11-01', '2023-12-01', '2024-01-01', '2024-02-01', '2024-03-01'
];
const monthlyValues = [100, 110, 120, 115, 130, 140, 150, 155, 145, 150, 160, 170, 165, 175, 190];

// Monthly data often has yearly seasonality (period = 12)
const forecasts = await timeSeriesForecaster.generateForecasts(monthlyDates, monthlyValues, 'monthly');
```

## Best Practices

### Preprocessing Data

For best results, preprocess your data before forecasting:

1. **Handle missing values**: Impute or interpolate missing values
2. **Remove outliers**: Extreme values can significantly affect forecasts
3. **Ensure consistent time intervals**: If intervals are irregular, consider resampling

```javascript
// Example of simple outlier removal (using Z-score)
function removeOutliers(values, threshold = 3) {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  );
  
  return values.map(val => {
    const zScore = Math.abs((val - mean) / stdDev);
    return zScore > threshold ? mean : val;
  });
}

const cleanValues = removeOutliers(values);
const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, cleanValues, frequency);
```

### Selecting the Right Forecast Horizon

Choose an appropriate forecast horizon based on:

1. **Data frequency**: Longer horizons are generally more reliable for lower-frequency data
2. **Data stability**: More stable patterns support longer horizons
3. **Business needs**: Balance between accuracy requirements and planning needs

### Evaluating Forecast Quality

Always evaluate the quality of forecasts:

```javascript
// Extract accuracy metrics for all methods
Object.keys(forecasts.methods).forEach(method => {
  const accuracy = forecasts.methods[method].accuracy;
  console.log(`${method}: ${accuracy !== null ? accuracy.toFixed(2) + '%' : 'N/A'} MAPE`);
});

// Check if any method has high error rates (e.g., above 20% MAPE)
const highErrorMethods = Object.keys(forecasts.methods)
  .filter(method => forecasts.methods[method].accuracy !== null && forecasts.methods[method].accuracy > 20);

if (highErrorMethods.length > 0) {
  console.warn('Warning: Following methods have high error rates:', highErrorMethods.join(', '));
  console.warn('Consider using more data or different algorithms.');
}
```

## Troubleshooting

### Insufficient Data

If you see the message "Insufficient data for forecasting", ensure:

1. You have at least 3 data points
2. For seasonal methods, you need at least 2 complete seasonal cycles

### Poor Forecast Quality

If forecast quality is poor:

1. Try different algorithms by specifying the `method` option
2. Adjust parameters (alpha, beta, gamma) to better fit your data
3. Check for outliers or unusual patterns in your data
4. Consider using more historical data if available

### Performance Issues

For large datasets:

1. Consider downsampling to a lower frequency if appropriate
2. Limit the analysis to more recent data points
3. Use simpler algorithms (like Naive or Moving Average) for faster processing

---

For more detailed information on algorithms and implementation details, refer to the `ALGORITHMS.md` document and the source code.
