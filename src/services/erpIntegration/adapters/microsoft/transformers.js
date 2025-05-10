/**
 * Microsoft Dynamics Transformers
 * Transform data between Microsoft Dynamics and Bruno AI formats
 */

/**
 * Customer transformers
 */
const customers = {
  /**
   * Transform Microsoft Dynamics customer data to Bruno AI format
   * @param {Object} dynamicsCustomer - Microsoft Dynamics customer data
   * @returns {Object} - Bruno AI customer data
   */
  import: (dynamicsCustomer) => {
    return {
      id: dynamicsCustomer.CustomerAccount,
      type: 'customer',
      name: dynamicsCustomer.Name || dynamicsCustomer.OrganizationName,
      code: dynamicsCustomer.CustomerGroupId,
      status: dynamicsCustomer.Blocked ? 'inactive' : 'active',
      createdAt: new Date(dynamicsCustomer.CreatedDateTime).toISOString(),
      modifiedAt: new Date(dynamicsCustomer.ModifiedDateTime).toISOString(),
      contactInfo: {
        email: dynamicsCustomer.PrimaryContactEmail,
        phone: dynamicsCustomer.Phone,
        fax: dynamicsCustomer.Telefax,
        website: dynamicsCustomer.URL
      },
      address: {
        street: dynamicsCustomer.AddressStreet,
        city: dynamicsCustomer.AddressCity,
        postalCode: dynamicsCustomer.AddressZipCode,
        country: dynamicsCustomer.AddressCountryRegionId,
        state: dynamicsCustomer.AddressStateId
      },
      taxInfo: {
        taxId: dynamicsCustomer.TaxGroup,
        vatNumber: dynamicsCustomer.VATNum
      },
      financialInfo: {
        accountGroup: dynamicsCustomer.CustomerGroupId,
        paymentTerms: dynamicsCustomer.PaymentTermId,
        currency: dynamicsCustomer.CurrencyCode,
        creditLimit: parseFloat(dynamicsCustomer.CreditLimit || 0)
      },
      metadata: {
        source: 'microsoft',
        originalId: dynamicsCustomer.RecId,
        dynamicsFields: {
          customerType: dynamicsCustomer.CustomerType,
          salesDistrict: dynamicsCustomer.SalesDistrictId,
          paymentMethod: dynamicsCustomer.PaymentMethodId,
          deliveryTerms: dynamicsCustomer.DlvTermId,
          deliveryMode: dynamicsCustomer.DlvModeId
        }
      }
    };
  },
  
  /**
   * Transform Bruno AI customer data to Microsoft Dynamics format
   * @param {Object} brunoCustomer - Bruno AI customer data
   * @returns {Object} - Microsoft Dynamics customer data
   */
  export: (brunoCustomer) => {
    return {
      CustomerAccount: brunoCustomer.id,
      Name: brunoCustomer.name,
      CustomerGroupId: brunoCustomer.code || brunoCustomer.financialInfo?.accountGroup || '',
      Blocked: brunoCustomer.status === 'inactive',
      
      // Contact info
      PrimaryContactEmail: brunoCustomer.contactInfo?.email || '',
      Phone: brunoCustomer.contactInfo?.phone || '',
      Telefax: brunoCustomer.contactInfo?.fax || '',
      URL: brunoCustomer.contactInfo?.website || '',
      
      // Address
      AddressStreet: brunoCustomer.address?.street || '',
      AddressCity: brunoCustomer.address?.city || '',
      AddressZipCode: brunoCustomer.address?.postalCode || '',
      AddressCountryRegionId: brunoCustomer.address?.country || '',
      AddressStateId: brunoCustomer.address?.state || '',
      
      // Tax information
      TaxGroup: brunoCustomer.taxInfo?.taxId || '',
      VATNum: brunoCustomer.taxInfo?.vatNumber || '',
      
      // Financial information
      PaymentTermId: brunoCustomer.financialInfo?.paymentTerms || '',
      CurrencyCode: brunoCustomer.financialInfo?.currency || '',
      CreditLimit: brunoCustomer.financialInfo?.creditLimit?.toString() || '0',
      
      // Dynamics-specific fields
      CustomerType: brunoCustomer.metadata?.dynamicsFields?.customerType || 'Company',
      SalesDistrictId: brunoCustomer.metadata?.dynamicsFields?.salesDistrict || '',
      PaymentMethodId: brunoCustomer.metadata?.dynamicsFields?.paymentMethod || '',
      DlvTermId: brunoCustomer.metadata?.dynamicsFields?.deliveryTerms || '',
      DlvModeId: brunoCustomer.metadata?.dynamicsFields?.deliveryMode || ''
    };
  }
};

/**
 * Invoice transformers
 */
