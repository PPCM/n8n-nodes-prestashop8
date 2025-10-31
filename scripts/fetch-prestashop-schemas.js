#!/usr/bin/env node

/**
 * Script to fetch PrestaShop API schemas and generate TypeScript definitions
 * Usage: node scripts/fetch-prestashop-schemas.js <API_URL> <API_KEY>
 * Example: node scripts/fetch-prestashop-schemas.js https://example.com/api YOUR_API_KEY
 */

const https = require('https');
const http = require('http');
const { parseStringPromise } = require('xml2js');
const fs = require('fs').promises;
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const apiUrl = args[0] || process.env.PRESTASHOP_API_URL;
const apiKey = args[1] || process.env.PRESTASHOP_API_KEY;

if (!apiUrl || !apiKey) {
  console.error('❌ Usage: node fetch-prestashop-schemas.js <API_URL> <API_KEY>');
  console.error('   Or set PRESTASHOP_API_URL and PRESTASHOP_API_KEY environment variables');
  process.exit(1);
}

console.log('🚀 PrestaShop Schema Fetcher');
console.log('📡 API URL:', apiUrl);

// Check if API key is already Base64 encoded
let processedApiKey = apiKey;
let isAlreadyEncoded = false;

try {
  // Try to decode the key to check if it's already Base64
  const decoded = Buffer.from(apiKey, 'base64').toString('utf-8');
  
  // If decoded string contains ':' and looks like "KEY:PASSWORD", it's already encoded
  if (decoded.includes(':') && decoded.length > 10 && /^[a-zA-Z0-9:]+/.test(decoded)) {
    isAlreadyEncoded = true;
    console.log('✓ Clé API détectée comme déjà encodée en Base64');
  }
} catch (e) {
  // Not Base64, use as-is
}

if (!isAlreadyEncoded) {
  console.log('✓ Clé API en clair, sera encodée automatiquement');
}

console.log('');

// List of resources to fetch (from types.ts)
const RESOURCES = [
  'products', 'categories', 'customers', 'addresses', 'countries', 'states',
  'zones', 'taxes', 'tax_rules', 'tax_rule_groups', 'carriers', 'suppliers',
  'manufacturers', 'orders', 'order_details', 'order_histories', 'order_states',
  'order_invoices', 'order_carriers', 'carts', 'cart_rules', 'currencies',
  'languages', 'groups', 'stock_availables', 'stocks', 'stock_movements',
  'combinations', 'images', 'tags', 'specific_prices', 'product_options',
  'customer_threads', 'customer_messages', 'product_features', 'product_feature_values',
  'shops'
];

/**
 * Fetch schema for a specific resource
 */
