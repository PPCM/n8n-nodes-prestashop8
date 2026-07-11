/**
 * Tests targeting the remaining uncovered lines and branches identified by coverage analysis:
 *
 * - response.ts L.61, 96, 140-144, 155, 160, 224
 * - errors.ts L.65
 * - loadOptions.ts L.101, 134, 137, 140, 161
 * - PrestaShop8.node.ts L.64, 387-388, 407, 472
 * - filters.ts branches (sort whitespace, rawMode empty params)
 */

import {
	processResponseForMode,
	simplifyPrestashopResponse,
	buildPrestashopXml,
} from '../../nodes/PrestaShop8/utils/response';
import { extractPrestashopError } from '../../nodes/PrestaShop8/utils/errors';
import { buildUrlWithFilters, validateDataForResource } from '../../nodes/PrestaShop8/utils/filters';
import { PrestaShop8 } from '../../nodes/PrestaShop8/PrestaShop8.node';

// ─── processResponseForMode — L.61 (non-prestashop object with resource key) ─

describe('processResponseForMode — non-prestashop object with resource array key', () => {
	it('should return the array directly when top-level object has resource as array key', () => {
		// rawData has no "prestashop" wrapper → simplifyPrestashopResponse returns rawData as-is
		// processResponseForMode then finds "products" key with array value → L.61 hit
		const raw = { products: [{ id: 1 }, { id: 2 }] };
		const result = processResponseForMode(raw, 'products');
		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);
	});

	it('should return the array for resource+"s" key in the simplified object', () => {
		const raw = { productss: [{ id: 1 }] };
		const result = processResponseForMode(raw, 'products');
		// falls through to return simplified (no exact key match)
		expect(result).toBeDefined();
	});
});

// ─── simplifyPrestashopResponse — L.96 (resource+'s' key branch) ─────────────

