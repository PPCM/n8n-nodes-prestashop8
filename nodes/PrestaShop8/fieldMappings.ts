/**
 * Centralized field mappings for PrestaShop resources
 * Eliminates duplication between node and utils files
 */

export interface FieldMapping {
  [inputName: string]: string;
}

export interface ResourceFieldMappings {
  [resource: string]: FieldMapping;
}

/**
 * Input field name to PrestaShop field name mappings for CREATE operations
 */
export const CREATE_FIELD_MAPPINGS: ResourceFieldMappings = {
  products: {
    productName: 'name-1',
    productPrice: 'price',
    productCategoryId: 'id_category_default'
  },
  categories: {
    categoryName: 'name-1',
    categoryParentId: 'id_parent'
  },
  customers: {
    customerFirstname: 'firstname',
    customerLastname: 'lastname',
    customerEmail: 'email'
  },
  addresses: {
    addressFirstname: 'firstname',
    addressLastname: 'lastname',
    addressAddress1: 'address1',
    addressCity: 'city',
    addressCountryId: 'id_country',
    addressCustomerId: 'id_customer'
  },
  manufacturers: {
    manufacturerName: 'name',
    manufacturerActive: 'active'
  },
  stock_availables: {
    stockProductId: 'id_product',
    stockProductAttributeId: 'id_product_attribute',
    stockQuantity: 'quantity',
    stockDependsOnStock: 'depends_on_stock',
    stockOutOfStock: 'out_of_stock'
  }
};

/**
 * CamelCase to PrestaShop field name mappings for UPDATE operations
 */
export const CAMELCASE_TO_PRESTASHOP_MAPPINGS: { [key: string]: string } = {
  'manufacturerId': 'id_manufacturer',
  'categoryId': 'id_category',
  'supplierId': 'id_supplier',
  'customerId': 'id_customer',
  'addressId': 'id_address',
  'countryId': 'id_country',
  'stateId': 'id_state',
  'zoneId': 'id_zone',
  'currencyId': 'id_currency',
  'languageId': 'id_language',
  'groupId': 'id_group',
};

/**
 * Convert camelCase field name to PrestaShop format
 */
export function convertFromCamelCase(fieldName: string): string {
  // Check specific mappings first
  if (CAMELCASE_TO_PRESTASHOP_MAPPINGS[fieldName]) {
    return CAMELCASE_TO_PRESTASHOP_MAPPINGS[fieldName];
  }

  // Generic camelCase to snake_case conversion
  return fieldName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, ''); // Remove leading underscore
}

/**
 * Get field mappings for a specific resource
 */
export function getFieldMappingsForResource(resource: string): FieldMapping | null {
  return CREATE_FIELD_MAPPINGS[resource] || null;
}
