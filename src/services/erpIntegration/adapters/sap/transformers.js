/**
 * SAP Transformers
 * Transform data between SAP and Bruno AI formats
 */

/**
 * Customer transformers
 */
const customers = {
  /**
   * Transform SAP customer data to Bruno AI format
   * @param {Object} sapCustomer - SAP customer data
   * @returns {Object} - Bruno AI customer data
   */
  import: (sapCustomer) => {
    return {
      id: sapCustomer.BusinessPartner,
      type: 'customer',
      name: sapCustomer.OrganizationBPName1 || sapCustomer.PersonFullName,
      code: sapCustomer.BusinessPartnerGrouping,
      status: sapCustomer.BusinessPartnerIsBlocked ? 'inactive' : 'active',
      createdAt: new Date(sapCustomer.CreationDate).toISOString(),
      modifiedAt: new Date(sapCustomer.LastChangeDate).toISOString(),
      contactInfo: {
        email: sapCustomer.EmailAddress,
        phone: sapCustomer.PhoneNumber,
        fax: sapCustomer.FaxNumber,
        website: sapCustomer.WebsiteURL
      },
      address: {
        street: sapCustomer.StreetName,
        houseNumber: sapCustomer.HouseNumber,
        city: sapCustomer.CityName,
        postalCode: sapCustomer.PostalCode,
        country: sapCustomer.CountryCode,
        region: sapCustomer.Region
      },
      taxInfo: {
        taxId: sapCustomer.TaxNumber1,
        vatId: sapCustomer.TaxNumber2
      },
      financialInfo: {
        accountGroup: sapCustomer.CustomerAccountGroup,
        paymentTerms: sapCustomer.PaymentTerms,
        currency: sapCustomer.Currency
      },
      metadata: {
        source: 'sap',
        originalId: sapCustomer.BusinessPartner,
        sapFields: {
          customerGroup: sapCustomer.CustomerGroup,
          salesOrg: sapCustomer.SalesOrganization,
          distributionChannel: sapCustomer.DistributionChannel,
          division: sapCustomer.Division,
          industry: sapCustomer.Industry
        }
      }
    };
  },
  
  /**
   * Transform Bruno AI customer data to SAP format
   * @param {Object} brunoCustomer - Bruno AI customer data
   * @returns {Object} - SAP customer data
   */
  export: (brunoCustomer) => {
    const isOrganization = !brunoCustomer.firstName && !brunoCustomer.lastName;
    
    return {
      BusinessPartner: brunoCustomer.id,
      BusinessPartnerType: isOrganization ? '2' : '1', // 1 = Person, 2 = Organization
      OrganizationBPName1: isOrganization ? brunoCustomer.name : '',
      PersonFullName: !isOrganization ? brunoCustomer.name : '',
      FirstName: brunoCustomer.firstName || '',
      LastName: brunoCustomer.lastName || '',
      BusinessPartnerGrouping: brunoCustomer.code || '',
      BusinessPartnerIsBlocked: brunoCustomer.status === 'inactive',
      
      // Contact info
      EmailAddress: brunoCustomer.contactInfo?.email || '',
      PhoneNumber: brunoCustomer.contactInfo?.phone || '',
      FaxNumber: brunoCustomer.contactInfo?.fax || '',
      WebsiteURL: brunoCustomer.contactInfo?.website || '',
      
      // Address
      StreetName: brunoCustomer.address?.street || '',
      HouseNumber: brunoCustomer.address?.houseNumber || '',
      CityName: brunoCustomer.address?.city || '',
      PostalCode: brunoCustomer.address?.postalCode || '',
      CountryCode: brunoCustomer.address?.country || '',
      Region: brunoCustomer.address?.region || '',
      
      // Tax information
      TaxNumber1: brunoCustomer.taxInfo?.taxId || '',
      TaxNumber2: brunoCustomer.taxInfo?.vatId || '',
      
      // Financial information
      CustomerAccountGroup: brunoCustomer.financialInfo?.accountGroup || '',
      PaymentTerms: brunoCustomer.financialInfo?.paymentTerms || '',
      Currency: brunoCustomer.financialInfo?.currency || '',
      
      // SAP-specific fields
      CustomerGroup: brunoCustomer.metadata?.sapFields?.customerGroup || '',
      SalesOrganization: brunoCustomer.metadata?.sapFields?.salesOrg || '',
      DistributionChannel: brunoCustomer.metadata?.sapFields?.distributionChannel || '',
      Division: brunoCustomer.metadata?.sapFields?.division || '',
      Industry: brunoCustomer.metadata?.sapFields?.industry || ''
    };
  }
};

/**
 * Invoice transformers
 */
