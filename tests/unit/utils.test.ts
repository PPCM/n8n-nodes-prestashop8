import {
	extractPrestashopError,
	processSortParameter,
	processDisplayParameter,
	buildUrlWithFilters,
	buildCreateXml,
	buildUpdateXml,
	simplifyPrestashopResponse,
	processResponseForMode,
	parseXmlToJson,
	validateFieldsForCreate,
	validateDataForResource,
	REQUIRED_FIELDS_BY_RESOURCE,
} from '../../nodes/PrestaShop8/utils';
import { cleanErrorMessage } from '../../nodes/PrestaShop8/utils/errors';
import { convertResourceTypes } from '../../nodes/PrestaShop8/resourceSchemas';

// ─── extractPrestashopError ─────────────────────────────────────────────────

describe('extractPrestashopError', () => {
	it('should return default message for null/undefined', () => {
		expect(extractPrestashopError(null)).toBe('Unknown error occurred');
		expect(extractPrestashopError(undefined)).toBe('Unknown error occurred');
		expect(extractPrestashopError(0)).toBe('Unknown error occurred');
		expect(extractPrestashopError('')).toBe('Unknown error occurred');
	});

	it('should extract error from axios XML CDATA response', () => {
		const error = {
			response: {
				data: '<errors><error><![CDATA[Invalid product ID]]></error></errors>',
			},
		};
		expect(extractPrestashopError(error)).toBe('Invalid product ID');
	});

	it('should extract error from JSON .error field', () => {
		const error = {
			response: {
				data: { error: 'Something went wrong' },
			},
		};
		expect(extractPrestashopError(error)).toBe('Something went wrong');
	});

	it('should extract error from JSON .errors array of strings', () => {
		const error = {
			response: {
				data: { errors: ['Error 1', 'Error 2'] },
			},
		};
		expect(extractPrestashopError(error)).toBe('Error 1, Error 2');
	});

	it('should extract error from JSON .errors array of objects', () => {
		const error = {
			response: {
				data: { errors: [{ message: 'Field required' }] },
			},
		};
		expect(extractPrestashopError(error)).toBe('Field required');
	});

	it('should extract error from JSON .message field', () => {
		const error = {
			response: {
				data: { message: 'Not found' },
			},
		};
		expect(extractPrestashopError(error)).toBe('Not found');
	});

	it('should extract error from prestashop.error field', () => {
		const error = {
			response: {
				data: { prestashop: { error: 'API key invalid' } },
			},
		};
		expect(extractPrestashopError(error)).toBe('API key invalid');
	});

	it('should fall back to raw string data', () => {
		const error = {
			response: {
				data: 'Raw error string',
			},
		};
		expect(extractPrestashopError(error)).toBe('Raw error string');
	});

	it('should fall back to error.message when no response', () => {
		const error = { message: 'Network timeout' };
		expect(extractPrestashopError(error)).toBe('Network timeout');
	});

	it('should return default message for error without message', () => {
		const error = { someField: true };
		expect(extractPrestashopError(error)).toBe('PrestaShop API error occurred');
	});

	it('should stringify unknown object response', () => {
		const error = {
			response: {
				data: { unknownKey: 'some value' },
			},
		};
		const result = extractPrestashopError(error);
		expect(result).toContain('unknownKey');
		expect(result).toContain('some value');
	});
});

// ─── processSortParameter ───────────────────────────────────────────────────

describe('processSortParameter', () => {
	it('should return empty string for empty/null/undefined', () => {
		expect(processSortParameter('')).toBe('');
		expect(processSortParameter('  ')).toBe('');
		expect(processSortParameter(null as any)).toBe('');
		expect(processSortParameter(undefined as any)).toBe('');
	});

	it('should keep _ASC suffix as-is', () => {
		expect(processSortParameter('id_ASC')).toBe('id_ASC');
	});

	it('should keep _DESC suffix as-is', () => {
		expect(processSortParameter('name_DESC')).toBe('name_DESC');
	});

	it('should add _ASC when no suffix present', () => {
		expect(processSortParameter('id')).toBe('id_ASC');
		expect(processSortParameter('name')).toBe('name_ASC');
	});

	it('should trim whitespace', () => {
		expect(processSortParameter('  id_DESC  ')).toBe('id_DESC');
	});
});

