import * as xml2js from 'xml2js';
import * as js2xmlparser from 'js2xmlparser';

/**
 * Convert display parameter to PrestaShop-compatible format
 * Returns null for minimal (no display parameter = IDs only)
 */
export function processDisplayParameter(displayValue: string, resource: string, customFields?: string): string | null {
  if (displayValue === 'minimal') {
    // No display parameter = PrestaShop returns only IDs (minimal)
    return null;
  } else if (displayValue === 'custom' && customFields) {
    return customFields;
  } else if (displayValue === 'full') {
    return 'full';
  }
  return displayValue || 'full';
}

/**
 * Process PrestaShop response for direct resource access
 */
export function processResponseForMode(rawData: any, resource: string, currentResource: string): any {
  // First simplify with standard function
  const simplified = simplifyPrestashopResponse(rawData, resource);
  
  // If it's already an array, return it directly
  if (Array.isArray(simplified)) {
    return simplified;
  }
  
  // If it's an object and contains the resource array, extract it
  if (simplified && typeof simplified === 'object') {
    // Check for common PrestaShop response patterns
    const resourceKey = Object.keys(simplified).find(key => 
      key === resource || key === resource + 's' || 
      (Array.isArray(simplified[key]) && simplified[key].length > 0)
    );
    
    if (resourceKey && Array.isArray(simplified[resourceKey])) {
      return simplified[resourceKey];
    }
  }
  
  return simplified;
}

/**
 * Simplifies PrestaShop XML/JSON response to simplified JSON
 */
export function simplifyPrestashopResponse(rawData: any, resource: string): any {
  if (!rawData || typeof rawData !== 'object') {
    return rawData;
  }

  // If already simplified, return as is
  if (!rawData.prestashop) {
    return rawData;
  }

  let data = rawData.prestashop;

  // Extraire la ressource principale
  if (data[resource]) {
    data = data[resource];
  } else if (data[resource + 's']) {
    data = data[resource + 's'];
  }

  // If it's an array, process each element
  if (Array.isArray(data)) {
    return data.map(item => simplifyItem(item, resource));
  }

  // Si c'est un objet unique
  return simplifyItem(data, resource);
}

/**
 * Simplifies an individual element
 */
function simplifyItem(item: any, resource: string): any {
  if (!item || typeof item !== 'object') {
    return item;
  }

  const simplified: any = {};

  for (const [key, value] of Object.entries(item)) {
    const simplifiedKey = convertFieldName(key);
    
    if (key === 'associations' && value && typeof value === 'object') {
      // Traiter les associations
      for (const [assocKey, assocValue] of Object.entries(value)) {
        simplified[convertFieldName(assocKey)] = simplifyAssociation(assocValue);
      }
    } else if (Array.isArray(value)) {
      simplified[simplifiedKey] = value.map(v => convertValue(v));
    } else {
      simplified[simplifiedKey] = convertValue(value);
    }
  }

  return simplified;
}

/**
 * Simplifie une association PrestaShop
 */
function simplifyAssociation(assoc: any): any[] {
  if (!assoc) return [];
  
  if (Array.isArray(assoc)) {
    return assoc.map(item => {
      if (item && typeof item === 'object' && item.id) {
        return convertValue(item.id);
      }
      return convertValue(item);
    });
  }

  if (typeof assoc === 'object') {
    // Case of an association with a single element
    const values = Object.values(assoc);
    if (values.length === 1 && Array.isArray(values[0])) {
      return (values[0] as any[]).map(item => {
        if (item && typeof item === 'object' && item.id) {
          return convertValue(item.id);
        }
        return convertValue(item);
      });
    }
  }

  return [];
}

/**
 * Convertit les noms de champs PrestaShop en camelCase
 */
function convertFieldName(fieldName: string): string {
  return fieldName
    .replace(/^id_/, '') // Remove id_ prefix
    .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase()); // Convertir en camelCase
}

/**
 * Converts string values to appropriate types
 */
function convertValue(value: any): any {
  if (typeof value !== 'string') {
    return value;
  }

  // Essayer de convertir en nombre
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  if (/^\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }

  // Convert booleans
  if (value === 'true' || value === '1') {
    return true;
  }
  if (value === 'false' || value === '0') {
    return false;
  }

  // Retourner la valeur string telle quelle
  return value;
}

/**
 * Builds PrestaShop XML from simplified JSON
 */
