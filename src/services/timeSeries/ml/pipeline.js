/**
 * ML Pipeline Orchestrator
 * Coordinates the end-to-end ML workflow for time series forecasting
 */
const _ = require('lodash');
const moment = require('moment');
const logger = require('../../../utils/logger');

// Import pipeline components
const featureEngineering = require('./featureEngineering');
const validation = require('./validation');
const registry = require('./registry');
const training = require('./training');

// Import base forecaster
const timeSeriesForecaster = require('../timeSeriesForecaster');

/**
 * Run the complete ML pipeline for a time series
 * @param {Array} timeValues - Array of time values
 * @param {Array} values - Array of numeric values
 * @param {string} frequency - Detected data frequency
 * @param {Object} options - Pipeline options
 * @returns {Object} - Pipeline results with model, forecasts, and metrics
 */
async function runPipeline(timeValues, values, frequency, options = {}) {
  try {
    logger.info('Starting time series ML pipeline', { frequency, timeValues: timeValues.length });
    
    // Step 1: Generate features
    const features = await featureEngineering.generateFeatures(timeValues, values, frequency, options);
    logger.info('Feature engineering complete', { featureCount: features.length });
    
    // Step 2: Split data for training/validation
    const { trainData, validationData, testData } = validation.splitTimeSeriesData(
      timeValues, values, features, options.splitRatio || [0.7, 0.15, 0.15]
    );
    logger.info('Data split complete', { 
      trainSize: trainData.values.length,
      validationSize: validationData.values.length,
      testSize: testData.values.length
    });
    
    // Step 3: Train models
    const modelResults = await training.trainModels(
      trainData.timeValues,
      trainData.values,
      frequency,
      features,
      options
    );
    logger.info('Model training complete', { modelCount: Object.keys(modelResults).length });
    
    // Step 4: Validate models
    const validationResults = validation.evaluateModels(
      modelResults,
      validationData.timeValues,
      validationData.values,
      frequency
    );
    logger.info('Model validation complete');
    
    // Step 5: Select best model
    const bestModel = validation.selectBestModel(validationResults);
    logger.info('Best model selected', { method: bestModel.method, metrics: bestModel.metrics });
    
    // Step 6: Test final model
    const testResults = validation.evaluateModel(
      bestModel,
      testData.timeValues,
      testData.values,
      frequency
    );
    logger.info('Model testing complete', { metrics: testResults.metrics });
    
    // Step 7: Register model to registry
    const modelId = await registry.registerModel({
      method: bestModel.method,
      parameters: bestModel.parameters,
      metrics: testResults.metrics,
      features: features,
      timestamp: new Date().toISOString(),
      version: options.version || '1.0.0'
    });
    logger.info('Model registered', { modelId });
    
    // Step 8: Generate final forecasts with best model
    const forecastHorizon = options.horizon || timeSeriesForecaster.utils.time.getDefaultHorizon(frequency);
    const finalForecasts = await timeSeriesForecaster.generateForecasts(
      timeValues,
      values,
      frequency,
      {
        method: bestModel.method,
        ...bestModel.parameters,
        horizon: forecastHorizon
      }
    );
    
    // Step 9: Generate confidence intervals
    const forecastsWithCI = timeSeriesForecaster.generateConfidenceIntervals(
      values, 
      finalForecasts, 
      options.confidenceLevel || 0.95
    );
    
    // Return pipeline results
    return {
      modelId,
      model: bestModel,
      trainMetrics: bestModel.metrics,
      validationMetrics: validationResults.find(m => m.method === bestModel.method).metrics,
      testMetrics: testResults.metrics,
      forecasts: forecastsWithCI,
      features: features
    };
  } catch (error) {
    logger.error('Error in time series ML pipeline', { error });
    throw error;
  }
}

/**
 * Run a scheduled retraining job
 * @param {string} modelId - ID of the model to retrain
 * @param {Array} newTimeValues - New time values since last training
 * @param {Array} newValues - New values since last training
 * @param {Object} options - Retraining options
 * @returns {Object} - Retraining results
 */
async function retrainModel(modelId, newTimeValues, newValues, options = {}) {
  try {
    logger.info('Starting model retraining', { modelId });
    
    // Step 1: Load the existing model from registry
    const existingModel = await registry.getModel(modelId);
    if (!existingModel) {
      throw new Error(`Model with ID ${modelId} not found in registry`);
    }
    
    // Step 2: Load the historical data used for the original model
    const historicalData = await registry.getModelData(modelId);
    
    // Step 3: Combine historical data with new data
    const combinedTimeValues = [...historicalData.timeValues, ...newTimeValues];
    const combinedValues = [...historicalData.values, ...newValues];
    
    // Step 4: Determine if retraining is needed
    const shouldRetrain = validation.checkRetrainingNeed(
      existingModel,
      historicalData,
      newTimeValues,
      newValues,
      options
    );
    
    if (!shouldRetrain) {
      logger.info('Retraining not required based on new data');
      return {
        modelId,
        retrained: false,
        reason: 'No significant change in data patterns'
      };
    }
    
    // Step 5: Run the full pipeline with combined data
    const frequency = options.frequency || historicalData.frequency;
    const pipelineResults = await runPipeline(
      combinedTimeValues,
      combinedValues,
      frequency,
      {
        ...options,
        version: incrementVersion(existingModel.version)
      }
    );
    
    // Step 6: Compare new model with existing model
    const improvement = validation.compareModels(
      existingModel,
      pipelineResults.model,
      newTimeValues,
      newValues,
      frequency
    );
    
    // Step 7: Decide whether to keep new model
    if (improvement.isImprovement) {
      logger.info('New model shows improvement, updating', {
        improvement: improvement.improvementPercentage
      });
      
      // Update model in registry
      await registry.updateModel(modelId, pipelineResults.model);
      
      return {
        modelId: pipelineResults.modelId,
        retrained: true,
        improvement: improvement,
        newModel: pipelineResults.model,
        forecasts: pipelineResults.forecasts
      };
    } else {
      logger.info('New model does not show significant improvement, keeping existing model', {
        difference: improvement.improvementPercentage
      });
      
      return {
        modelId,
        retrained: false,
        reason: 'New model does not show significant improvement',
        improvement: improvement
      };
    }
  } catch (error) {
    logger.error('Error during model retraining', { error, modelId });
    throw error;
  }
}

/**
 * Increment the version string (semantic versioning)
 * @param {string} version - Current version
 * @returns {string} - Incremented version
 */
function incrementVersion(version) {
  const parts = version.split('.');
  parts[2] = (parseInt(parts[2], 10) + 1).toString();
  return parts.join('.');
}

module.exports = {
  runPipeline,
  retrainModel
};
