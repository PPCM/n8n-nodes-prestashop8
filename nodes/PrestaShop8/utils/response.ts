import { convertFromCamelCase } from '../fieldMappings';

/**
 * Normalize sort parameter to include _DESC by default
 */
export function processSortParameter(sortValue: string): string {
	if (!sortValue || !sortValue.trim()) {
		return '';
	}

	const sort = sortValue.trim();

	if (sort.includes('_ASC') || sort.includes('_DESC')) {
		return sort;
	} else {
		return `${sort}_ASC`;
	}
}

/**
 * Convert display parameter to PrestaShop-compatible format
 * Returns null for minimal (no display parameter = IDs only)
 */
export function processDisplayParameter(displayValue: string, resource: string, customFields?: string): string | null {
	if (displayValue === 'minimal') {
		return null;
	} else if (displayValue === 'custom' && customFields) {
		const fields = customFields.trim();
		if (fields.startsWith('[') && fields.endsWith(']')) {
			return fields;
		} else {
			const fieldList = fields.split(',').map(f => f.trim()).filter(f => f).join(',');
			return `[${fieldList}]`;
		}
	} else if (displayValue === 'full') {
		return 'full';
	}
	return displayValue || 'full';
}

/**
 * Process PrestaShop response for direct resource access
 */
export function processResponseForMode(rawData: any, resource: string): any {
	const simplified = simplifyPrestashopResponse(rawData, resource);

	if (Array.isArray(simplified)) {
		return simplified;
	}

	if (simplified && typeof simplified === 'object') {
		const keys = Object.keys(simplified);

		// Check for common PrestaShop response patterns
		const resourceKey = keys.find(key =>
			key === resource || key === resource + 's' ||
			(Array.isArray(simplified[key]) && simplified[key].length > 0)
		);

		if (resourceKey && Array.isArray(simplified[resourceKey])) {
			return simplified[resourceKey];
		}

		// For single item responses (get by ID), unwrap the resource level
		const singleResourceKey = keys.find(key =>
			(key === resource || key === resource.replace(/s$/, '')) &&
			typeof simplified[key] === 'object' &&
			!Array.isArray(simplified[key])
		);

		if (singleResourceKey && simplified[singleResourceKey]) {
			return simplified[singleResourceKey];
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

	if (!rawData.prestashop) {
		return rawData;
	}

	let data = rawData.prestashop;

	if (data[resource]) {
		data = data[resource];
	} else if (data[resource + 's']) {
		data = data[resource + 's'];
	}

	if (Array.isArray(data)) {
		return data.map(item => simplifyItem(item, resource));
	}

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
 * Simplifies a PrestaShop association
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
 * Converts PrestaShop field names to camelCase
 */
function convertFieldName(fieldName: string): string {
	return fieldName
		.replace(/^id_/, '')
		.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Converts string values to appropriate types
 */
function convertValue(value: any): any {
	if (typeof value !== 'string') {
		return value;
	}

	if (/^\d+$/.test(value)) {
		return parseInt(value, 10);
	}

	if (/^\d+\.\d+$/.test(value)) {
		return parseFloat(value);
	}

	if (value === 'true' || value === '1') {
		return true;
	}
	if (value === 'false' || value === '0') {
		return false;
	}

	return value;
}

/**
 * Builds PrestaShop XML from simplified JSON
 */
export function buildPrestashopXml(resource: string, data: any): string {
	const js2xmlparser = require('js2xmlparser');
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

		if (Array.isArray(value) && value.every(v => typeof v === 'number' || typeof v === 'string')) {
			associations[prestashopKey] = {
				[prestashopKey.slice(0, -1)]: value.map(id => ({ id: String(id) })),
			};
		} else {
			converted[prestashopKey] = String(value);
		}
	}

	if (Object.keys(associations).length > 0) {
		converted.associations = associations;
	}

	return converted;
}

/**
 * Gets all string fields for CDATA
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