const invoices = {
  /**
   * Transform Microsoft Dynamics invoice data to Bruno AI format
   * @param {Object} dynamicsInvoice - Microsoft Dynamics invoice data
   * @returns {Object} - Bruno AI invoice data
   */
  import: (dynamicsInvoice) => {
    // Extract invoice lines
    const items = dynamicsInvoice.InvoiceLines?.map(line => ({
      id: line.LineNum.toString(),
      description: line.ItemName,
      quantity: parseFloat(line.SalesQty),
      unit: line.SalesUnit,
      unitPrice: parseFloat(line.SalesPrice),
      netAmount: parseFloat(line.LineAmount),
      taxAmount: parseFloat(line.SalesTaxAmount),
      totalAmount: parseFloat(line.LineAmount) + parseFloat(line.SalesTaxAmount),
      taxRate: parseFloat(line.TaxRatePercent),
      product: {
        id: line.ItemId,
        name: line.ItemName
      }
    })) || [];
    
    return {
      id: dynamicsInvoice.InvoiceNumber,
      type: 'invoice',
      number: dynamicsInvoice.InvoiceNumber,
      date: new Date(dynamicsInvoice.InvoiceDate).toISOString(),
      dueDate: new Date(dynamicsInvoice.DueDate).toISOString(),
      status: mapInvoiceStatus(dynamicsInvoice.DocumentStatus),
      customer: {
        id: dynamicsInvoice.CustomerAccount,
        name: dynamicsInvoice.CustomerName
      },
      currency: dynamicsInvoice.CurrencyCode,
      totalNet: parseFloat(dynamicsInvoice.InvoiceAmount),
      totalTax: parseFloat(dynamicsInvoice.SalesTaxAmount),
      totalGross: parseFloat(dynamicsInvoice.InvoiceAmount) + parseFloat(dynamicsInvoice.SalesTaxAmount),
      paymentTerms: dynamicsInvoice.PaymentTerms,
      paymentMethod: dynamicsInvoice.PaymentMethod,
      reference: dynamicsInvoice.CustomerRef,
      items,
      metadata: {
        source: 'microsoft',
        originalId: dynamicsInvoice.RecId,
        dynamicsFields: {
          salesId: dynamicsInvoice.SalesId,
          salesResponsible: dynamicsInvoice.SalesResponsible,
          dimension1: dynamicsInvoice.DefaultDimension1,
          dimension2: dynamicsInvoice.DefaultDimension2,
          invoiceType: dynamicsInvoice.InvoiceType
        }
      }
    };
  },
  
  /**
   * Transform Bruno AI invoice data to Microsoft Dynamics format
   * @param {Object} brunoInvoice - Bruno AI invoice data
   * @returns {Object} - Microsoft Dynamics invoice data
   */
  export: (brunoInvoice) => {
    // Create Dynamics invoice lines
    const invoiceLines = brunoInvoice.items?.map((item, index) => ({
      LineNum: parseInt(item.id) || index + 1,
      ItemId: item.product?.id || '',
      ItemName: item.description || item.product?.name || '',
      SalesQty: item.quantity.toString(),
      SalesUnit: item.unit || 'ea',
      SalesPrice: item.unitPrice.toString(),
      LineAmount: item.netAmount.toString(),
      SalesTaxAmount: item.taxAmount.toString(),
      TaxRatePercent: item.taxRate.toString()
    })) || [];
    
    return {
      InvoiceNumber: brunoInvoice.number,
      InvoiceDate: new Date(brunoInvoice.date).toISOString().split('T')[0],
      DueDate: new Date(brunoInvoice.dueDate).toISOString().split('T')[0],
      DocumentStatus: mapInvoiceStatusToDynamics(brunoInvoice.status),
      CustomerAccount: brunoInvoice.customer?.id || '',
      CustomerName: brunoInvoice.customer?.name || '',
      CurrencyCode: brunoInvoice.currency || 'USD',
      InvoiceAmount: brunoInvoice.totalNet.toString(),
      SalesTaxAmount: brunoInvoice.totalTax.toString(),
      PaymentTerms: brunoInvoice.paymentTerms || '',
      PaymentMethod: brunoInvoice.paymentMethod || '',
      CustomerRef: brunoInvoice.reference || '',
      
      // Dynamics-specific fields
      SalesId: brunoInvoice.metadata?.dynamicsFields?.salesId || '',
      SalesResponsible: brunoInvoice.metadata?.dynamicsFields?.salesResponsible || '',
      DefaultDimension1: brunoInvoice.metadata?.dynamicsFields?.dimension1 || '',
      DefaultDimension2: brunoInvoice.metadata?.dynamicsFields?.dimension2 || '',
      InvoiceType: brunoInvoice.metadata?.dynamicsFields?.invoiceType || 'Customer',
      
      // Invoice lines
      InvoiceLines: invoiceLines
    };
  }
};

/**
 * Map Microsoft Dynamics invoice status to Bruno AI status
 * @param {string} dynamicsStatus - Microsoft Dynamics invoice status
 * @returns {string} - Bruno AI invoice status
 */
function mapInvoiceStatus(dynamicsStatus) {
  const statusMap = {
    'None': 'draft',
    'Open': 'open',
    'Invoiced': 'open',
    'Paid': 'paid',
    'Settled': 'paid',
    'Canceled': 'cancelled'
  };
  
  return statusMap[dynamicsStatus] || 'unknown';
}

/**
 * Map Bruno AI invoice status to Microsoft Dynamics status
 * @param {string} brunoStatus - Bruno AI invoice status
 * @returns {string} - Microsoft Dynamics invoice status
 */
function mapInvoiceStatusToDynamics(brunoStatus) {
  const statusMap = {
    'draft': 'None',
    'open': 'Open',
    'partial': 'Invoiced',
    'paid': 'Paid',
    'cancelled': 'Canceled'
  };
  
  return statusMap[brunoStatus] || 'Open';
}

module.exports = {
  customers,
  invoices
  // Additional entity transformers can be added here
};
