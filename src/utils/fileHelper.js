const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');
const xlsx = require('xlsx');

/**
 * Parse file data based on file format
 * @param {string} filePath - Path to the file
 * @param {string} format - File format (csv, excel, json)
 * @returns {Object} Parsed data
 */
const parseFile = (filePath, format) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  let parsedData;

  try {
    if (format === 'csv' || filePath.endsWith('.csv')) {
      // Parse CSV
      const csvData = fs.readFileSync(filePath, 'utf8');
      parsedData = Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        error: (error) => {
          throw new Error(`CSV parsing error: ${error.message}`);
        }
      });
      
      if (parsedData.errors && parsedData.errors.length > 0) {
        const errorMessage = parsedData.errors.map(e => e.message).join(', ');
        throw new Error(`CSV parsing errors: ${errorMessage}`);
      }
    } else if (format === 'excel' || filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
      // Parse Excel
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      parsedData = {
        data: xlsx.utils.sheet_to_json(worksheet)
      };
    } else if (format === 'json' || filePath.endsWith('.json')) {
      // Parse JSON
      const jsonData = fs.readFileSync(filePath, 'utf8');
      const jsonParsed = JSON.parse(jsonData);
      parsedData = {
        data: Array.isArray(jsonParsed) ? jsonParsed : [jsonParsed]
      };
    } else {
      throw new Error('Unsupported file format');
    }
    
    if (!parsedData.data || parsedData.data.length === 0) {
      throw new Error('No data found in the file');
    }
    
    return parsedData;
  } catch (error) {
    throw error;
  }
};

/**
 * Detect column types from parsed data
 * @param {Array} data - Parsed data array
 * @returns {Array} Column metadata
 */
const detectColumnTypes = (data) => {
  if (!data || !data[0]) {
    return [];
  }
  
  return Object.keys(data[0]).map(key => {
    // Detect column type
    const values = data.map(row => row[key]).filter(val => val != null);
    let type = 'string';
    
    if (values.length > 0) {
      if (values.every(val => !isNaN(val))) {
        type = 'number';
      } else if (values.every(val => !isNaN(Date.parse(val)))) {
        type = 'date';
      }
    }
    
    return {
      name: key,
      type
    };
  });
};

/**
 * Export data in the specified format
 * @param {Array} data - Data to export
 * @param {string} format - Export format (csv, json, excel)
 * @param {string} fileName - Base file name
 * @returns {Object} Export data and content type
 */
const exportData = (data, format, fileName) => {
  let exportData;
  let contentType;
  let outputFileName;
  
  switch (format.toLowerCase()) {
    case 'csv':
      exportData = Papa.unparse(data);
      contentType = 'text/csv';
      outputFileName = `${fileName.replace(/\s+/g, '_')}_export.csv`;
      break;
      
    case 'json':
      exportData = JSON.stringify(data, null, 2);
      contentType = 'application/json';
      outputFileName = `${fileName.replace(/\s+/g, '_')}_export.json`;
      break;
      
    case 'excel':
      // Create a new workbook
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(data);
      xlsx.utils.book_append_sheet(wb, ws, 'Data');
      
      // Write to buffer
      const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      exportData = excelBuffer;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      outputFileName = `${fileName.replace(/\s+/g, '_')}_export.xlsx`;
      break;
      
    default:
      throw new Error('Unsupported export format');
  }
  
  return {
    data: exportData,
    contentType,
    fileName: outputFileName
  };
};

module.exports = {
  parseFile,
  detectColumnTypes,
  exportData
};
