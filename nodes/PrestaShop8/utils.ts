import * as xml2js from 'xml2js';
import * as js2xmlparser from 'js2xmlparser';

/**
 * Simplifie la réponse XML/JSON de PrestaShop en JSON simplifié
 */
export function simplifyPrestashopResponse(rawData: any, resource: string): any {
  if (!rawData || typeof rawData !== 'object') {
    return rawData;
  }

  // Si c'est déjà simplifié, retourner tel quel
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

  // Si c'est un tableau, traiter chaque élément
  if (Array.isArray(data)) {
    return data.map(item => simplifyItem(item, resource));
  }

  // Si c'est un objet unique
  return simplifyItem(data, resource);
}

/**
 * Simplifie un élément individuel
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
    // Cas d'une association avec un seul élément
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
    .replace(/^id_/, '') // Supprimer le préfixe id_
    .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase()); // Convertir en camelCase
}

/**
 * Convertit les valeurs string en types appropriés
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

  // Convertir les booléens
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
 * Construit du XML PrestaShop à partir de JSON simplifié
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
 * Convertit JSON simplifié vers le format PrestaShop
 */
function convertSimplifiedToPrestaShop(data: any, resource: string): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const converted: any = {};
  const associations: any = {};

  for (const [key, value] of Object.entries(data)) {
    const prestashopKey = convertFromCamelCase(key);

    // Détecter les associations (tableaux d'IDs)
    if (Array.isArray(value) && value.every(v => typeof v === 'number' || typeof v === 'string')) {
      associations[prestashopKey] = {
        [prestashopKey.slice(0, -1)]: value.map(id => ({ id: String(id) }))
      };
    } else {
      converted[prestashopKey] = String(value);
    }
  }

  // Ajouter les associations si présentes
  if (Object.keys(associations).length > 0) {
    converted.associations = associations;
  }

  return converted;
}

/**
 * Convertit camelCase vers snake_case avec préfixes PrestaShop
 */
function convertFromCamelCase(fieldName: string): string {
  // Mapper certains champs spéciaux
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

  // Conversion générique camelCase vers snake_case
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
 * Construit l'URL avec les paramètres de filtre
 */
export function buildUrlWithFilters(baseUrl: string, options: any): string {
  const url = new URL(baseUrl);
  const params = new URLSearchParams();

  // Ajouter les filtres
  if (options.filters && Array.isArray(options.filters)) {
    for (const filter of options.filters) {
      if (filter.field && filter.value) {
        const filterKey = `filter[${filter.field}]`;
        let filterValue = filter.value;
        
        // Appliquer l'opérateur si ce n'est pas '='
        if (filter.operator && filter.operator !== '=') {
          filterValue = `[${filter.operator}]${filterValue}`;
        }
        
        params.append(filterKey, filterValue);
      }
    }
  }

  // Ajouter les autres paramètres
  if (options.limit) params.append('limit', options.limit);
  if (options.sort) params.append('sort', options.sort);
  if (options.display) params.append('display', options.display);

  // Toujours demander du JSON
  params.append('output_format', 'JSON');

  const paramString = params.toString();
  if (paramString) {
    url.search = paramString;
  }

  return url.toString();
}

/**
 * Valide les données avant envoi
 */
export function validateDataForResource(resource: string, data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Les données doivent être un objet valide');
    return { isValid: false, errors };
  }

  // Validations spécifiques par ressource
  switch (resource) {
    case 'customers':
      if (!data.email && !data.id) {
        errors.push('Un email est requis pour créer un client');
      }
      break;
    
    case 'products':
      if (!data.name && !data.id) {
        errors.push('Un nom est requis pour créer un produit');
      }
      break;
    
    case 'orders':
      if (!data.customerId && !data.id) {
        errors.push('Un ID client est requis pour créer une commande');
      }
      break;
  }

  return { isValid: errors.length === 0, errors };
}