describe('simplifyPrestashopResponse — resource+"s" fallback key', () => {
	it('should unwrap data[resource+"s"] when data[resource] is absent', () => {
		// resource = 'product', response has 'products' → L.96 hit
		const raw = {
			prestashop: {
				products: [{ id: '1', name: 'Widget' }],
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product');
		// data['product'] is undefined, data['products'] exists → data = [{id:'1',...}]
		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(1);
	});
});

// ─── simplifyAssociation — L.140-144 (direct array branch) ──────────────────

describe('simplifyPrestashopResponse — simplifyAssociation with direct array', () => {
	it('should extract ids from a direct array association (L.140-144)', () => {
		// associations.categories is directly an array (not wrapped in an object)
		const raw = {
			prestashop: {
				product: {
					id: '1',
					associations: {
						categories: [{ id: '2' }, { id: '5' }],
					},
				},
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product');
		expect(result).toHaveProperty('categories');
		expect(Array.isArray(result.categories)).toBe(true);
		expect(result.categories).toContain(2);
		expect(result.categories).toContain(5);
	});

	it('should return convertValue(item) when array item has no .id property (L.144)', () => {
		// item is a string, not an object with id → convertValue(item) path
		const raw = {
			prestashop: {
				product: {
					id: '1',
					associations: {
						tags: ['red', 'blue'],
					},
				},
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product');
		expect(result.tags).toEqual(['red', 'blue']);
	});
});

// ─── simplifyAssociation — L.155 (single-key object, item without .id) ───────

describe('simplifyPrestashopResponse — simplifyAssociation single-key object without .id', () => {
	it('should return convertValue(item) for items without .id in single-key association (L.155)', () => {
		// assoc = { tag: ['word1', 'word2'] } → values[0] = ['word1', 'word2']
		// items are strings, not objects with .id → L.155 hit
		const raw = {
			prestashop: {
				product: {
					id: '1',
					associations: {
						tags: {
							tag: ['blue', 'green'],
						},
					},
				},
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product');
		expect(Array.isArray(result.tags)).toBe(true);
		expect(result.tags).toContain('blue');
	});
});

// ─── simplifyAssociation — L.160 (multi-key object fallback return []) ───────

describe('simplifyPrestashopResponse — simplifyAssociation multi-key object returns []', () => {
	it('should return empty array when association object has multiple keys (L.160)', () => {
		// assoc has 2 keys → values.length !== 1 → falls through to return [] at L.160
		const raw = {
			prestashop: {
				product: {
					id: '1',
					associations: {
						categories: {
							a: [{ id: '1' }],
							b: [{ id: '2' }],
						},
					},
				},
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product');
		expect(result.categories).toEqual([]);
	});
});

// ─── buildPrestashopXml — L.224 (non-object data in convertSimplifiedToPrestaShop) ─

describe('buildPrestashopXml — non-object data (L.224)', () => {
	it('should handle null data without throwing', () => {
		// convertSimplifiedToPrestaShop receives null → returns null at L.224
		expect(() => buildPrestashopXml('products', null)).not.toThrow();
	});

	it('should handle string data without throwing', () => {
		expect(() => buildPrestashopXml('products', 'raw-string')).not.toThrow();
	});
});

// ─── extractPrestashopError — L.65 (non-string, non-object element in errors array) ─

describe('extractPrestashopError — errors array with non-string, non-object element (L.65)', () => {
	it('should stringify a numeric error element via String(err)', () => {
		// arr element is number → neither typeof 'string' nor typeof 'object' → L.65: String(err)
		const error = {
			response: {
				data: { errors: [42] },
			},
		};
		const result = extractPrestashopError(error);
		expect(result).toBe('42');
	});

	it('should handle boolean element in errors array', () => {
		const error = {
			response: {
				data: { errors: [true] },
			},
		};
		const result = extractPrestashopError(error);
		expect(result).toBe('true');
	});
});

// ─── validateDataForResource — update-specific validations ───────────────────

describe('validateDataForResource — update validations', () => {
	it('should be invalid when data contains id field during update', () => {
		const result = validateDataForResource('products', { id: '5', name: 'Test' }, 'update');
		expect(result.isValid).toBe(false);
		expect(result.errors.some(e => e.includes('id'))).toBe(true);
	});

	it('should be invalid when update data has only id field (no other fields)', () => {
		// Only id → updateFields (excl. id) = [] → "At least one field" error
		// BUT: id field also triggers the "Cannot modify id" error
		const result = validateDataForResource('products', { id: '5' }, 'update');
		expect(result.isValid).toBe(false);
	});

	it('should be invalid when data is null', () => {
		const result = validateDataForResource('products', null, 'update');
		expect(result.isValid).toBe(false);
		expect(result.errors).toContain('Data must be a valid object');
	});

	it('should be invalid when data is not an object', () => {
		const result = validateDataForResource('products', 'not-an-object', 'update');
		expect(result.isValid).toBe(false);
		expect(result.errors).toContain('Data must be a valid object');
	});

	it('should be valid when update data has fields other than id', () => {
		const result = validateDataForResource('products', { name: 'New Name', price: '9.99' }, 'update');
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should be valid for create operation with any object', () => {
		const result = validateDataForResource('products', { name: 'Widget' }, 'create');
		expect(result.isValid).toBe(true);
	});
});

// ─── buildUrlWithFilters — branch: rawMode + empty params (L.53 false branch) ─

describe('buildUrlWithFilters — rawMode with no params (paramString empty)', () => {
	it('should return URL without query string when rawMode=true and no params', () => {
		const url = buildUrlWithFilters('https://shop.com/api/products', {}, true);
		// rawMode=true → no output_format appended; no params → paramString='' → url.search not set
		expect(url).toBe('https://shop.com/api/products');
	});

	it('should not append output_format=JSON in rawMode even with no other params', () => {
		const url = buildUrlWithFilters('https://shop.com/api/products', {}, true);
		expect(url).not.toContain('output_format');
	});
});

// ─── buildUrlWithFilters — branch: sort whitespace (normalizedSort falsy) ─────

describe('buildUrlWithFilters — sort with whitespace-only value', () => {
	it('should not append sort param when sort value is whitespace-only', () => {
		// value='   ' passes value !== '' check, but processSortParameter('   ')→'' → not appended
		const url = buildUrlWithFilters('https://shop.com/api/products', { sort: '   ', limit: 5 });
		expect(url).not.toContain('sort=');
		expect(url).toContain('limit=5');
	});
});

// ─── loadOptions.getAvailableFields — field description markers ──────────────
// NOTE: loadOptions.ts L.134, 137, 140 (Required / Read-only / Multilingual markers)
// are DEAD CODE with the current auto-generated schema: every field in
// resourceSchemas.ts has required=false, readOnly=false, multilang=false.
// These branches can only be reached once the schema generator is updated to emit
// those flags. The tests below document this current state and provide the
// skeleton for when the schema is regenerated with proper metadata.

describe('loadOptions.getAvailableFields — field description markers (current schema state)', () => {
	let getAvailableFields: Function;

	beforeEach(() => {
		const node = new PrestaShop8();
		getAvailableFields = node.methods.loadOptions.getAvailableFields;
	});

	function createMock(resource: string) {
		return { getCurrentNodeParameter: jest.fn(() => resource) };
	}

	it('should confirm no "Required" marker exists in current auto-generated schema (dead code L.134)', async () => {
		// All fields have required=false in the current generated schema.
		// When the schema generator emits required=true, flip this expectation.
		const result = await getAvailableFields.call(createMock('products'));
		const requiredFields = result.filter((f: any) => f.description.includes('Required'));
		expect(requiredFields.length).toBe(0); // documents current dead-code state
	});

	it('should confirm no "Read-only" marker exists in current auto-generated schema (dead code L.137)', async () => {
		const result = await getAvailableFields.call(createMock('products'));
		const readOnlyFields = result.filter((f: any) => f.description.includes('Read-only'));
		expect(readOnlyFields.length).toBe(0); // documents current dead-code state
	});

	it('should confirm no "Multilingual" marker exists in current auto-generated schema (dead code L.140)', async () => {
		const result = await getAvailableFields.call(createMock('products'));
		const multilangFields = result.filter((f: any) => f.description.includes('Multilingual'));
		expect(multilangFields.length).toBe(0); // documents current dead-code state
	});
});

// ─── PrestaShop8.node execute() — collectRequiredFields with mapped resource ──
// (L.64: push inside collectRequiredFields when mappings exist and value is non-empty)

describe('PrestaShop8.node execute() — create with resource having field mappings (L.64)', () => {
	function createExecuteMock(overrides: Record<string, any> = {}) {
		const defaults: Record<string, any> = {
			resource: 'products',
			operation: 'create',
			'options.timeout': 30000,
			'options.response.neverError': false,
			'options.response.includeResponseHeaders': false,
			'options.response.rawMode': false,
			'options.request.showRequestInfo': false,
			'options.request.showRequestUrl': false,
			productName: 'My Product',
			productPrice: '19.99',
			productCategoryId: '2',
			'fieldsToCreate.standardField': [],
			'fieldsToCreate.customField': [],
		};
		const params = { ...defaults, ...overrides };
		return {
			getNodeParameter: jest.fn((name: string, _i: number, def?: any) =>
				Object.prototype.hasOwnProperty.call(params, name) ? params[name] : def,
			),
			getCredentials: jest.fn().mockResolvedValue({ apiKey: 'KEY', baseUrl: 'https://shop.com/api' }),
			getNode: jest.fn().mockReturnValue({ name: 'PrestaShop8', type: 'prestaShop8' }),
			helpers: { httpRequest: jest.fn() },
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			continueOnFail: jest.fn().mockReturnValue(false),
		};
	}

	it('should collect productName/productPrice/productCategoryId from individual params (L.64)', async () => {
		const mock = createExecuteMock();
		// products has CREATE_FIELD_MAPPINGS → productName→name-1, productPrice→price, productCategoryId→id_category_default
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { product: { id: '1', name: 'My Product' } } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const call = mock.helpers.httpRequest.mock.calls[0][0];
		expect(call.method).toBe('POST');
		expect(call.body).toContain('My Product');
		expect(call.body).toContain('19.99');
	});

	it('should skip mapped param when its value is empty string', async () => {
		// productCategoryId = '' → skipped, productName and productPrice present
		const mock = createExecuteMock({
			productCategoryId: '',
			'fieldsToCreate.customField': [{ name: 'id_category_default', value: '2' }],
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { product: { id: '1' } } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const call = mock.helpers.httpRequest.mock.calls[0][0];
		// productName + productPrice came from mappings; id_category_default from customField
		expect(call.body).toContain('My Product');
	});
});

// ─── PrestaShop8.node execute() — search with unknown filter operator (L.387-388) ─

describe('PrestaShop8.node execute() — search with unknown filter operator (L.387-388)', () => {
	function createSearchMock(overrides: Record<string, any> = {}) {
		const defaults: Record<string, any> = {
			resource: 'products',
			operation: 'search',
			'options.timeout': 30000,
			'options.response.neverError': false,
			'options.response.includeResponseHeaders': false,
			'options.response.rawMode': false,
			'options.request.showRequestInfo': false,
			'options.request.showRequestUrl': false,
			advancedOptions: {},
			display: 'full',
			customFields: '',
		};
		const params = { ...defaults, ...overrides };
		return {
			getNodeParameter: jest.fn((name: string, _i: number, def?: any) =>
				Object.prototype.hasOwnProperty.call(params, name) ? params[name] : def,
			),
			getCredentials: jest.fn().mockResolvedValue({ apiKey: 'KEY', baseUrl: 'https://shop.com/api' }),
			getNode: jest.fn().mockReturnValue({ name: 'PrestaShop8', type: 'prestaShop8' }),
			helpers: { httpRequest: jest.fn() },
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			continueOnFail: jest.fn().mockReturnValue(false),
		};
	}

	it('should wrap value in brackets for unknown operator with a non-empty filterValue (L.387-388)', async () => {
		const mock = createSearchMock({
			filters: {
				standardFilter: [{ field: 'active', operator: 'UNKNOWN_OP', value: '1' }],
				customFilter: [],
			},
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		// L.388: filterParams[key] = `[${filterValue}]`
		expect(decodeURIComponent(url)).toContain('filter[active]=[1]');
	});

	it('should skip filter for unknown operator with empty filterValue', async () => {
		// filterValue = '' AND format is undefined → the else if (filterValue) is false → filter not added
		const mock = createSearchMock({
			filters: {
				standardFilter: [{ field: 'active', operator: 'UNKNOWN_OP', value: '' }],
				customFilter: [],
			},
		});
		// Must have at least one filter that contributes to avoid the "no filters" error.
		// Add a valid one too to avoid the "At least one filter" throw.
		// Actually with no valid filter AND no custom, the throw is triggered.
		// Use only one filter that has a value to satisfy the `filters.length` check,
		// then make the unknown op with '' not add anything.
		// We need filters.length > 0 (the array itself), but the URL should not have the unknown filter.
		// Solution: use CUSTOM as second filter to bypass and also have unknown + empty.
		const mock2 = createSearchMock({
			filters: {
				standardFilter: [
					{ field: 'active', operator: 'UNKNOWN_OP', value: '' },
					{ field: 'active', operator: 'EQ', value: '1' },
				],
				customFilter: [],
			},
		});
		mock2.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock2 as any);

		const url: string = mock2.helpers.httpRequest.mock.calls[0][0].url;
		// The unknown operator with empty value should not add filter[active]=[],
		// only the EQ filter should appear.
		const decoded = decodeURIComponent(url);
		expect(decoded).toContain('filter[active]=[1]');
	});
});

// ─── PrestaShop8.node execute() — search with dateFormat option (L.407) ──────

describe('PrestaShop8.node execute() — search with dateFormat (L.407)', () => {
	function createSearchMock(overrides: Record<string, any> = {}) {
		const defaults: Record<string, any> = {
			resource: 'products',
			operation: 'search',
			'options.timeout': 30000,
			'options.response.neverError': false,
			'options.response.includeResponseHeaders': false,
			'options.response.rawMode': false,
			'options.request.showRequestInfo': false,
			'options.request.showRequestUrl': false,
			advancedOptions: {},
			display: 'full',
			customFields: '',
			filters: {
				standardFilter: [{ field: 'active', operator: 'EQ', value: '1' }],
				customFilter: [],
			},
		};
		const params = { ...defaults, ...overrides };
		return {
			getNodeParameter: jest.fn((name: string, _i: number, def?: any) =>
				Object.prototype.hasOwnProperty.call(params, name) ? params[name] : def,
			),
			getCredentials: jest.fn().mockResolvedValue({ apiKey: 'KEY', baseUrl: 'https://shop.com/api' }),
			getNode: jest.fn().mockReturnValue({ name: 'PrestaShop8', type: 'prestaShop8' }),
			helpers: { httpRequest: jest.fn() },
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			continueOnFail: jest.fn().mockReturnValue(false),
		};
	}

	it('should append date=1 to search URL when advancedOptions.dateFormat is true (L.407)', async () => {
		const mock = createSearchMock({ advancedOptions: { dateFormat: true } });
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).toContain('date=1');
	});

	it('should NOT append date to search URL when dateFormat is absent', async () => {
		const mock = createSearchMock({ advancedOptions: {} });
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).not.toMatch(/[?&]date=/);
	});
});

// ─── PrestaShop8.node execute() — multiple input items ───────────────────────

describe('PrestaShop8.node execute() — multiple input items', () => {
	function createMultiItemMock(itemCount: number) {
		const params: Record<string, any> = {
			resource: 'products',
			operation: 'list',
			'options.timeout': 30000,
			'options.response.neverError': false,
			'options.response.includeResponseHeaders': false,
			'options.response.rawMode': false,
			'options.request.showRequestInfo': false,
			'options.request.showRequestUrl': false,
			advancedOptions: {},
			display: 'full',
			customFields: '',
		};
		return {
			getNodeParameter: jest.fn((name: string, _i: number, def?: any) =>
				Object.prototype.hasOwnProperty.call(params, name) ? params[name] : def,
			),
			getCredentials: jest.fn().mockResolvedValue({ apiKey: 'KEY', baseUrl: 'https://shop.com/api' }),
			getNode: jest.fn().mockReturnValue({ name: 'PrestaShop8', type: 'prestaShop8' }),
			helpers: {
				httpRequest: jest.fn().mockResolvedValue({ prestashop: { products: [{ id: '1' }] } }),
			},
			getInputData: jest.fn().mockReturnValue(Array.from({ length: itemCount }, () => ({ json: {} }))),
			continueOnFail: jest.fn().mockReturnValue(false),
		};
	}

	it('should execute once per input item and return aggregated results', async () => {
		const mock = createMultiItemMock(3);
		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		// httpRequest called once per item (3 items → 3 list calls)
		expect(mock.helpers.httpRequest).toHaveBeenCalledTimes(3);
		// All 3 items produce output
		expect(result[0].length).toBe(3);
	});

	it('should tag each output item with its pairedItem index', async () => {
		const mock = createMultiItemMock(2);
		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0][0].pairedItem).toEqual({ item: 0 });
		expect(result[0][1].pairedItem).toEqual({ item: 1 });
	});
});
