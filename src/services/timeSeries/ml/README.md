# Time Series Forecasting ML Pipeline

This module integrates the time series forecasting capabilities with a comprehensive machine learning pipeline for improved accuracy, feature engineering, model selection, and automated retraining.

## Overview

The ML pipeline enhances the base time series forecasting module with:

1. **Feature Engineering** - Extracts meaningful features from time series data and external sources
2. **Cross-Validation** - Provides robust model validation and selection
3. **Hyperparameter Tuning** - Optimizes model parameters for better performance
4. **Model Registry** - Stores and versions trained models
5. **Automated Retraining** - Detects when models need retraining based on drift detection

## Pipeline Components

### Feature Engineering

The feature engineering module generates various features from time series data:

- **Time Features**: Calendar-based features like day of week, month, seasonal components
- **Lag Features**: Previous values, moving averages, differences
- **Statistical Features**: Rolling statistics, expanding window metrics
- **Transform Features**: Mathematical transformations like log, square root, normalization
- **External Features**: Weather, holidays, economic indicators

### Validation

The validation module provides tools for:

- **Data Splitting**: Divides data into training, validation, and test sets
- **Cross-Validation**: Time series specific CV with expanding windows
- **Metric Calculation**: MAPE, RMSE, MAE, R², MASE, SMAPE, bias
- **Model Selection**: Chooses the best model based on validation metrics
- **Drift Detection**: Identifies when models need retraining

### Training

The training module handles:

- **Model Training**: Trains models with selected parameters
- **Hyperparameter Tuning**: Grid search for optimal parameters
- **Feature Importance**: Calculates feature importance for models
- **Model Export/Import**: Standardized format for model sharing

### Registry

The registry module provides:

- **Model Storage**: Saves trained models to disk or database
- **Versioning**: Tracks model versions and updates
- **Metadata**: Stores additional information about models
- **Deployments**: Tracks model deployments and status
- **Tagging**: Applies tags to models for organization

## Usage Example

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
  newValues,
  { forcedRetrain: true }
);
```

## Feature Engineering Details

The feature engineering module extracts various types of features:

### Time Features

```javascript
// Example time features
{
  name: 'day_of_week',
  type: 'categorical',
  values: [0, 1, 2, 3, 4, 5, 6, 0, ...],
  description: 'Day of week (0-6, 0 is Sunday)'
}
```

### Lag Features

```javascript
// Example lag feature
{
  name: 'lag_7',
  type: 'numerical',
  values: [null, null, null, null, null, null, null, 10, 12, ...],
  description: 'Value lagged by 7 periods'
}
```

### Statistical Features

```javascript
// Example statistical feature
{
  name: 'rolling_mean_7',
  type: 'numerical',
  values: [null, null, null, null, null, null, 10.5, 11.7, ...],
  description: 'Rolling mean with window size 7'
}
```

## Model Selection Process

The model selection process follows these steps:

1. **Feature Engineering**: Generate features from time series data
2. **Data Splitting**: Split data into training, validation, and test sets
3. **Hyperparameter Tuning**: Find optimal parameters for each model
4. **Model Training**: Train models with optimal parameters
5. **Validation**: Evaluate models on validation data
6. **Selection**: Choose the best model based on metrics
7. **Final Testing**: Evaluate the best model on test data
8. **Registration**: Register the model in the model registry

## Automated Retraining

The pipeline can automatically detect when a model needs retraining:

- **Concept Drift**: Detects changes in the statistical properties of the target variable
- **Feature Drift**: Detects changes in the distribution of features
- **Performance Decay**: Detects when model performance deteriorates
- **Time-Based**: Retrains models after a specified time period

## Extending the Pipeline

To extend the pipeline with new capabilities:

1. **New Features**: Add new feature extractors to the feature engineering module
2. **New Models**: Implement new forecasting algorithms in the base module
3. **New Metrics**: Add new evaluation metrics to the validation module
4. **Integration**: Connect to external systems for data or model serving

## Production Deployment Considerations

For production deployment:

1. **Scalability**: Use database storage for the model registry
2. **Monitoring**: Implement model monitoring for drift detection
3. **API**: Create an API for model serving
4. **Logging**: Set up comprehensive logging for the pipeline
5. **Testing**: Implement unit and integration tests

## Related Documentation

- [Time Series Forecasting Algorithms](../docs/ALGORITHMS.md)
- [Usage Guide](../docs/USAGE_GUIDE.md)
