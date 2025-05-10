/**
 * Customer Model
 * Represents a customer in the ERP integration
 */

/**
 * Customer class
 */
class Customer {
  /**
   * Create a customer
   * @param {Object} data - Customer data
   */
  constructor(data = {}) {
    this.id = data.id || null;
    this.type = 'customer';
    this.name = data.name || '';
    this.code = data.code || '';
    this.status = data.status || 'active';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.modifiedAt = data.modifiedAt || new Date().toISOString();
    
    // Contact information
    this.contactInfo = {
      email: data.contactInfo?.email || '',
      phone: data.contactInfo?.phone || '',
      fax: data.contactInfo?.fax || '',
      website: data.contactInfo?.website || ''
    };
    
    // Address
    this.address = {
      street: data.address?.street || '',
      additionalInfo: data.address?.additionalInfo || '',
      city: data.address?.city || '',
      postalCode: data.address?.postalCode || '',
      country: data.address?.country || '',
      state: data.address?.state || ''
    };
    
    // Tax information
    this.taxInfo = {
      taxId: data.taxInfo?.taxId || '',
      vatId: data.taxInfo?.vatId || '',
      taxRegime: data.taxInfo?.taxRegime || ''
    };
    
    // Financial information
    this.financialInfo = {
      accountGroup: data.financialInfo?.accountGroup || '',
      paymentTerms: data.financialInfo?.paymentTerms || '',
      currency: data.financialInfo?.currency || '',
      creditLimit: data.financialInfo?.creditLimit || 0
    };
    
    // Metadata
    this.metadata = {
      source: data.metadata?.source || '',
      originalId: data.metadata?.originalId || '',
      sourceSystem: data.metadata?.sourceSystem || null,
      lastSync: data.metadata?.lastSync || null,
      ...data.metadata
    };
  }
  
  /**
   * Validate customer data
   * @returns {Object} - Validation result
   */
  validate() {
    const errors = [];
    
    // Required fields
    if (!this.id) {
      errors.push('Customer ID is required');
    }
    
    if (!this.name) {
      errors.push('Customer name is required');
    }
    
    // Email validation
    if (this.contactInfo.email && !this.isValidEmail(this.contactInfo.email)) {
      errors.push('Invalid email format');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Check if email is valid
   * @param {string} email - Email to check
   * @returns {boolean} - Whether email is valid
   */
  isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  /**
   * Convert to JSON
   * @returns {Object} - JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      code: this.code,
      status: this.status,
      createdAt: this.createdAt,
      modifiedAt: this.modifiedAt,
      contactInfo: this.contactInfo,
      address: this.address,
      taxInfo: this.taxInfo,
      financialInfo: this.financialInfo,
      metadata: this.metadata
    };
  }
  
  /**
   * Create from JSON
   * @param {Object} json - JSON data
   * @returns {Customer} - Customer instance
   */
  static fromJSON(json) {
    return new Customer(json);
  }
}

module.exports = Customer;
