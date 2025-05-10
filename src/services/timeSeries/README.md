# Time Series Forecasting Module

This module provides comprehensive time series forecasting capabilities for various data frequencies and patterns. It implements multiple forecasting algorithms and automatically selects the best performing one based on historical accuracy.

## Overview

The time series forecasting module:

- Supports multiple forecasting algorithms ranging from simple to complex
- Automatically detects seasonality patterns in the data
- Calculates confidence intervals for forecasts
- Works with various data frequencies (daily, weekly, monthly, quarterly, yearly)
- Evaluates forecast accuracy using Mean Absolute Percentage Error (MAPE)
- Integrates with a full machine learning pipeline for enhanced forecasting

## Forecasting Algorithms

The module implements the following forecasting algorithms:

### 1. Naive Forecast
**File**: `algorithms/naiveForecaster.js`

The Naive Forecast simply uses the last observed value for all future forecasts. Despite its simplicity, it serves as a baseline and can be surprisingly effective for certain types of data, especially those with random walk characteristics.

**Best used for**: Data without clear patterns or when other methods are overfitting.

### 2. Moving Average
**File**: `algorithms/movingAverageForecaster.js`

The Moving Average method calculates the average of the most recent n values in the time series and uses that average as the forecast for all future periods. This method smooths out short-term fluctuations and highlights longer-term trends or cycles.

**Best used for**: Data with noise but no clear trend or seasonality.

### 3. Linear Regression
**File**: `algorithms/linearRegressionForecaster.js`

Linear Regression forecasting fits a straight line to the data and projects it forward. It's particularly good at capturing linear trends in the data, producing forecasts that follow the general direction of the time series.

**Best used for**: Data with a clear linear trend and no seasonality.

### 4. Exponential Smoothing
**File**: `algorithms/exponentialSmoothingForecaster.js`

Exponential Smoothing gives more weight to recent observations and exponentially less weight to older observations. The parameter alpha (0 < alpha < 1) controls the rate at which the influence of older observations diminishes.

**Best used for**: Data with level but no trend or seasonality, where recent observations are more relevant.

### 5. Double Exponential Smoothing (Holt's Method)
**File**: `algorithms/doubleExponentialSmoothingForecaster.js`

