/**
 * Oracle Transformers
 * Transform data between Oracle ERP and Bruno AI formats
 */

/**
 * Customer transformers
 */
const customers = {
  /**
   * Transform Oracle customer data to Bruno AI format
   * @param {Object} oracleCustomer - Oracle customer data
   * @returns {Object} - Bruno AI customer data
   */
  import: (oracleCustomer) => {
    return {
      id: oracleCustomer.PartyNumber,
      type: 'customer',
      name: oracleCustomer.PartyName,
      code: oracleCustomer.CustomerAccountNumber,
      status: oracleCustomer.Status === 'ACTIVE' ? 'active' : 'inactive',
      createdAt: new Date(oracleCustomer.CreationDate).toISOString(),
      modifiedAt: new Date(oracleCustomer.LastUpdateDate).toISOString(),
      contactInfo: {
        email: oracleCustomer.EmailAddress,
        phone: oracleCustomer.PhoneNumber,
        fax: oracleCustomer.FaxNumber,
        website: oracleCustomer.WebAddress
      },
      address: {
        street: oracleCustomer.Address1,
        additionalInfo: oracleCustomer.Address2,
        city: oracleCustomer.City,
        postalCode: oracleCustomer.PostalCode,
        country: oracleCustomer.Country,
        state: oracleCustomer.State
      },
      taxInfo: {
        taxId: oracleCustomer.TaxRegistrationNumber,
        taxRegime: oracleCustomer.TaxRegimeCode
      },
      financialInfo: {
        accountGroup: oracleCustomer.CustomerGroup,
        paymentTerms: oracleCustomer.PaymentTerms,
        currency: oracleCustomer.CurrencyCode,
        creditLimit: parseFloat(oracleCustomer.CreditLimit || 0)
      },
      metadata: {
        source: 'oracle',
        originalId: oracleCustomer.PartyId,
        oracleFields: {
          customerType: oracleCustomer.CustomerType,
          customerClass: oracleCustomer.CustomerClass,
          accountType: oracleCustomer.AccountType,
          salesPerson: oracleCustomer.SalesPerson,
          salesTerritory: oracleCustomer.SalesTerritory
        }
      }
    };
  },
  
  /**
   * Transform Bruno AI customer data to Oracle format
   * @param {Object} brunoCustomer - Bruno AI customer data
   * @returns {Object} - Oracle customer data
   */
  export: (brunoCustomer) => {
    return {
      PartyNumber: brunoCustomer.id,
      PartyName: brunoCustomer.name,
      CustomerAccountNumber: brunoCustomer.code,
      Status: brunoCustomer.status === 'active' ? 'ACTIVE' : 'INACTIVE',
      
      // Contact info
      EmailAddress: brunoCustomer.contactInfo?.email || '',
      PhoneNumber: brunoCustomer.contactInfo?.phone || '',
      FaxNumber: brunoCustomer.contactInfo?.fax || '',
      WebAddress: brunoCustomer.contactInfo?.website || '',
      
      // Address
      Address1: brunoCustomer.address?.street || '',
      Address2: brunoCustomer.address?.additionalInfo || '',
      City: brunoCustomer.address?.city || '',
      PostalCode: brunoCustomer.address?.postalCode || '',
      Country: brunoCustomer.address?.country || '',
      State: brunoCustomer.address?.state || '',
      
      // Tax information
      TaxRegistrationNumber: brunoCustomer.taxInfo?.taxId || '',
      TaxRegimeCode: brunoCustomer.taxInfo?.taxRegime || '',
      
      // Financial information
      CustomerGroup: brunoCustomer.financialInfo?.accountGroup || '',
      PaymentTerms: brunoCustomer.financialInfo?.paymentTerms || '',
      CurrencyCode: brunoCustomer.financialInfo?.currency || '',
      CreditLimit: brunoCustomer.financialInfo?.creditLimit?.toString() || '0',
      
      // Oracle-specific fields
      CustomerType: brunoCustomer.metadata?.oracleFields?.customerType || '',
      CustomerClass: brunoCustomer.metadata?.oracleFields?.customerClass || '',
      AccountType: brunoCustomer.metadata?.oracleFields?.accountType || '',
      SalesPerson: brunoCustomer.metadata?.oracleFields?.salesPerson || '',
      SalesTerritory: brunoCustomer.metadata?.oracleFields?.salesTerritory || ''
    };
  }
};

/**
 * Invoice transformers
 */
