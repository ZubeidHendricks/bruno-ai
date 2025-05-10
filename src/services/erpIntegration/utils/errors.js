/**
 * ERP Integration Error Classes
 */

/**
 * Base ERP Error
 */
class ERPError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ERPError';
  }
}

/**
 * SAP Error
 */
class SAPError extends ERPError {
  constructor(message) {
    super(message);
    this.name = 'SAPError';
  }
}

/**
 * Oracle Error
 */
class OracleError extends ERPError {
  constructor(message) {
    super(message);
    this.name = 'OracleError';
  }
}

/**
 * Microsoft Error
 */
class MicrosoftError extends ERPError {
  constructor(message) {
    super(message);
    this.name = 'MicrosoftError';
  }
}

/**
 * Transform Error
 */
class TransformError extends ERPError {
  constructor(message) {
    super(message);
    this.name = 'TransformError';
  }
}

/**
 * Sync Error
 */
class SyncError extends ERPError {
  constructor(message) {
    super(message);
    this.name = 'SyncError';
  }
}

module.exports = {
  ERPError,
  SAPError,
  OracleError,
  MicrosoftError,
  TransformError,
  SyncError
};