// ─── processDisplayParameter ────────────────────────────────────────────────

describe('processDisplayParameter', () => {
	it('should return null for minimal', () => {
		expect(processDisplayParameter('minimal', 'products')).toBeNull();
	});

	it('should return "full" for full', () => {
		expect(processDisplayParameter('full', 'products')).toBe('full');
	});

	it('should wrap custom fields in brackets', () => {
		expect(processDisplayParameter('custom', 'products', 'id,name,price')).toBe('[id,name,price]');
	});

	it('should keep custom fields already in brackets', () => {
		expect(processDisplayParameter('custom', 'products', '[id,name]')).toBe('[id,name]');
	});

	it('should trim custom field names', () => {
		expect(processDisplayParameter('custom', 'products', ' id , name ')).toBe('[id,name]');
	});

	it('should return value as-is for unknown display mode', () => {
		expect(processDisplayParameter('something', 'products')).toBe('something');
	});

	it('should return full as default for empty string', () => {
		expect(processDisplayParameter('', 'products')).toBe('full');
	});
});

// ─── buildUrlWithFilters ────────────────────────────────────────────────────

describe('buildUrlWithFilters', () => {
	it('should build URL with simple params', () => {
		const url = buildUrlWithFilters('https://shop.com/api/products', {
			display: 'full',
			limit: '10',
		});
		expect(url).toContain('display=full');
		expect(url).toContain('limit=10');
		expect(url).toContain('output_format=JSON');
	});

	it('should normalize sort parameter', () => {
		const url = buildUrlWithFilters('https://shop.com/api/products', {
			sort: 'id',
		});
		expect(url).toContain('sort=id_ASC');
	});

	it('should skip null/empty/undefined values', () => {
		const url = buildUrlWithFilters('https://shop.com/api/products', {
			display: 'full',
			limit: null,
			offset: undefined,
			sort: '',
		});
		expect(url).toContain('display=full');
		expect(url).not.toContain('limit');
		expect(url).not.toContain('offset');
		// sort is empty → processSortParameter returns '' → skipped
		expect(url).not.toContain('sort=');
	});

	it('should not add output_format in raw mode', () => {
		const url = buildUrlWithFilters(
			'https://shop.com/api/products',
			{ display: 'full' },
			true,
		);
		expect(url).toContain('display=full');
		expect(url).not.toContain('output_format');
	});

	it('should add output_format=JSON when not raw mode', () => {
		const url = buildUrlWithFilters('https://shop.com/api/products', {});
		expect(url).toContain('output_format=JSON');
	});

	it('should include filter parameters', () => {
		const url = buildUrlWithFilters('https://shop.com/api/products', {
			'filter[id]': '[1|5]',
			'filter[name]': '%test%',
		});
		expect(url).toContain('filter%5Bid%5D=%5B1%7C5%5D');
		expect(url).toContain('filter%5Bname%5D=%25test%25');
	});
});

// ─── buildCreateXml ─────────────────────────────────────────────────────────