const invoices = {
  /**
   * Transform Oracle invoice data to Bruno AI format
   * @param {Object} oracleInvoice - Oracle invoice data
   * @returns {Object} - Bruno AI invoice data
   */
  import: (oracleInvoice) => {
    // Extract invoice lines
    const items = oracleInvoice.InvoiceLines?.map(line => ({
      id: line.LineNumber,
      description: line.Description,
      quantity: parseFloat(line.Quantity),
      unit: line.UnitOfMeasure,
      unitPrice: parseFloat(line.UnitPrice),
      netAmount: parseFloat(line.LineAmount),
      taxAmount: parseFloat(line.TaxAmount),
      totalAmount: parseFloat(line.LineAmount) + parseFloat(line.TaxAmount),
      taxRate: parseFloat(line.TaxRate),
      product: {
        id: line.ItemNumber,
        name: line.ItemDescription
      }
    })) || [];
    
    return {
      id: oracleInvoice.InvoiceNumber,
      type: 'invoice',
      number: oracleInvoice.InvoiceNumber,
      date: new Date(oracleInvoice.InvoiceDate).toISOString(),
      dueDate: new Date(oracleInvoice.DueDate).toISOString(),
      status: mapInvoiceStatus(oracleInvoice.Status),
      customer: {
        id: oracleInvoice.CustomerAccountNumber,
        name: oracleInvoice.CustomerName
      },
      currency: oracleInvoice.InvoiceCurrencyCode,
      totalNet: parseFloat(oracleInvoice.InvoiceAmount),
      totalTax: parseFloat(oracleInvoice.TaxAmount),
      totalGross: parseFloat(oracleInvoice.InvoiceAmount) + parseFloat(oracleInvoice.TaxAmount),
      paymentTerms: oracleInvoice.PaymentTerms,
      paymentMethod: oracleInvoice.PaymentMethod,
      reference: oracleInvoice.CustomerReferenceNumber,
      items,
      metadata: {
        source: 'oracle',
        originalId: oracleInvoice.InvoiceId,
        oracleFields: {
          businessUnit: oracleInvoice.BusinessUnit,
          legalEntity: oracleInvoice.LegalEntity,
          invoiceType: oracleInvoice.Type,
          invoiceSource: oracleInvoice.Source
        }
      }
    };
  },
  
  /**
   * Transform Bruno AI invoice data to Oracle format
   * @param {Object} brunoInvoice - Bruno AI invoice data
   * @returns {Object} - Oracle invoice data
   */
  export: (brunoInvoice) => {
    // Create Oracle invoice lines
    const invoiceLines = brunoInvoice.items?.map(item => ({
      LineNumber: item.id || '',
      Description: item.description || '',
      Quantity: item.quantity.toString(),
      UnitOfMeasure: item.unit || 'EA',
      UnitPrice: item.unitPrice.toString(),
      LineAmount: item.netAmount.toString(),
      TaxAmount: item.taxAmount.toString(),
      TaxRate: item.taxRate.toString(),
      ItemNumber: item.product?.id || '',
      ItemDescription: item.product?.name || ''
    })) || [];
    
    return {
      InvoiceNumber: brunoInvoice.number,
      InvoiceDate: new Date(brunoInvoice.date).toISOString().split('T')[0],
      DueDate: new Date(brunoInvoice.dueDate).toISOString().split('T')[0],
      Status: mapInvoiceStatusToOracle(brunoInvoice.status),
      CustomerAccountNumber: brunoInvoice.customer?.id || '',
      CustomerName: brunoInvoice.customer?.name || '',
      InvoiceCurrencyCode: brunoInvoice.currency || 'USD',
      InvoiceAmount: brunoInvoice.totalNet.toString(),
      TaxAmount: brunoInvoice.totalTax.toString(),
      PaymentTerms: brunoInvoice.paymentTerms || '',
      PaymentMethod: brunoInvoice.paymentMethod || '',
      CustomerReferenceNumber: brunoInvoice.reference || '',
      
      // Oracle-specific fields
      BusinessUnit: brunoInvoice.metadata?.oracleFields?.businessUnit || '',
      LegalEntity: brunoInvoice.metadata?.oracleFields?.legalEntity || '',
      Type: brunoInvoice.metadata?.oracleFields?.invoiceType || 'STANDARD',
      Source: brunoInvoice.metadata?.oracleFields?.invoiceSource || 'MANUAL',
      
      // Invoice lines
      InvoiceLines: invoiceLines
    };
  }
};

/**
 * Map Oracle invoice status to Bruno AI status
 * @param {string} oracleStatus - Oracle invoice status
 * @returns {string} - Bruno AI invoice status
 */
function mapInvoiceStatus(oracleStatus) {
  const statusMap = {
    'APPROVED': 'open',
    'UNPAID': 'open',
    'PARTIALLY_PAID': 'partial',
    'PAID': 'paid',
    'CANCELLED': 'cancelled',
    'PENDING_APPROVAL': 'draft'
  };
  
  return statusMap[oracleStatus] || 'unknown';
}

/**
 * Map Bruno AI invoice status to Oracle status
 * @param {string} brunoStatus - Bruno AI invoice status
 * @returns {string} - Oracle invoice status
 */
function mapInvoiceStatusToOracle(brunoStatus) {
  const statusMap = {
    'draft': 'PENDING_APPROVAL',
    'open': 'APPROVED',
    'partial': 'PARTIALLY_PAID',
    'paid': 'PAID',
    'cancelled': 'CANCELLED'
  };
  
  return statusMap[brunoStatus] || 'APPROVED';
}

module.exports = {
  customers,
  invoices
  // Additional entity transformers can be added here
};