async function fetchSchema(resource) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${apiUrl}/${resource}`);
    url.searchParams.append('schema', 'synopsis');
    // N'ajoute PAS output_format=JSON, on veut le XML!

    // Use key as-is if already encoded, otherwise encode it
    const auth = isAlreadyEncoded ? apiKey : Buffer.from(`${apiKey}:`).toString('base64');
    const protocol = url.protocol === 'https:' ? https : http;

    const options = {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/xml'  // Demander XML
      }
    };

    // Debug: log first request details
    if (resource === 'products') {
      console.log('🔍 Debug première requête:');
      console.log('   URL complète:', url.toString());
      console.log('   Auth type:', isAlreadyEncoded ? 'Déjà encodée' : 'Encodée automatiquement');
      console.log('   Format: XML (schema synopsis)');
      console.log('');
    }

    const req = protocol.get(url.toString(), options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', async () => {
        if (res.statusCode === 200) {
          try {
            // Parser le XML
            const parsed = await parseStringPromise(data, { 
              explicitArray: false,
              mergeAttrs: true 
            });
            
            // Debug: log first response structure
            if (resource === 'products') {
              console.log('📦 XML parsé avec succès');
              console.log('📦 Clés racine:', Object.keys(parsed).join(', '));
              if (parsed.prestashop) {
                console.log('📦 Ressources:', Object.keys(parsed.prestashop).join(', '));
              }
              console.log('');
            }
            
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Failed to parse XML for ${resource}: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode} for ${resource}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Parse PrestaShop format to JavaScript type
 */
function parseFormat(format) {
  const formatMap = {
    'isUnsignedId': 'number',
    'isNullOrUnsignedId': 'number',
    'isInt': 'number',
    'isUnsignedInt': 'number',
    'isPositiveInt': 'number',
    'isFloat': 'number',
    'isUnsignedFloat': 'number',
    'isPrice': 'number',
    'isBool': 'boolean',
    'isString': 'string',
    'isGenericName': 'string',
    'isReference': 'string',
    'isName': 'string',
    'isEmail': 'string',
    'isUrl': 'string',
    'isPhoneNumber': 'string',
    'isDate': 'string',
    'isDateFormat': 'string',
    'isDateOrNull': 'string',
    'isCleanHtml': 'string',
    'isMessage': 'string',
    'isAddress': 'string',
    'isCatalogName': 'string',
    'isPasswd': 'string',
    'isColor': 'string',
    'isLanguageCode': 'string',
    'isLanguageIsoCode': 'string',
  };

  return formatMap[format] || 'string';
}

/**
 * Convert plural resource name to singular
 */
function toSingular(plural) {
  // Special cases - PrestaShop uses specific XML tag names
  const specialCases = {
    'order_histories': 'order_history',
    'stock_movements': 'stock_mvt',  // PrestaShop uses abbreviation
    'categories': 'category',
    'countries': 'country',
    'currencies': 'currency',
    'addresses': 'address',
    'images': 'image_types',  // PrestaShop uses plural form
    'taxes': 'tax',
    'states': 'state',
    'zones': 'zone',
    'customer_threads': 'customer_thread',
    'customer_messages': 'customer_message',
  };
  
  if (specialCases[plural]) {
    return specialCases[plural];
  }
  
  // General rule: remove trailing 's'
  if (plural.endsWith('ies')) {
    return plural.slice(0, -3) + 'y'; // histories -> history
  }
  if (plural.endsWith('sses') || plural.endsWith('xes')) {
    return plural.slice(0, -2); // addresses -> address
  }
  if (plural.endsWith('s')) {
    return plural.slice(0, -1); // products -> product
  }
  
  return plural;
}

/**
 * Extract schema from PrestaShop XML response
 */
function extractSchema(resourceData, resourceName) {
  // XML structure: { prestashop: { product: { id: { format: "isUnsignedId" }, ... } } }
  if (!resourceData || !resourceData.prestashop) {
    return null;
  }

  // Find the resource (try singular form first, then plural)
  const singularName = toSingular(resourceName);
  const resource = resourceData.prestashop[singularName] || resourceData.prestashop[resourceName];
  
  if (!resource) {
    // Debug: show what keys are available
    if (resourceName === 'order_histories') {
      console.log('   Debug: Available keys in prestashop:', Object.keys(resourceData.prestashop).filter(k => k !== 'xmlns:xlink' && k !== '$').join(', '));
      console.log('   Debug: Looking for:', singularName, 'or', resourceName);
    }
    return null;
  }

  const schema = {};

  for (const [fieldName, fieldInfo] of Object.entries(resource)) {
    // Skip associations and other non-field items
    if (fieldName === 'associations' || fieldName === '$' || fieldName === '_') {
      continue;
    }
    
    // Skip xlink attributes (for image_types and similar)
    if (fieldName.startsWith('xlink:') || fieldName === 'xmlns:xlink') {
      continue;
    }
    
    if (typeof fieldInfo === 'object' && fieldInfo !== null) {
      // Check if this is a field definition (has format attribute)
      // or just a nested structure (like image_types)
      if (!fieldInfo.format && !fieldInfo._ && typeof fieldInfo !== 'string') {
        // This is probably a nested structure, not a field - skip it
        continue;
      }
      
      const format = fieldInfo.format || 'isString';
      const type = parseFormat(format);
      
      schema[fieldName] = {
        type,
        format,
        required: fieldInfo.required === '1' || fieldInfo.required === true,
        readOnly: fieldInfo.readonly === '1' || fieldInfo.readonly === true,
        multilang: fieldInfo.i18n === '1' || fieldInfo.i18n === true,
        maxSize: fieldInfo.maxSize ? parseInt(fieldInfo.maxSize) : null,
      };
    }
  }

  return Object.keys(schema).length > 0 ? schema : null;
}

/**
 * Generate TypeScript file
 */
function generateTypeScriptFile(schemas) {
  let output = `/**
 * PrestaShop Resource Schemas
 * Auto-generated from PrestaShop API
 * Generated on: ${new Date().toISOString()}
 * 
 * This file contains type definitions for all PrestaShop resources
 * Used for automatic type conversion and field validation
 */

export interface FieldSchema {
  type: 'string' | 'number' | 'boolean';
  format: string;
  required: boolean;
  readOnly: boolean;
  multilang: boolean;
  maxSize: number | null;
}

export interface ResourceSchema {
  [fieldName: string]: FieldSchema;
}

export const RESOURCE_SCHEMAS: { [resource: string]: ResourceSchema } = {\n`;

  for (const [resource, schema] of Object.entries(schemas)) {
    output += `  '${resource}': {\n`;
    
    for (const [field, info] of Object.entries(schema)) {
      output += `    '${field}': {\n`;
      output += `      type: '${info.type}',\n`;
      output += `      format: '${info.format}',\n`;
      output += `      required: ${info.required},\n`;
      output += `      readOnly: ${info.readOnly},\n`;
      output += `      multilang: ${info.multilang},\n`;
      output += `      maxSize: ${info.maxSize || 'null'},\n`;
      output += `    },\n`;
    }
    
    output += `  },\n`;
  }

  output += `};\n\n`;

  // Add helper functions
  output += `/**
 * Get schema for a specific resource
 */
export function getResourceSchema(resource: string): ResourceSchema | null {
  return RESOURCE_SCHEMAS[resource] || null;
}

/**
 * Get all field names for a resource
 */
export function getResourceFields(resource: string): string[] {
  const schema = getResourceSchema(resource);
  return schema ? Object.keys(schema) : [];
}