export function buildPrestashopXml(resource: string, data: any): string {
  const convertedData = convertSimplifiedToPrestaShop(data, resource);
  
  const xmlOptions = {
    declaration: {
      include: false,
    },
    format: {
      doubleQuotes: true,
    },
    cdataKeys: getAllStringFields(convertedData),
  };

  return js2xmlparser.parse('prestashop', { [resource]: convertedData }, xmlOptions);
}

/**
 * Converts simplified JSON to PrestaShop format
 */
function convertSimplifiedToPrestaShop(data: any, resource: string): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const converted: any = {};
  const associations: any = {};

  for (const [key, value] of Object.entries(data)) {
    const prestashopKey = convertFromCamelCase(key);

    // Detect associations (arrays of IDs)
    if (Array.isArray(value) && value.every(v => typeof v === 'number' || typeof v === 'string')) {
      associations[prestashopKey] = {
        [prestashopKey.slice(0, -1)]: value.map(id => ({ id: String(id) }))
      };
    } else {
      converted[prestashopKey] = String(value);
    }
  }

  // Add associations if present
  if (Object.keys(associations).length > 0) {
    converted.associations = associations;
  }

  return converted;
}

/**
 * Converts camelCase to snake_case with PrestaShop prefixes
 */
function convertFromCamelCase(fieldName: string): string {
  // Map certain special fields
  const fieldMappings: { [key: string]: string } = {
    'manufacturerId': 'id_manufacturer',
    'categoryId': 'id_category',
    'supplierId': 'id_supplier',
    'customerId': 'id_customer',
    'orderId': 'id_order',
    'productId': 'id_product',
    'carrierId': 'id_carrier',
    'currencyId': 'id_currency',
    'languageId': 'id_language',
    'shopId': 'id_shop',
    'taxId': 'id_tax',
    'zoneId': 'id_zone',
    'countryId': 'id_country',
    'stateId': 'id_state',
    'addressId': 'id_address',
    'groupId': 'id_group',
  };

  if (fieldMappings[fieldName]) {
    return fieldMappings[fieldName];
  }

  // Generic camelCase to snake_case conversion
  return fieldName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * Obtient tous les champs string pour CDATA
 */
function getAllStringFields(obj: any): string[] {
  const fields: string[] = [];
  
  function traverse(current: any, path: string = '') {
    if (current && typeof current === 'object') {
      for (const [key, value] of Object.entries(current)) {
        const currentPath = path ? `${path}.${key}` : key;
        if (typeof value === 'string') {
          fields.push(currentPath);
        } else if (typeof value === 'object') {
          traverse(value, currentPath);
        }
      }
    }
  }

  traverse(obj);
  return fields;
}

/**
 * Parse XML vers JSON
 */
export async function parseXmlToJson(xml: string): Promise<any> {
  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true,
  });
  
  return parser.parseStringPromise(xml);
}

/**
 * Builds URL with filter parameters
 */
export function buildUrlWithFilters(baseUrl: string, options: any, rawMode?: boolean): string {
  const url = new URL(baseUrl);
  const params = new URLSearchParams();

  // Ajouter les filtres
  if (options.filters && Array.isArray(options.filters)) {
    for (const filter of options.filters) {
      if (filter.field && filter.value) {
        const filterKey = `filter[${filter.field}]`;
        let filterValue = filter.value;
        
        // Apply operator if it's not '='
        if (filter.operator && filter.operator !== '=') {
          filterValue = `[${filter.operator}]${filterValue}`;
        }
        
        params.append(filterKey, filterValue);
      }
    }
  }

  // Add other parameters
  if (options.limit) params.append('limit', options.limit);
  if (options.sort) params.append('sort', options.sort);
  if (options.display !== null && options.display !== undefined) params.append('display', options.display);

  // Ajouter output_format seulement si pas en mode Raw
  if (!rawMode) {
    params.append('output_format', 'JSON');
  }

  const paramString = params.toString();
  if (paramString) {
    url.search = paramString;
  }

  return url.toString();
}

/**
 * Validates data before sending
 */
export function validateDataForResource(resource: string, data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Data must be a valid object');
    return { isValid: false, errors };
  }

  // Resource-specific validations
  switch (resource) {
    case 'customers':
      if (!data.email && !data.id) {
        errors.push('An email is required to create a customer');
      }
      break;
    
    case 'products':
      if (!data.name && !data.id) {
        errors.push('A name is required to create a product');
      }
      break;
    
    case 'orders':
      if (!data.customerId && !data.id) {
        errors.push('A customer ID is required to create an order');
      }
      break;
  }

  return { isValid: errors.length === 0, errors };
}