const invoices = {
  /**
   * Transform SAP invoice data to Bruno AI format
   * @param {Object} sapInvoice - SAP invoice data
   * @returns {Object} - Bruno AI invoice data
   */
  import: (sapInvoice) => {
    // Extract invoice items
    const items = sapInvoice.to_Item?.results?.map(item => ({
      id: item.BillingDocumentItem,
      description: item.BillingDocumentItemText,
      quantity: parseFloat(item.BillingQuantity),
      unit: item.BillingQuantityUnit,
      unitPrice: parseFloat(item.NetAmount) / parseFloat(item.BillingQuantity),
      netAmount: parseFloat(item.NetAmount),
      taxAmount: parseFloat(item.TaxAmount),
      totalAmount: parseFloat(item.NetAmount) + parseFloat(item.TaxAmount),
      taxRate: parseFloat(item.TaxRate),
      product: {
        id: item.Material,
        code: item.MaterialGroup
      }
    })) || [];
    
    return {
      id: sapInvoice.BillingDocument,
      type: 'invoice',
      number: sapInvoice.BillingDocumentNumber,
      date: new Date(sapInvoice.BillingDocumentDate).toISOString(),
      dueDate: new Date(sapInvoice.BillingDocumentDueDate).toISOString(),
      status: mapInvoiceStatus(sapInvoice.DocumentReferenceStatus),
      customer: {
        id: sapInvoice.SoldToParty,
        name: sapInvoice.SoldToPartyName
      },
      currency: sapInvoice.TransactionCurrency,
      totalNet: parseFloat(sapInvoice.TotalNetAmount),
      totalTax: parseFloat(sapInvoice.TotalTaxAmount),
      totalGross: parseFloat(sapInvoice.TotalGrossAmount),
      paymentTerms: sapInvoice.PaymentTerms,
      paymentMethod: sapInvoice.PaymentMethod,
      reference: sapInvoice.ReferenceDocument,
      items,
      metadata: {
        source: 'sap',
        originalId: sapInvoice.BillingDocument,
        sapFields: {
          billingDocumentCategory: sapInvoice.BillingDocumentCategory,
          billingDocumentType: sapInvoice.BillingDocumentType,
          salesOrganization: sapInvoice.SalesOrganization,
          distributionChannel: sapInvoice.DistributionChannel,
          division: sapInvoice.Division
        }
      }
    };
  },
  
  /**
   * Transform Bruno AI invoice data to SAP format
   * @param {Object} brunoInvoice - Bruno AI invoice data
   * @returns {Object} - SAP invoice data
   */
  export: (brunoInvoice) => {
    // Create SAP invoice items
    const items = brunoInvoice.items?.map((item, index) => ({
      BillingDocumentItem: item.id || (index + 10).toString().padStart(6, '0'),
      BillingDocumentItemText: item.description || '',
      BillingQuantity: item.quantity.toString(),
      BillingQuantityUnit: item.unit || 'EA',
      NetAmount: item.netAmount.toString(),
      TaxAmount: item.taxAmount.toString(),
      TaxRate: item.taxRate.toString(),
      Material: item.product?.id || '',
      MaterialGroup: item.product?.code || ''
    })) || [];
    
    return {
      BillingDocument: brunoInvoice.id || '',
      BillingDocumentNumber: brunoInvoice.number || '',
      BillingDocumentDate: new Date(brunoInvoice.date),
      BillingDocumentDueDate: new Date(brunoInvoice.dueDate),
      DocumentReferenceStatus: mapInvoiceStatusToSAP(brunoInvoice.status),
      SoldToParty: brunoInvoice.customer?.id || '',
      SoldToPartyName: brunoInvoice.customer?.name || '',
      TransactionCurrency: brunoInvoice.currency || 'EUR',
      TotalNetAmount: brunoInvoice.totalNet.toString(),
      TotalTaxAmount: brunoInvoice.totalTax.toString(),
      TotalGrossAmount: brunoInvoice.totalGross.toString(),
      PaymentTerms: brunoInvoice.paymentTerms || '',
      PaymentMethod: brunoInvoice.paymentMethod || '',
      ReferenceDocument: brunoInvoice.reference || '',
      
      // SAP-specific fields
      BillingDocumentCategory: brunoInvoice.metadata?.sapFields?.billingDocumentCategory || 'F', // F = Invoice
      BillingDocumentType: brunoInvoice.metadata?.sapFields?.billingDocumentType || 'F2', // F2 = Invoice
      SalesOrganization: brunoInvoice.metadata?.sapFields?.salesOrganization || '',
      DistributionChannel: brunoInvoice.metadata?.sapFields?.distributionChannel || '',
      Division: brunoInvoice.metadata?.sapFields?.division || '',
      
      // Invoice items
      to_Item: {
        results: items
      }
    };
  }
};

/**
 * Map SAP invoice status to Bruno AI status
 * @param {string} sapStatus - SAP invoice status
 * @returns {string} - Bruno AI invoice status
 */
function mapInvoiceStatus(sapStatus) {
  const statusMap = {
    'A': 'draft',
    'B': 'open',
    'C': 'paid',
    'D': 'cancelled'
  };
  
  return statusMap[sapStatus] || 'unknown';
}

/**
 * Map Bruno AI invoice status to SAP status
 * @param {string} brunoStatus - Bruno AI invoice status
 * @returns {string} - SAP invoice status
 */
function mapInvoiceStatusToSAP(brunoStatus) {
  const statusMap = {
    'draft': 'A',
    'open': 'B',
    'paid': 'C',
    'cancelled': 'D'
  };
  
  return statusMap[brunoStatus] || 'B';
}

module.exports = {
  customers,
  invoices
  // Additional entity transformers can be added here
};
