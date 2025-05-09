/**
 * Filter data based on column and value
 * @param {Array} data - Data to filter
 * @param {string} column - Column name to filter by
 * @param {string} value - Value to filter by
 * @returns {Object} Filtered data and message
 */
const filterData = (data, column, value) => {
  if (!column || value === undefined) {
    return {
      data,
      message: "Couldn't perform filtering due to missing conditions"
    };
  }
  
  const filteredData = data.filter(row => 
    String(row[column]).toLowerCase() === String(value).toLowerCase()
  );
  
  return {
    data: filteredData,
    message: `Filtered data where ${column} equals "${value}"`
  };
};

/**
 * Sort data based on column and order
 * @param {Array} data - Data to sort
 * @param {string} column - Column name to sort by
 * @param {string} order - Sort order (asc or desc)
 * @returns {Object} Sorted data and message
 */
const sortData = (data, column, order = 'asc') => {
  if (!column) {
    return {
      data,
      message: "Couldn't perform sorting due to missing column"
    };
  }
  
  const sortedData = [...data].sort((a, b) => {
    if (order.toLowerCase() === 'asc') {
      return a[column] > b[column] ? 1 : -1;
    } else {
      return a[column] < b[column] ? 1 : -1;
    }
  });
  
  return {
    data: sortedData,
    message: `Sorted data by ${column} in ${order} order`
  };
};

/**
 * Remove duplicates based on specified columns
 * @param {Array} data - Data to deduplicate
 * @param {Array} columns - Columns to consider for deduplication
 * @returns {Object} Deduplicated data and message
 */
const removeDuplicates = (data, columns) => {
  if (!data || !data[0]) {
    return {
      data,
      message: "Couldn't remove duplicates: no data provided"
    };
  }
  
  const dedupeColumns = columns || Object.keys(data[0]);
  
  const dedupedData = [];
  const seen = new Set();
  
  data.forEach(row => {
    const key = dedupeColumns.map(col => row[col]).join('|');
    if (!seen.has(key)) {
      seen.add(key);
      dedupedData.push(row);
    }
  });
  
  return {
    data: dedupedData,
    message: `Removed duplicates based on columns: ${dedupeColumns.join(', ')}`
  };
};

/**
 * Calculate aggregations by group
 * @param {Array} data - Data to aggregate
 * @param {string} groupBy - Column to group by
 * @param {Array} metrics - Metrics to calculate
 * @returns {Object} Aggregated data and message
 */
const calculateAggregations = (data, groupBy, metrics = []) => {
  if (!groupBy || !metrics || metrics.length === 0) {
    return {
      data,
      message: "Couldn't perform calculation due to missing conditions"
    };
  }
  
  // Group data
  const groups = {};
  data.forEach(row => {
    const key = row[groupBy];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(row);
  });
  
  // Calculate aggregates
  const resultData = Object.keys(groups).map(key => {
    const group = groups[key];
    const result = { [groupBy]: key };
    
    metrics.forEach(metric => {
      const values = group.map(item => parseFloat(item[metric.column])).filter(val => !isNaN(val));
      
      switch (metric.function) {
        case 'sum':
          result[`sum_${metric.column}`] = values.reduce((a, b) => a + b, 0);
          break;
        case 'average':
          result[`avg_${metric.column}`] = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'min':
          result[`min_${metric.column}`] = Math.min(...values);
          break;
        case 'max':
          result[`max_${metric.column}`] = Math.max(...values);
          break;
        case 'count':
          result[`count_${metric.column}`] = values.length;
          break;
      }
    });
    
    return result;
  });
  
  return {
    data: resultData,
    message: `Calculated aggregations grouped by ${groupBy}`
  };
};

module.exports = {
  filterData,
  sortData,
  removeDuplicates,
  calculateAggregations
};