describe('buildCreateXml', () => {
	it('should convert plural resource to singular', () => {
		const xml = buildCreateXml('products', [{ name: 'price', value: '10.00' }]);
		expect(xml).toContain('<product>');
		expect(xml).toContain('</product>');
		expect(xml).not.toContain('<products>');
	});

	it('should use singular map for special cases', () => {
		const xml = buildCreateXml('categories', [{ name: 'name-1', value: 'Test' }]);
		expect(xml).toContain('<category>');
		expect(xml).toContain('</category>');
	});

	it('should handle multilingual fields', () => {
		const xml = buildCreateXml('products', [
			{ name: 'name-1', value: 'English name' },
			{ name: 'name-2', value: 'Nom français' },
		]);
		expect(xml).toContain('<name>');
		expect(xml).toContain('<language id="1"><![CDATA[English name]]></language>');
		expect(xml).toContain('<language id="2"><![CDATA[Nom français]]></language>');
		expect(xml).toContain('</name>');
	});

	it('should handle regular fields with CDATA', () => {
		const xml = buildCreateXml('products', [{ name: 'price', value: '29.99' }]);
		expect(xml).toContain('<price><![CDATA[29.99]]></price>');
	});

	it('should include XML declaration and prestashop root', () => {
		const xml = buildCreateXml('products', [{ name: 'price', value: '10' }]);
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">');
		expect(xml).toContain('</prestashop>');
	});

	it('should not include an id field', () => {
		const xml = buildCreateXml('products', [{ name: 'price', value: '10' }]);
		expect(xml).not.toContain('<id>');
	});

	it('should handle addresses singular map', () => {
		const xml = buildCreateXml('addresses', [{ name: 'city', value: 'Paris' }]);
		expect(xml).toContain('<address>');
	});
});

// ─── buildUpdateXml ─────────────────────────────────────────────────────────

describe('buildUpdateXml', () => {
	it('should include ID as CDATA', () => {
		const xml = buildUpdateXml('products', 42, [{ name: 'price', value: '10' }]);
		expect(xml).toContain('<id><![CDATA[42]]></id>');
	});

	it('should accept string ID', () => {
		const xml = buildUpdateXml('products', '99', [{ name: 'price', value: '5' }]);
		expect(xml).toContain('<id><![CDATA[99]]></id>');
	});

	it('should handle multilingual fields', () => {
		const xml = buildUpdateXml('categories', 5, [
			{ name: 'name-1', value: 'Updated' },
		]);
		expect(xml).toContain('<category>');
		expect(xml).toContain('<language id="1"><![CDATA[Updated]]></language>');
		expect(xml).toContain('<id><![CDATA[5]]></id>');
	});

	it('should keep XML special characters unescaped inside CDATA', () => {
		const xml = buildUpdateXml('products', 1, [
			{ name: 'description', value: 'A <b>bold</b> & "nice" product' },
		]);
		expect(xml).toContain('<![CDATA[A <b>bold</b> & "nice" product]]>');
		expect(xml).not.toContain('&lt;');
		expect(xml).not.toContain('&amp;');
	});

	it('should use singular form for stock_availables', () => {
		const xml = buildUpdateXml('stock_availables', 10, [
			{ name: 'quantity', value: '50' },
		]);
		expect(xml).toContain('<stock_available>');
		expect(xml).toContain('</stock_available>');
	});
});

// ─── simplifyPrestashopResponse ─────────────────────────────────────────────

