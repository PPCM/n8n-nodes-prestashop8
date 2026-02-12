import { processSortParameter } from './response';

/**
 * Required fields for each PrestaShop resource type
 */
export const REQUIRED_FIELDS_BY_RESOURCE: {[key: string]: string[]} = {
	'products': ['name', 'price', 'id_category_default'],
	'categories': ['name', 'id_parent'],
	'customers': ['firstname', 'lastname', 'email'],
	'orders': ['id_customer', 'id_cart', 'payment', 'module'],
	'addresses': ['firstname', 'lastname', 'address1', 'city', 'id_country', 'id_customer'],
	'manufacturers': ['name', 'active'],
	'suppliers': ['name', 'active'],
	'languages': ['name', 'iso_code', 'active'],
	'countries': ['iso_code', 'active'],
	'currencies': ['name', 'iso_code', 'conversion_rate', 'active'],
	'zones': ['name', 'active'],
	'states': ['name', 'iso_code', 'id_country', 'active'],
	'taxes': ['rate', 'active'],
	'tax_rules': ['id_country', 'id_tax'],
	'carriers': ['name', 'active'],
	'order_states': ['name', 'color'],
	'stock_availables': ['id_product', 'quantity'],
	'images': ['id_product'],
	'combinations': ['id_product'],
	'tags': ['name', 'id_lang'],
	'groups': ['name'],
};

/**
 * Builds URL with filter parameters
 */
export function buildUrlWithFilters(baseUrl: string, options: any, rawMode?: boolean): string {
	const url = new URL(baseUrl);
	const params = new URLSearchParams();

	for (const [key, value] of Object.entries(options)) {
		if (value !== null && value !== undefined && value !== '') {
			if (key === 'sort') {
				const normalizedSort = processSortParameter(String(value));
				if (normalizedSort) params.append('sort', normalizedSort);
			} else {
				params.append(key, String(value));
			}
		}
	}

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
 * Validates fields for CREATE operations (key-value pairs)
 */
export function validateFieldsForCreate(resource: string, fields: Array<{name: string, value: string}>): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	const requiredFields = REQUIRED_FIELDS_BY_RESOURCE[resource] || [];

	if (requiredFields.length === 0) {
		if (fields.length === 0) {
			errors.push(`At least one field must be provided to create ${resource}`);
		}
		return { isValid: errors.length === 0, errors };
	}

	// Extract field names from provided fields (handling multilingual format)
	const providedFieldNames = new Set<string>();
	for (const field of fields) {
		if (field.name) {
			const baseFieldName = field.name.match(/^(.+)-\d+$/) ? field.name.split('-')[0] : field.name;
			providedFieldNames.add(baseFieldName);
		}
	}

	const missingFields: string[] = [];
	for (const requiredField of requiredFields) {
		if (!providedFieldNames.has(requiredField)) {
			missingFields.push(requiredField);
		}
	}

	if (missingFields.length > 0) {
		errors.push(`Missing required fields for ${resource}: ${missingFields.join(', ')}`);
	}

	return { isValid: errors.length === 0, errors };
}

/**
 * Validates data before sending (legacy function for backward compatibility)
 */
export function validateDataForResource(resource: string, data: any, operation: string = 'create'): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!data || typeof data !== 'object') {
		errors.push('Data must be a valid object');
		return { isValid: false, errors };
	}

	if (operation === 'update') {
		const updateFields = Object.keys(data).filter(key => key !== 'id');
		if (updateFields.length === 0) {
			errors.push('At least one field must be provided for update (excluding id)');
		}

		if (data.hasOwnProperty('id')) {
			errors.push('Cannot modify id field in update operation. Use the ID parameter instead.');
		}
	}

	return { isValid: errors.length === 0, errors };
}
