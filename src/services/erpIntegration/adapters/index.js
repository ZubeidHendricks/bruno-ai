/**
 * ERP Adapters
 * Collection of adapters for different ERP systems
 */

const SAPAdapter = require('./sap');
const OracleAdapter = require('./oracle');
const MicrosoftAdapter = require('./microsoft');

module.exports = {
  sap: SAPAdapter,
  oracle: OracleAdapter,
  microsoft: MicrosoftAdapter
};
