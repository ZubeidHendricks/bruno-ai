/**
 * ERP Connectors
 * Collection of connectors for different ERP systems
 */

const SAPConnector = require('./sapConnector');
const OracleConnector = require('./oracleConnector');
const MicrosoftConnector = require('./microsoftConnector');

module.exports = {
  sap: SAPConnector,
  oracle: OracleConnector,
  microsoft: MicrosoftConnector
};
