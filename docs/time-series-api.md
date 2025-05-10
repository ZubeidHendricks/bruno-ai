# Time Series Forecasting API Reference

This document provides detailed API reference for the Time Series Forecasting module.

## Contents

- [Core Functions](#core-functions)
- [Algorithm-Specific Functions](#algorithm-specific-functions)
- [Utility Functions](#utility-functions)
- [ML Pipeline Functions](#ml-pipeline-functions)

## Core Functions

### generateForecasts

Generates forecasts using multiple methods and selects the best one.

```javascript
async function generateForecasts(timeValues, values, frequency, options = {})
```

**Parameters:**

- `timeValues` (Array): Array of time values (e.g., dates or timestamps)
- `values` (Array): Array of numeric values corresponding to the time values
- `frequency` (string): Detected data frequency ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')
- `options` (Object, optional): Additional options for forecasting
  - `horizon` (number): Number of periods to forecast
  - `method` (string): Specific forecasting method to use ('auto' uses all)
  - Other method-specific parameters

**Returns:**

- Object with the following properties:
  - `horizonPeriods` (number): Forecast horizon
  - `horizonDates` (Array): Future time points
  - `methods` (Object): Results from each forecasting method
  - `bestMethod` (string): Name of the best performing method

**Example:**

```javascript
const forecasts = await timeSeriesForecaster.generateForecasts(
  ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'],
  [10, 12, 13, 15, 16],
  'daily',
  { horizon: 7 }
);
```

### generateConfidenceIntervals

Generates confidence intervals for forecasts.

```javascript
function generateConfidenceIntervals(values, forecasts, confidenceLevel = 0.95)
```

**Parameters:**

- `values` (Array): Original time series values
- `forecasts` (Object): Forecast results from generateForecasts
- `confidenceLevel` (number, optional): Confidence level (0-1, default: 0.95)

**Returns:**

- Object: Forecasts with confidence intervals added

**Example:**

```javascript
const forecastsWithCI = timeSeriesForecaster.generateConfidenceIntervals(
  values, 
  forecasts, 
  0.95
);
```

## Algorithm-Specific Functions

Each forecasting algorithm provides the following key functions:

### Naive Forecaster

```javascript
const naiveForecaster = require('./algorithms/naiveForecaster');

// Generate naive forecast
const forecast = naiveForecaster.generateNaiveForecast(values, horizon);

// Calculate accuracy
const accuracy = naiveForecaster.calculateAccuracy(values);
```

### Moving Average Forecaster

```javascript
const movingAverageForecaster = require('./algorithms/movingAverageForecaster');

// Calculate moving average
const maValue = movingAverageForecaster.calculateMovingAverage(values, window);

// Generate moving average forecast
const forecast = movingAverageForecaster.generateMovingAverageForecast(values, window, horizon);

// Calculate accuracy
const accuracy = movingAverageForecaster.calculateAccuracy(values, window);
```

### Linear Regression Forecaster

```javascript
const linearRegressionForecaster = require('./algorithms/linearRegressionForecaster');

// Calculate regression parameters
const { slope, intercept } = linearRegressionForecaster.linearRegression(values);

// Generate linear regression forecast
const forecast = linearRegressionForecaster.generateLinearRegressionForecast(values, horizon);

// Calculate accuracy
const accuracy = linearRegressionForecaster.calculateAccuracy(values);
```

### Exponential Smoothing Forecaster

```javascript
const exponentialSmoothingForecaster = require('./algorithms/exponentialSmoothingForecaster');

// Generate exponential smoothing forecast
const forecast = exponentialSmoothingForecaster.generateExponentialSmoothingForecast(values, alpha, horizon);

// Calculate accuracy
const accuracy = exponentialSmoothingForecaster.calculateAccuracy(values, alpha);
```

### Double Exponential Smoothing Forecaster

```javascript
const doubleExponentialSmoothingForecaster = require('./algorithms/doubleExponentialSmoothingForecaster');

// Generate double exponential smoothing forecast
const forecast = doubleExponentialSmoothingForecaster.generateDoubleExponentialSmoothingForecast(values, alpha, beta, horizon);

// Calculate accuracy
const accuracy = doubleExponentialSmoothingForecaster.calculateAccuracy(values, alpha, beta);
```

### Seasonal Naive Forecaster

```javascript
const seasonalNaiveForecaster = require('./algorithms/seasonalNaiveForecaster');

// Generate seasonal naive forecast
const forecast = seasonalNaiveForecaster.generateSeasonalNaiveForecast(values, period, horizon);

// Calculate accuracy
const accuracy = seasonalNaiveForecaster.calculateAccuracy(values, period);
```

### Holt-Winters Forecaster

```javascript
const holtWintersForecaster = require('./algorithms/holtWintersForecaster');

// Generate Holt-Winters forecast
const forecast = holtWintersForecaster.generateHoltWintersForecast(values, period, alpha, beta, gamma, horizon);

// Calculate accuracy
const accuracy = holtWintersForecaster.calculateAccuracy(values, period, alpha, beta, gamma);
```

## Utility Functions

### Time Utilities

```javascript
const timeUtils = require('./utils/timeUtils');

// Get default forecast horizon based on data frequency
const horizon = timeUtils.getDefaultHorizon(frequency);

// Get average time difference between time points
const avgDiff = timeUtils.getAverageTimeDiff(timeValues);

// Generate future time points
const futureTimes = timeUtils.generateFutureTimePoints(lastTimePoint, frequency, horizon, timeValues);
```

### Seasonality Detector

```javascript
const seasonalityDetector = require('./utils/seasonalityDetector');

// Detect seasonal period in time series data
const period = seasonalityDetector.detectSeasonalPeriod(values, frequency);

// Calculate autocorrelation at a specific lag
const acf = seasonalityDetector.calculateAutocorrelation(values, lag);
```

### Accuracy Utilities

```javascript
const accuracyUtils = require('./utils/accuracyUtils');

// Calculate prediction errors for a given forecast method
const errors = accuracyUtils.calculatePredictionErrors(values, method, forecast);

// Get critical value for confidence interval
const criticalValue = accuracyUtils.getCriticalValue(confidenceLevel);

// Get forecasting method
const forecaster = accuracyUtils.getForecastingMethod(method);
```

## ML Pipeline Functions

### Pipeline Orchestrator

```javascript
const { pipeline } = require('./ml');

// Run the full ML pipeline
const results = await pipeline.runPipeline(timeValues, values, frequency, options);

// Retrain a model with new data
const retrainingResults = await pipeline.retrainModel(modelId, newTimeValues, newValues, options);
```

### Feature Engineering

```javascript
const { featureEngineering } = require('./ml');

// Generate all features for time series data
const features = await featureEngineering.generateFeatures(timeValues, values, frequency, options);

// Extract time features
const timeFeatures = featureEngineering.timeFeatures.extractTimeFeatures(timeValues, frequency);

// Generate lag features
const lagFeatures = featureEngineering.lagFeatures.generateLagFeatures(values, maxLag);

// Generate statistical features
const statFeatures = featureEngineering.statisticalFeatures.generateStatisticalFeatures(values, frequency);

// Generate transform features
const transformFeatures = featureEngineering.transformFeatures.generateTransformFeatures(values);

// Fetch external features
const externalFeatures = await featureEngineering.externalFeatures.fetchExternalFeatures(timeValues, frequency, config);
```

### Validation

```javascript
const { validation } = require('./ml');

// Split time series data
const { trainData, validationData, testData } = validation.splitTimeSeriesData(timeValues, values, features, splitRatio);

// Evaluate multiple models
const evaluationResults = validation.evaluateModels(models, timeValues, values, frequency);

// Evaluate a single model
const result = validation.evaluateModel(model, timeValues, values, frequency);

// Select the best model
const bestModel = validation.selectBestModel(validationResults);

// Compare two models
const comparison = validation.compareModels(existingModel, newModel, timeValues, values, frequency);

// Check if retraining is needed
const needsRetraining = validation.checkRetrainingNeed(model, historicalData, newTimeValues, newValues, options);

// Perform cross-validation
const cvResults = validation.performCrossValidation(timeValues, values, frequency, options);
```

### Model Registry

```javascript
const { registry } = require('./ml');

// Register a model
const modelId = await registry.registerModel(model);

// Get a model
const model = await registry.getModel(modelId);

// Update a model
const success = await registry.updateModel(modelId, model);

// Delete a model
const deleted = await registry.deleteModel(modelId);

// List models
const models = await registry.listModels(filters);

// Get model versions
const versions = await registry.getModelVersions(modelId);

// Get model metadata
const metadata = await registry.getModelMetadata(modelId);
```

### Training

```javascript
const { training } = require('./ml');

// Train multiple models
const models = await training.trainModels(timeValues, values, frequency, features, options);

// Retrain a model
const retrainedModel = await training.retrainModel(model, newTimeValues, newValues, features, options);

// Export a model
const exportedModel = training.exportModel(model);

// Import a model
const importedModel = training.importModel(modelData);
```

## Error Handling

Most functions in the Time Series module will throw exceptions with descriptive messages when errors occur. It's recommended to use try-catch blocks when calling these functions.

```javascript
try {
  const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, frequency);
} catch (error) {
  console.error('Error generating forecasts:', error.message);
}
```

## Type Definitions

For TypeScript users, type definitions are available in the `types` directory.

```typescript
import { TimeSeriesForecaster, ForecastOptions, ForecastResult } from './types';
```

## Further Reading

- [Time Series Forecasting Algorithms](../src/services/timeSeries/docs/ALGORITHMS.md)
- [Usage Guide](../src/services/timeSeries/docs/USAGE_GUIDE.md)
- [ML Pipeline](../src/services/timeSeries/ml/README.md)
