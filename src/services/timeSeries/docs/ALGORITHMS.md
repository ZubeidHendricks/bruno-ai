# Time Series Forecasting Algorithms - Technical Details

This document provides more detailed technical information about each forecasting algorithm implemented in the time series forecasting module.

## 1. Naive Forecast

### Mathematical Formulation
For a time series $y_1, y_2, ..., y_t$, the naive forecast for all future periods is:

$$\hat{y}_{t+h} = y_t$$

Where:
- $\hat{y}_{t+h}$ is the forecast for h periods ahead
- $y_t$ is the last observed value

### Implementation Details
- Simply uses the last value in the time series as the forecast for all future periods
- No parameters to adjust
- Serves as a baseline for more complex methods

### Advantages & Limitations
- **Advantages**: Simple, fast, no parameters to tune, works surprisingly well for random walk processes
- **Limitations**: Doesn't capture trends, seasonality, or any patterns in the data

## 2. Moving Average

### Mathematical Formulation
For a time series $y_1, y_2, ..., y_t$, the moving average forecast using a window of size $w$ is:

$$\hat{y}_{t+h} = \frac{1}{w} \sum_{i=t-w+1}^{t} y_i$$

Where:
- $\hat{y}_{t+h}$ is the forecast for h periods ahead
- $w$ is the window size
- $y_i$ are the observed values

### Implementation Details
- Calculates the average of the most recent $w$ values
- The window size can be specified or automatically determined based on data length
- Returns the same forecast value for all future periods

### Advantages & Limitations
- **Advantages**: Simple, reduces noise in the data, easy to understand
- **Limitations**: Doesn't capture trends or seasonality, lags behind in trending series

## 3. Linear Regression

### Mathematical Formulation
Linear regression models the time series as a linear function of time:

$$y_t = \alpha + \beta t + \varepsilon_t$$

Where:
- $\alpha$ is the intercept
- $\beta$ is the slope
- $\varepsilon_t$ is the error term
- $t$ is the time index

The forecast for future periods is:

$$\hat{y}_{t+h} = \alpha + \beta (t+h)$$

### Implementation Details
- Fits a straight line to the data using ordinary least squares
- Extrapolates the line for future periods
- Captures linear trends in the data

### Advantages & Limitations
- **Advantages**: Captures linear trends, simple to understand, statistically interpretable
- **Limitations**: Assumes trend is linear, doesn't capture seasonality or cyclical patterns

## 4. Exponential Smoothing

### Mathematical Formulation
Simple Exponential Smoothing is defined as:

$$L_t = \alpha y_t + (1 - \alpha) L_{t-1}$$

Where:
- $L_t$ is the level (or smoothed value) at time $t$
- $\alpha$ is the smoothing parameter (0 < $\alpha$ < 1)
- $y_t$ is the observed value at time $t$

The forecast for future periods is:

$$\hat{y}_{t+h} = L_t$$

### Implementation Details
- Uses a weighted average of all past observations, with weights decreasing exponentially
- The smoothing parameter $\alpha$ controls how quickly influence of past observations diminishes
- Adapts to changes in the level of the data

### Advantages & Limitations
- **Advantages**: Gives more weight to recent observations, adapts to changes in level
- **Limitations**: Doesn't handle trends or seasonality well

## 5. Double Exponential Smoothing (Holt's Method)

### Mathematical Formulation
Holt's method adds a trend component to simple exponential smoothing:

$$L_t = \alpha y_t + (1 - \alpha)(L_{t-1} + T_{t-1})$$
$$T_t = \beta(L_t - L_{t-1}) + (1 - \beta)T_{t-1}$$

Where:
- $L_t$ is the level at time $t$
- $T_t$ is the trend at time $t$
- $\alpha$ is the level smoothing parameter (0 < $\alpha$ < 1)
- $\beta$ is the trend smoothing parameter (0 < $\beta$ < 1)

The forecast for h periods ahead is:

$$\hat{y}_{t+h} = L_t + h \cdot T_t$$

### Implementation Details
- Maintains separate smoothing equations for level and trend
- The $\alpha$ parameter controls adaptation to changes in level
- The $\beta$ parameter controls adaptation to changes in trend
- Forecasts follow a linear trend into the future

### Advantages & Limitations
- **Advantages**: Captures both level and trend components, adapts to changes in both
- **Limitations**: Doesn't capture seasonality, can overforecast in the long term

## 6. Seasonal Naive

### Mathematical Formulation
For a time series with seasonal period $s$, the seasonal naive forecast is:

$$\hat{y}_{t+h} = y_{t+h-s \cdot \lceil h/s \rceil}$$

Where:
- $\lceil h/s \rceil$ is the ceiling function (smallest integer not less than h/s)
- $s$ is the seasonal period

### Implementation Details
- Uses the value from the same position in the previous seasonal cycle
- Requires at least one complete seasonal cycle in the data
- Seasonal period can be automatically detected or specified

### Advantages & Limitations
- **Advantages**: Simple, captures seasonal patterns effectively
- **Limitations**: Doesn't capture trends or changes in seasonality over time

## 7. Holt-Winters (Triple Exponential Smoothing)

### Mathematical Formulation
Holt-Winters adds a seasonal component to Holt's method:

$$L_t = \alpha \frac{y_t}{S_{t-s}} + (1 - \alpha)(L_{t-1} + T_{t-1})$$
$$T_t = \beta(L_t - L_{t-1}) + (1 - \beta)T_{t-1}$$
$$S_t = \gamma \frac{y_t}{L_t} + (1 - \gamma)S_{t-s}$$

Where:
- $L_t$ is the level at time $t$
- $T_t$ is the trend at time $t$
- $S_t$ is the seasonal component at time $t$
- $s$ is the seasonal period
- $\alpha$, $\beta$, and $\gamma$ are smoothing parameters (0 < parameters < 1)

The forecast for h periods ahead is:

$$\hat{y}_{t+h} = (L_t + h \cdot T_t) \cdot S_{t-s+h \mod s}$$

### Implementation Details
- Maintains separate smoothing equations for level, trend, and seasonality
- Supports multiplicative seasonality (as implemented here)
- Initializes level, trend, and seasonal components from the data
- Adapts to changes in all three components over time

### Advantages & Limitations
- **Advantages**: Captures level, trend, and seasonality, adapts to changes in all three
- **Limitations**: Requires good initial values and parameter selection, can be sensitive to outliers

## Accuracy Evaluation

All algorithms are evaluated using Mean Absolute Percentage Error (MAPE):

$$\text{MAPE} = \frac{100\%}{n} \sum_{i=1}^{n} \left| \frac{y_i - \hat{y}_i}{y_i} \right|$$

Where:
- $y_i$ are the actual values
- $\hat{y}_i$ are the forecasted values
- $n$ is the number of forecasted periods

Lower MAPE values indicate better forecast accuracy.

---

For more information on implementation details, refer to the actual code in the respective algorithm files.
