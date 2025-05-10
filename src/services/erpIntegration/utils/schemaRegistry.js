/**
 * Schema Registry
 * Provides validation schemas for ERP entities
 */

/**
 * Get validation schema for an entity
 * @param {string} entity - Entity type
 * @returns {Object} - Validation schema
 */
function getSchemaForEntity(entity) {
  const schemas = {
    // Customer schema
    customers: {
      type: 'object',
      required: ['id', 'name', 'type'],
      properties: {
        id: { type: 'string' },
        type: { type: 'string', enum: ['customer'] },
        name: { type: 'string' },
        code: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        createdAt: { type: 'string', format: 'date-time' },
        modifiedAt: { type: 'string', format: 'date-time' },
        contactInfo: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            fax: { type: 'string' },
            website: { type: 'string' }
          }
        },
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            postalCode: { type: 'string' },
            country: { type: 'string' },
            state: { type: 'string' }
          }
        },
        taxInfo: {
          type: 'object',
          properties: {
            taxId: { type: 'string' },
            vatId: { type: 'string' },
            taxRegime: { type: 'string' }
          }
        },
        financialInfo: {
          type: 'object',
          properties: {
            accountGroup: { type: 'string' },
            paymentTerms: { type: 'string' },
            currency: { type: 'string' },
            creditLimit: { type: 'number' }
          }
        },
        metadata: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            originalId: { type: 'string' }
          }
        }
      }
    },
    
    // Invoice schema
    invoices: {
      type: 'object',
      required: ['id', 'number', 'date', 'customer', 'type'],
      properties: {
        id: { type: 'string' },
        type: { type: 'string', enum: ['invoice'] },
        number: { type: 'string' },
        date: { type: 'string', format: 'date-time' },
        dueDate: { type: 'string', format: 'date-time' },
        status: { type: 'string', enum: ['draft', 'open', 'partial', 'paid', 'cancelled', 'unknown'] },
        customer: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' }
          }
        },
        currency: { type: 'string' },
        totalNet: { type: 'number' },
        totalTax: { type: 'number' },
        totalGross: { type: 'number' },
        paymentTerms: { type: 'string' },
        paymentMethod: { type: 'string' },
        reference: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['quantity', 'unitPrice', 'netAmount'],
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              quantity: { type: 'number' },
              unit: { type: 'string' },
              unitPrice: { type: 'number' },
              netAmount: { type: 'number' },
              taxAmount: { type: 'number' },
              totalAmount: { type: 'number' },
              taxRate: { type: 'number' },
              product: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  code: { type: 'string' },
                  name: { type: 'string' }
                }
              }
            }
          }
        },
        metadata: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            originalId: { type: 'string' }
          }
        }
      }
    },
    
    // Product schema
    products: {
      type: 'object',
      required: ['id', 'name', 'type'],
      properties: {
        id: { type: 'string' },
        type: { type: 'string', enum: ['product'] },
        name: { type: 'string' },
        code: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive'] },
        createdAt: { type: 'string', format: 'date-time' },
        modifiedAt: { type: 'string', format: 'date-time' },
        category: { type: 'string' },
        group: { type: 'string' },
        unitOfMeasure: { type: 'string' },
        pricing: {
          type: 'object',
          properties: {
            listPrice: { type: 'number' },
            costPrice: { type: 'number' },
            currency: { type: 'string' }
          }
        },
        inventory: {
          type: 'object',
          properties: {
            inStock: { type: 'number' },
            available: { type: 'number' },
            reorderPoint: { type: 'number' },
            standardCost: { type: 'number' }
          }
        },
        attributes: {
          type: 'object'
        },
        metadata: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            originalId: { type: 'string' }
          }
        }
      }
    }
    
    // Additional entity schemas can be added here
  };
  
  return schemas[entity] || null;
}

module.exports = {
  getSchemaForEntity
};