Double Exponential Smoothing (Holt's method) extends simple exponential smoothing to allow forecasting of data with a trend. It uses two smoothing parameters: alpha for the level and beta for the trend.

**Best used for**: Data with both level and trend components, but no seasonality.

### 6. Seasonal Naive
**File**: `algorithms/seasonalNaiveForecaster.js`

Seasonal Naive forecasting uses values from the same season in the previous cycle. For example, if forecasting monthly data with yearly seasonality, the forecast for January 2025 would be the value from January 2024.

**Best used for**: Strongly seasonal data without much change in the seasonal pattern over time.

### 7. Holt-Winters (Triple Exponential Smoothing)
**File**: `algorithms/holtWintersForecaster.js`

Holt-Winters, or Triple Exponential Smoothing, extends Holt's method to capture seasonality. It uses three smoothing parameters: alpha for the level, beta for the trend, and gamma for the seasonal component.

**Best used for**: Data exhibiting level, trend, and seasonality.

## Utility Components

### Seasonality Detection
**File**: `utils/seasonalityDetector.js`

Automatically detects seasonal patterns in time series data using autocorrelation analysis. It can identify the most likely seasonal period based on the data frequency and statistical patterns.

### Time Utilities
**File**: `utils/timeUtils.js`

Provides utilities for handling time-related aspects of forecasting, including generating future time points based on data frequency and determining appropriate forecast horizons.

### Accuracy Utilities
**File**: `utils/accuracyUtils.js`

Contains functions for evaluating forecast accuracy, calculating prediction errors, and generating confidence intervals for forecasts.

## ML Pipeline Integration

The module integrates with a comprehensive machine learning pipeline that enhances forecasting capabilities through advanced techniques:

### 1. Feature Engineering
**Location**: `ml/featureEngineering/`

Extracts meaningful features from time series data to improve forecast accuracy:

- **Time Features**: Calendar-based features like day of week, month, seasonal components
- **Lag Features**: Previous values, moving averages, differences between periods
- **Statistical Features**: Rolling statistics, expanding window metrics
- **Transform Features**: Mathematical transformations (log, square root, normalization)
- **External Features**: Integration with external data sources (weather, holidays, economic indicators)

### 2. Validation Framework
**Location**: `ml/validation/`

Provides robust validation techniques specifically designed for time series data:

- **Time-Series Cross-Validation**: Proper validation respecting temporal order
- **Comprehensive Metrics**: MAPE, RMSE, MAE, R², MASE, SMAPE, bias
- **Model Comparison**: Tools to compare and select the best models
- **Drift Detection**: Identifies when models need retraining based on distribution changes

### 3. Training Pipeline
**Location**: `ml/training/`

Handles the end-to-end training process for forecasting models:

- **Hyperparameter Tuning**: Grid search for optimal model parameters
- **Feature Selection**: Identifies most important features for each model
- **Model Training**: Consistent interface for training all forecasting methods
- **Retraining Logic**: Automatically determines when models should be retrained

### 4. Model Registry
**Location**: `ml/registry/`

Manages trained models for reproducibility and deployment:

- **Model Storage**: Persists trained models to disk or database
- **Versioning**: Tracks model versions with complete history
- **Metadata Management**: Stores additional information about models
- **Deployment Tracking**: Monitors where models are deployed

### 5. Pipeline Orchestrator
**Location**: `ml/pipeline.js`

Coordinates the entire ML workflow:

- **End-to-End Pipeline**: Feature generation, training, validation, selection
- **Automated Retraining**: Detects when models need retraining and handles updates
- **Confidence Intervals**: Generates statistically valid confidence intervals

## Basic Usage Example

```javascript
const timeSeriesForecaster = require('./services/timeSeries');

// Sample data
const timeValues = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];
const values = [10, 12, 13, 15, 16];
const frequency = 'daily';

// Generate forecasts
const forecasts = await timeSeriesForecaster.generateForecasts(timeValues, values, frequency, {
  horizon: 7 // Forecast 7 periods ahead
});

// Add confidence intervals
const forecastsWithCI = timeSeriesForecaster.generateConfidenceIntervals(values, forecasts, 0.95);

console.log('Best forecasting method:', forecastsWithCI.bestMethod);
console.log('Forecast values:', forecastsWithCI.methods[forecastsWithCI.bestMethod].values);
console.log('Confidence intervals:', forecastsWithCI.methods[forecastsWithCI.bestMethod].confidenceIntervals);
```

## ML Pipeline Usage Example

```javascript
const { pipeline } = require('./services/timeSeries/ml');
const timeValues = ['2024-01-01', '2024-01-02', '2024-01-03', /* ... */];
const values = [10, 12, 15, /* ... */];
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

// Later, retrain the model with new data
const newTimeValues = ['2024-02-01', '2024-02-02', /* ... */];
const newValues = [22, 25, /* ... */];

const retrainingResults = await pipeline.retrainModel(
  pipelineResults.modelId, 
  newTimeValues, 
  newValues
);
```

## Benefits of the ML Pipeline

The ML pipeline integration provides several key advantages:

1. **Improved Accuracy**: Enhanced forecast accuracy through feature engineering and hyperparameter tuning
2. **Reproducibility**: Models are stored and versioned for reproducibility
3. **Automation**: Automated retraining and model selection
4. **Maintainability**: Modular and extensible code structure
5. **Robustness**: Proper validation techniques for time series data

## Algorithm Selection Logic

The system automatically selects the best forecasting method by:

1. Training each algorithm on the first half of the data
2. Testing against the second half
3. Calculating Mean Absolute Percentage Error (MAPE) for each method
4. Selecting the method with the lowest error

This ensures the selected algorithm has demonstrated good performance on known data before using it for future forecasts.

## Confidence Intervals

The module can generate confidence intervals for the best forecasting method, indicating the range within which the actual values are likely to fall. The width of the intervals increases for forecasts further into the future, reflecting the growing uncertainty.

## Directory Structure

```
timeSeries/
├── algorithms/             # Individual forecasting algorithms
│   ├── naiveForecaster.js
│   ├── movingAverageForecaster.js
│   ├── linearRegressionForecaster.js
│   ├── exponentialSmoothingForecaster.js
│   ├── doubleExponentialSmoothingForecaster.js
│   ├── seasonalNaiveForecaster.js
│   └── holtWintersForecaster.js
├── utils/                  # Utility functions
│   ├── timeUtils.js
│   ├── seasonalityDetector.js
│   └── accuracyUtils.js
├── ml/                     # Machine Learning pipeline
│   ├── featureEngineering/ # Feature extraction modules
│   ├── validation/         # Validation and model selection
│   ├── training/           # Model training and tuning
│   ├── registry/           # Model storage and versioning
│   └── pipeline.js         # Pipeline orchestrator
├── docs/                   # Documentation
│   ├── ALGORITHMS.md       # Detailed algorithm explanations
│   └── USAGE_GUIDE.md      # Comprehensive usage guide
├── index.js                # Main module exports
├── timeSeriesForecaster.js # Core forecasting functionality
└── README.md               # This file
```

## Extending the System

The modular design allows for easy extension:

1. **New Algorithms**: Add new forecasting algorithms to the `algorithms/` directory
2. **New Features**: Implement new feature extractors in `ml/featureEngineering/`
3. **Advanced Models**: Integrate with deep learning or ensemble methods
4. **External Data**: Connect to additional data sources for enhanced forecasting

---

For more detailed information on each algorithm, refer to the documentation in the respective module files and in the `docs/` directory.