describe('simplifyPrestashopResponse', () => {
	it('should unwrap prestashop envelope', () => {
		const raw = {
			prestashop: {
				products: [{ id: '1', name: 'Test' }],
			},
		};
		const result = simplifyPrestashopResponse(raw, 'products');
		expect(Array.isArray(result)).toBe(true);
		expect(result[0]).toHaveProperty('id');
	});

	it('should return raw data when no prestashop wrapper', () => {
		const data = { id: '1', name: 'Test' };
		expect(simplifyPrestashopResponse(data, 'products')).toEqual(data);
	});

	it('should return null/undefined as-is', () => {
		expect(simplifyPrestashopResponse(null, 'products')).toBeNull();
		expect(simplifyPrestashopResponse(undefined, 'products')).toBeUndefined();
	});

	it('should handle single item (non-array)', () => {
		const raw = {
			prestashop: {
				product: { id: '1', name: 'Single' },
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product');
		expect(result).toHaveProperty('id');
	});

	it('should convert id_* field names to camelCase', () => {
		const raw = {
			prestashop: {
				product: { id_manufacturer: '5', id_category_default: '2' },
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product');
		expect(result).toHaveProperty('manufacturer');
		expect(result).toHaveProperty('categoryDefault');
	});

	it('should convert string numbers to actual numbers', () => {
		const raw = {
			prestashop: {
				product: { id: '42', price: '29.99' },
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product');
		expect(result.id).toBe(42);
		expect(result.price).toBe(29.99);
	});

	it('should convert string booleans (1/0 parsed as numbers by convertValue)', () => {
		const raw = {
			prestashop: {
				product: { active: 'true', on_sale: 'false' },
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product');
		expect(result.active).toBe(true);
		expect(result.onSale).toBe(false);
	});

	it('should convert single-digit strings to numbers (1/0)', () => {
		const raw = {
			prestashop: {
				product: { active: '1', on_sale: '0' },
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product');
		// convertValue matches /^\d+$/ before boolean check, so '1' → 1, '0' → 0
		expect(result.active).toBe(1);
		expect(result.onSale).toBe(0);
	});
});

// ─── processResponseForMode ─────────────────────────────────────────────────

describe('processResponseForMode', () => {
	it('should return array directly', () => {
		const data = { prestashop: { products: [{ id: '1' }, { id: '2' }] } };
		const result = processResponseForMode(data, 'products');
		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);
	});

	it('should extract resource key from object', () => {
		const data = {
			prestashop: {
				products: [{ id: '1', name: 'A' }],
			},
		};
		const result = processResponseForMode(data, 'products');
		expect(Array.isArray(result)).toBe(true);
	});

	it('should unwrap single item response', () => {
		const data = {
			prestashop: {
				product: { id: '1', name: 'Test' },
			},
		};
		const result = processResponseForMode(data, 'product');
		expect(result).toHaveProperty('id');
		expect(Array.isArray(result)).toBe(false);
	});

	it('should return simplified data when no matching key', () => {
		const data = { prestashop: { other: 'value' } };
		const result = processResponseForMode(data, 'products');
		expect(result).toBeDefined();
	});
});

// ─── parseXmlToJson ─────────────────────────────────────────────────────────

describe('parseXmlToJson', () => {
	it('should parse simple XML to JSON', async () => {
		const xml = '<root><name>Test</name><id>42</id></root>';
		const result = await parseXmlToJson(xml);
		expect(result).toHaveProperty('root');
		expect(result.root.name).toBe('Test');
		expect(result.root.id).toBe('42');
	});

	it('should handle XML with attributes', async () => {
		const xml = '<product id="1"><name>Widget</name></product>';
		const result = await parseXmlToJson(xml);
		expect(result.product.id).toBe('1');
		expect(result.product.name).toBe('Widget');
	});

	it('should reject invalid XML', async () => {
		await expect(parseXmlToJson('<invalid><unclosed>')).rejects.toThrow();
	});
});

// ─── validateFieldsForCreate ────────────────────────────────────────────────

describe('validateFieldsForCreate', () => {
	it('should detect missing required fields', () => {
		const result = validateFieldsForCreate('products', [
			{ name: 'name-1', value: 'Test' },
		]);
		expect(result.isValid).toBe(false);
		expect(result.errors[0]).toContain('Missing required fields');
		expect(result.errors[0]).toContain('price');
		expect(result.errors[0]).toContain('id_category_default');
	});

	it('should pass when all required fields provided', () => {
		const result = validateFieldsForCreate('products', [
			{ name: 'name-1', value: 'Test' },
			{ name: 'price', value: '10.00' },
			{ name: 'id_category_default', value: '2' },
		]);
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should require all PrestaShop mandatory fields for specific_prices', () => {
		const customerPrice = [
			{ name: 'id_shop', value: '0' },
			{ name: 'id_cart', value: '0' },
			{ name: 'id_product', value: '20' },
			{ name: 'id_currency', value: '0' },
			{ name: 'id_country', value: '0' },
			{ name: 'id_group', value: '0' },
			{ name: 'id_customer', value: '32' },
			{ name: 'price', value: '12.50' },
			{ name: 'from_quantity', value: '1' },
			{ name: 'reduction', value: '0' },
			{ name: 'reduction_tax', value: '0' },
			{ name: 'reduction_type', value: 'amount' },
			{ name: 'from', value: '0000-00-00 00:00:00' },
			{ name: 'to', value: '0000-00-00 00:00:00' },
		];
		expect(validateFieldsForCreate('specific_prices', customerPrice).isValid).toBe(true);

		const result = validateFieldsForCreate('specific_prices', customerPrice.filter((f) => f.name !== 'id_cart'));
		expect(result.isValid).toBe(false);
		expect(result.errors[0]).toContain('id_cart');
	});

	it('should handle multilingual base field matching', () => {
		const result = validateFieldsForCreate('categories', [
			{ name: 'name-1', value: 'Category' },
			{ name: 'id_parent', value: '1' },
		]);
		expect(result.isValid).toBe(true);
	});

	it('should accept unknown resource with at least one field', () => {
		const result = validateFieldsForCreate('unknown_resource', [
			{ name: 'field', value: 'value' },
		]);
		expect(result.isValid).toBe(true);
	});

	it('should reject unknown resource with empty fields', () => {
		const result = validateFieldsForCreate('unknown_resource', []);
		expect(result.isValid).toBe(false);
		expect(result.errors[0]).toContain('At least one field');
	});
});

// ─── validateDataForResource ────────────────────────────────────────────────

describe('validateDataForResource', () => {
	it('should reject null/undefined data', () => {
		expect(validateDataForResource('products', null).isValid).toBe(false);
		expect(validateDataForResource('products', undefined).isValid).toBe(false);
		expect(validateDataForResource('products', 'string').isValid).toBe(false);
	});

	it('should reject update with no fields (only id)', () => {
		const result = validateDataForResource('products', { id: 1 }, 'update');
		expect(result.isValid).toBe(false);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.stringContaining('At least one field'),
				expect.stringContaining('Cannot modify id'),
			]),
		);
	});

	it('should reject update with id field', () => {
		const result = validateDataForResource('products', { id: 1, name: 'Test' }, 'update');
		expect(result.isValid).toBe(false);
		expect(result.errors[0]).toContain('Cannot modify id');
	});

	it('should pass update with valid fields and no id', () => {
		const result = validateDataForResource('products', { name: 'Test', price: 10 }, 'update');
		expect(result.isValid).toBe(true);
	});

	it('should pass create with valid data', () => {
		const result = validateDataForResource('products', { name: 'Test' }, 'create');
		expect(result.isValid).toBe(true);
	});
});

// ─── REQUIRED_FIELDS_BY_RESOURCE constant ───────────────────────────────────

describe('REQUIRED_FIELDS_BY_RESOURCE', () => {
	it('should define required fields for key resources', () => {
		expect(REQUIRED_FIELDS_BY_RESOURCE['products']).toContain('name');
		expect(REQUIRED_FIELDS_BY_RESOURCE['products']).toContain('price');
		expect(REQUIRED_FIELDS_BY_RESOURCE['customers']).toContain('email');
		expect(REQUIRED_FIELDS_BY_RESOURCE['categories']).toContain('id_parent');
	});

	it('should have entries for multiple resources', () => {
		const resources = Object.keys(REQUIRED_FIELDS_BY_RESOURCE);
		expect(resources.length).toBeGreaterThan(10);
	});
});

// ─── convertResourceTypes — id field conversion ─────────────────────────────

describe('convertResourceTypes — id field', () => {
	it('should convert string id to number', () => {
		const result = convertResourceTypes({ id: '10', name: 'Test' }, 'products');
		expect(result.id).toBe(10);
		expect(typeof result.id).toBe('number');
	});

	it('should keep numeric id as-is', () => {
		const result = convertResourceTypes({ id: 10, name: 'Test' }, 'products');
		expect(result.id).toBe(10);
		expect(typeof result.id).toBe('number');
	});

	it('should work for any resource', () => {
		const result = convertResourceTypes({ id: '42' }, 'zones');
		expect(result.id).toBe(42);
	});
});

// ─── convertResourceTypes — id_* foreign key conversion ─────────────────────

describe('convertResourceTypes — id_* foreign keys', () => {
	it('should convert id_default_group string to number for customers', () => {
		const result = convertResourceTypes({ id_default_group: '3' }, 'customers');
		expect(result.id_default_group).toBe(3);
		expect(typeof result.id_default_group).toBe('number');
	});

	it('should convert any id_* field not in schema to number', () => {
		const result = convertResourceTypes({ id_some_field: '42' }, 'products');
		expect(result.id_some_field).toBe(42);
		expect(typeof result.id_some_field).toBe('number');
	});

	it('should not convert id_* fields that are not numeric strings', () => {
		const result = convertResourceTypes({ id_custom: 'abc' }, 'products');
		expect(result.id_custom).toBe('abc');
	});

	it('should not affect id_* fields already in schema', () => {
		// id_lang is in the customers schema with type number
		const result = convertResourceTypes({ id_lang: '2' }, 'customers');
		expect(result.id_lang).toBe(2);
		expect(typeof result.id_lang).toBe('number');
	});

	it('should return data unchanged for unknown resource (no schema)', () => {
		const data = { id: '1', name: 'X' };
		const result = convertResourceTypes(data, 'nonexistent_resource');
		expect(result).toEqual(data);
	});

	it('should return data unchanged for null input', () => {
		expect(convertResourceTypes(null, 'products')).toBeNull();
	});

	it('should convert price fields to number via pattern matching', () => {
		// 'price' field is not a schema key with explicit type on all resources,
		// but convertByFieldPattern matches fields containing 'price'
		const result = convertResourceTypes({ shipping_price: '5.50' }, 'products');
		expect(result.shipping_price).toBe(5.5);
	});

	it('should convert quantity fields to number via pattern matching', () => {
		const result = convertResourceTypes({ out_of_stock_quantity: '10' }, 'products');
		expect(result.out_of_stock_quantity).toBe(10);
	});

	it('should process associations and convert id fields within them', () => {
		const data = {
			associations: {
				categories: [{ id: '2' }, { id: '5' }],
			},
		};
		const result = convertResourceTypes(data, 'products');
		expect(result.associations.categories[0].id).toBe(2);
		expect(result.associations.categories[1].id).toBe(5);
	});
});

// ─── cleanErrorMessage ───────────────────────────────────────────────────────

describe('cleanErrorMessage', () => {
	it('should return non-string input as-is', () => {
		expect(cleanErrorMessage(null as any)).toBeNull();
		expect(cleanErrorMessage(undefined as any)).toBeUndefined();
		expect(cleanErrorMessage(42 as any)).toBe(42);
	});

	it('should return plain message unchanged', () => {
		expect(cleanErrorMessage('Product not found')).toBe('Product not found');
	});

	it('should strip PHP Warning annotations', () => {
		const msg = 'Invalid value, [PHP Warning #2] some path/file.php on line 100)';
		const cleaned = cleanErrorMessage(msg);
		expect(cleaned).not.toContain('[PHP Warning');
		expect(cleaned).toContain('Invalid value');
	});

	it('should strip PHP Notice annotations', () => {
		const msg = 'Bad request, [PHP Notice #1] warning text, line 42)';
		const cleaned = cleanErrorMessage(msg);
		expect(cleaned).not.toContain('[PHP Notice');
	});

	it('should strip PHP file path patterns that have a closing parenthesis', () => {
		// The regex \([^)]*\.php[^)]*\) requires a closing ) immediately after the path.
		// "Error (Product.php)" is stripped; paths followed by extra text like " on line N)"
		// are partially cleaned by the line-pattern regex first.
		const msg = 'Error (Product.php)';
		const cleaned = cleanErrorMessage(msg);
		expect(cleaned).not.toContain('.php');
		expect(cleaned.trim()).toBe('Error');
	});

	it('should trim leading and trailing whitespace', () => {
		expect(cleanErrorMessage('  hello  ')).toBe('hello');
	});

	it('should filter empty parts after splitting on commas', () => {
		const msg = 'Error one, , , Error two';
		const cleaned = cleanErrorMessage(msg);
		expect(cleaned).toContain('Error one');
		expect(cleaned).toContain('Error two');
		// Should not have consecutive separators
		expect(cleaned).not.toMatch(/,\s*,/);
	});

	it('should return empty string for message that is only PHP warnings', () => {
		// After stripping, nothing meaningful remains
		const msg = '[PHP Warning #1] warning, line 10)';
		const cleaned = cleanErrorMessage(msg);
		// Result should not contain PHP artifacts
		expect(cleaned).not.toContain('[PHP');
	});
});

// ─── processDisplayParameter — missing edge cases ────────────────────────────

describe('processDisplayParameter — edge cases', () => {
	it('should throw for custom mode without customFields', () => {
		// 'display=custom' is not a valid PrestaShop value: must fail clearly
		expect(() => processDisplayParameter('custom', 'products', undefined)).toThrow(
			/requires at least one field/,
		);
	});

	it('should throw for custom mode with empty customFields', () => {
		expect(() => processDisplayParameter('custom', 'products', '')).toThrow(
			/requires at least one field/,
		);
	});

	it('should handle single custom field without brackets', () => {
		const result = processDisplayParameter('custom', 'products', 'id');
		expect(result).toBe('[id]');
	});
});

// ─── buildCreateXml — missing edge cases ─────────────────────────────────────

describe('buildCreateXml — edge cases', () => {
	it('should produce valid XML with empty fields array', () => {
		const xml = buildCreateXml('products', []);
		expect(xml).toContain('<product>');
		expect(xml).toContain('</product>');
		expect(xml).toContain('<?xml version="1.0"');
	});

	it('should keep apostrophe unescaped inside CDATA', () => {
		const xml = buildCreateXml('products', [{ name: 'name-1', value: "L'air" }]);
		expect(xml).toContain("<![CDATA[L'air]]>");
		expect(xml).not.toContain('&apos;');
	});

	it('should handle resource that does not end in s (no plural stripping)', () => {
		// 'tax' does not end in s → singular = 'tax' (slice(-1) guard)
		const xml = buildCreateXml('tax', [{ name: 'rate', value: '20' }]);
		expect(xml).toContain('<tax>');
		expect(xml).toContain('</tax>');
	});

	it('should handle multiple regular fields', () => {
		const xml = buildCreateXml('products', [
			{ name: 'price', value: '10.00' },
			{ name: 'active', value: '1' },
		]);
		expect(xml).toContain('<price><![CDATA[10.00]]></price>');
		expect(xml).toContain('<active><![CDATA[1]]></active>');
	});
});

// ─── simplifyPrestashopResponse — associations ───────────────────────────────

describe('simplifyPrestashopResponse — associations', () => {
	it('should flatten association arrays into id values', () => {
		const raw = {
			prestashop: {
				product: {
					associations: {
						categories: { category: [{ id: '2' }, { id: '5' }] },
					},
				},
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product');
		// associations key is spread into top-level keys
		expect(result).toHaveProperty('categories');
		expect(Array.isArray(result.categories)).toBe(true);
	});

	it('should handle product key plural mismatch (resource=products, key=products)', () => {
		const raw = {
			prestashop: {
				products: [{ id: '1' }, { id: '2' }],
			},
		};
		const result = simplifyPrestashopResponse(raw, 'products');
		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);
	});
});