/**
 * Get required fields for a resource
 */
export function getRequiredFields(resource: string): string[] {
  const schema = getResourceSchema(resource);
  if (!schema) return [];
  
  return Object.entries(schema)
    .filter(([_, info]) => info.required)
    .map(([field, _]) => field);
}

/**
 * Get writable fields for a resource (not read-only)
 */
export function getWritableFields(resource: string): string[] {
  const schema = getResourceSchema(resource);
  if (!schema) return [];
  
  return Object.entries(schema)
    .filter(([_, info]) => !info.readOnly)
    .map(([field, _]) => field);
}

/**
 * Convert field value to correct type based on schema
 */
export function convertFieldValue(value: any, fieldInfo: FieldSchema): any {
  if (value === null || value === undefined || value === '') {
    return value;
  }

  switch (fieldInfo.type) {
    case 'number':
      const num = Number(value);
      return isNaN(num) ? value : num;
    
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (value === '1' || value === 1) return true;
      if (value === '0' || value === 0) return false;
      return Boolean(value);
    
    case 'string':
    default:
      return String(value);
  }
}

/**
 * Convert numeric fields in associations
 */
function convertAssociationIds(associations: any): any {
  if (!associations || typeof associations !== 'object') {
    return associations;
  }

  const converted: any = {};

  for (const [assocName, assocValue] of Object.entries(associations)) {
    if (Array.isArray(assocValue)) {
      // Convert array of association items
      converted[assocName] = assocValue.map((item: any) => {
        if (item && typeof item === 'object') {
          const convertedItem: any = {};
          // Convert all fields based on naming patterns
          for (const [key, value] of Object.entries(item)) {
            // Convert ID fields (id, id_*, *_id)
            if (key === 'id' || key.startsWith('id_') || key.endsWith('_id')) {
              convertedItem[key] = typeof value === 'string' ? Number(value) : value;
            }
            // Convert quantity fields
            else if (key.includes('quantity')) {
              convertedItem[key] = typeof value === 'string' ? Number(value) : value;
            }
            // Convert price fields (price, unit_price_*, *_price_*)
            else if (key.includes('price')) {
              convertedItem[key] = typeof value === 'string' ? Number(value) : value;
            }
            // Keep other fields as-is
            else {
              convertedItem[key] = value;
            }
          }
          return convertedItem;
        }
        return item;
      });
    } else {
      converted[assocName] = assocValue;
    }
  }

  return converted;
}

/**
 * Convert all fields in an object based on resource schema
 */
export function convertResourceTypes(data: any, resource: string): any {
  const schema = getResourceSchema(resource);
  if (!schema || !data || typeof data !== 'object') {
    return data;
  }

  const converted: any = {};

  for (const [field, value] of Object.entries(data)) {
    if (field === 'associations') {
      // Special handling for associations: convert numeric fields
      converted[field] = convertAssociationIds(value);
    } else if (schema[field]) {
      converted[field] = convertFieldValue(value, schema[field]);
    } else {
      // Keep fields not in schema as-is
      converted[field] = value;
    }
  }

  return converted;
}

/**
 * Convert array of resources
 */
export function convertResourceArray(data: any[], resource: string): any[] {
  if (!Array.isArray(data)) return data;
  return data.map(item => convertResourceTypes(item, resource));
}
`;

  return output;
}

/**
 * Main execution
 */
async function main() {
  const schemas = {};
  let successCount = 0;
  let errorCount = 0;

  console.log('📥 Fetching schemas for all resources...\n');

  for (const resource of RESOURCES) {
    try {
      process.stdout.write(`  ${resource}... `);
      const data = await fetchSchema(resource);
      const schema = extractSchema(data, resource);
      
      if (schema && Object.keys(schema).length > 0) {
        schemas[resource] = schema;
        console.log(`✅ (${Object.keys(schema).length} fields)`);
        successCount++;
      } else {
        console.log('⚠️  No schema found');
        errorCount++;
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`❌ ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} successful, ${errorCount} failed\n`);

  if (Object.keys(schemas).length === 0) {
    console.error('❌ No schemas fetched. Aborting.');
    process.exit(1);
  }

  // Generate TypeScript file
  console.log('📝 Generating TypeScript file...');
  const tsContent = generateTypeScriptFile(schemas);
  
  const outputPath = path.join(__dirname, '..', 'nodes', 'PrestaShop8', 'resourceSchemas.ts');
  await fs.writeFile(outputPath, tsContent, 'utf8');
  
  console.log(`✅ Generated: ${outputPath}`);
  console.log(`📦 Total resources: ${Object.keys(schemas).length}`);
  
  // Calculate total fields
  const totalFields = Object.values(schemas).reduce((sum, schema) => sum + Object.keys(schema).length, 0);
  console.log(`📋 Total fields: ${totalFields}`);
  
  console.log('\n🎉 Schema generation complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Review the generated file: nodes/PrestaShop8/resourceSchemas.ts');
  console.log('   2. Rebuild the project: npm run build');
  console.log('   3. Test type conversion with your workflows');
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
