/**
 * Coverage gaps for utility functions not reached by existing tests:
 * - cleanErrorMessage edge cases (PHP Error pattern, empty string, non-string input)
 * - captureRequestDebugInfo with json property (raw mode)
 * - wrapResponse statusCode=300 boundary
 * - buildHttpOptions for PATCH/PUT with body (Content-Type)
 * - validateFieldsForCreate with multilingual field non-1 lang ID
 * - getFieldMappingsForResource for untested resources
 * - processResponseForMode with null/undefined
 * - buildCreateXml with multiple language entries for the same field
 * - processDisplayParameter edge cases (no customFields, empty display value)
 * - simplifyPrestashopResponse with xml2js single-key-object association format
 * - buildUrlWithFilters with numeric-zero value in options
 * - execute() display='custom' URL integration
 * - execute() rawMode for update and delete operations
 * - getAvailableFields description markers (Multilingual, Read-only)
 */

import { cleanErrorMessage } from '../../nodes/PrestaShop8/utils/errors';
import {
	captureRequestDebugInfo,
	buildHttpOptions,
	wrapResponse,
} from '../../nodes/PrestaShop8/helpers/http';
import {
	validateFieldsForCreate,
	processResponseForMode,
	processDisplayParameter,
	simplifyPrestashopResponse,
	buildUrlWithFilters,
	buildCreateXml,
	buildUpdateXml,
} from '../../nodes/PrestaShop8/utils';
import { getFieldMappingsForResource, CREATE_FIELD_MAPPINGS } from '../../nodes/PrestaShop8/fieldMappings';
import { convertResourceArray } from '../../nodes/PrestaShop8/resourceSchemas';

// ─── cleanErrorMessage — missing edge cases ───────────────────────────────────

describe('cleanErrorMessage — missing edge cases', () => {
	it('should strip PHP Error (not just Warning/Notice) patterns', () => {
		const msg = 'Bad request, [PHP Error #3] some/path/File.php on line 55)';
		const cleaned = cleanErrorMessage(msg);
		expect(cleaned).not.toContain('[PHP Error');
		expect(cleaned).toContain('Bad request');
	});

	it('should return empty string unchanged', () => {
		expect(cleanErrorMessage('')).toBe('');
	});

	it('should handle a message that is pure PHP warnings (nothing meaningful left)', () => {
		const msg = '[PHP Warning #1] warning text, line 10)';
		const cleaned = cleanErrorMessage(msg);
		expect(cleaned).not.toContain('[PHP');
		expect(cleaned).not.toContain('line 10');
	});

	it('should strip multiple consecutive PHP annotations', () => {
		const msg = 'Error A, [PHP Warning #1] path.php on line 1), [PHP Notice #2] path.php on line 2)';
		const cleaned = cleanErrorMessage(msg);
		expect(cleaned).not.toContain('[PHP');
		expect(cleaned).toContain('Error A');
	});
});

// ─── captureRequestDebugInfo — json property ─────────────────────────────────

describe('captureRequestDebugInfo — json property in options', () => {
	const options = { method: 'GET', url: 'https://shop.com/api/products', headers: { 'Output-Format': 'XML' }, timeout: 30000, json: false };
	const credentials = { apiKey: 'MYKEY', baseUrl: 'https://shop.com/api' };

	it('should include jsonParsing when options.json is defined (rawMode)', () => {
		const info = captureRequestDebugInfo(options, credentials, true, 'list', 'products');
		expect(Object.prototype.hasOwnProperty.call(info, 'jsonParsing')).toBe(true);
		expect(info.jsonParsing).toBe(false);
	});

	it('should not include jsonParsing when options.json is undefined (JSON mode)', () => {
		const optionsNoJson = { method: 'GET', url: 'https://shop.com/api/products', headers: {}, timeout: 30000 };
		const info = captureRequestDebugInfo(optionsNoJson, credentials, false, 'list', 'products');
		expect(Object.prototype.hasOwnProperty.call(info, 'jsonParsing')).toBe(false);
	});
});

// ─── wrapResponse — statusCode boundary ─────────────────────────────────────

describe('wrapResponse — statusCode=300 boundary', () => {
	const payload = { id: 1 };

	it('should set statusMessage to Error for statusCode 300 (boundary)', () => {
		const result = wrapResponse(payload, true, {}, 300);
		expect(result.statusMessage).toBe('Error');
	});

	it('should set statusMessage to OK for statusCode 299', () => {
		const result = wrapResponse(payload, true, {}, 299);
		expect(result.statusMessage).toBe('OK');
	});

	it('should set statusMessage to Error for statusCode 500', () => {
		const result = wrapResponse(payload, true, {}, 500);
		expect(result.statusMessage).toBe('Error');
	});

	it('should set statusMessage to Error for statusCode 404', () => {
		const result = wrapResponse(payload, true, {}, 404);
		expect(result.statusMessage).toBe('Error');
	});
});

// ─── buildHttpOptions — PATCH and PUT with body ───────────────────────────────

describe('buildHttpOptions — PATCH and PUT with body', () => {
	const credentials = { apiKey: 'KEY', baseUrl: 'https://shop.com/api' };

	it('should set Content-Type: application/xml for PATCH with body', () => {
		const opts = buildHttpOptions('PATCH', 'https://shop.com/api/products/1', credentials, false, 30000, '<xml/>');
		expect((opts.headers as any)['Content-Type']).toBe('application/xml');
	});

	it('should set Content-Type: application/xml for PUT with body', () => {
		const opts = buildHttpOptions('PUT', 'https://shop.com/api/products/1', credentials, false, 30000, '<xml/>');
		expect((opts.headers as any)['Content-Type']).toBe('application/xml');
	});

	it('should not set Content-Type for DELETE (no body)', () => {
		const opts = buildHttpOptions('DELETE', 'https://shop.com/api/products/1', credentials, false, 30000);
		expect((opts.headers as any)['Content-Type']).toBeUndefined();
	});
});

// ─── validateFieldsForCreate — non-1 multilingual lang suffix ────────────────

describe('validateFieldsForCreate — multilingual fields with non-1 lang suffix', () => {
	it('should accept name-2 (lang 2) as satisfying the "name" required field', () => {
		const result = validateFieldsForCreate('categories', [
			{ name: 'name-2', value: 'Catégorie FR' },
			{ name: 'id_parent', value: '2' },
		]);
		expect(result.isValid).toBe(true);
	});

	it('should accept name-10 (lang 10) as satisfying the "name" required field', () => {
		const result = validateFieldsForCreate('products', [
			{ name: 'name-10', value: 'Test' },
			{ name: 'price', value: '9.99' },
			{ name: 'id_category_default', value: '2' },
		]);
		expect(result.isValid).toBe(true);
	});

	it('should correctly split hyphenated field names (e.g. id_category_default-1 → id_category_default)', () => {
		// id_category_default-1 split by '-' → ['id_category_default', '1'] → takes first part
		const result = validateFieldsForCreate('products', [
			{ name: 'name-1', value: 'Test' },
			{ name: 'price', value: '9.99' },
			{ name: 'id_category_default-1', value: '2' },
		]);
		// id_category_default-1.split('-')[0] = 'id_category_default'
		expect(result.isValid).toBe(true);
	});
});

// ─── getFieldMappingsForResource — untested resources ────────────────────────

describe('getFieldMappingsForResource — additional resources', () => {
	it('should return mappings for addresses', () => {
		const mappings = getFieldMappingsForResource('addresses');
		expect(mappings).not.toBeNull();
		expect(mappings!.addressCity).toBe('city');
		expect(mappings!.addressFirstname).toBe('firstname');
		expect(mappings!.addressLastname).toBe('lastname');
	});

	it('should return mappings for manufacturers', () => {
		const mappings = getFieldMappingsForResource('manufacturers');
		expect(mappings).not.toBeNull();
		expect(mappings!.manufacturerName).toBe('name');
	});

	it('should return null for suppliers (not in CREATE_FIELD_MAPPINGS)', () => {
		const mappings = getFieldMappingsForResource('suppliers');
		expect(mappings).toBeNull();
	});

	it('should return mappings for customers', () => {
		const mappings = getFieldMappingsForResource('customers');
		expect(mappings).not.toBeNull();
		expect(mappings!.customerEmail).toBe('email');
		expect(mappings!.customerFirstname).toBe('firstname');
	});
});

describe('CREATE_FIELD_MAPPINGS — completeness check', () => {
	it('should define at least 5 resource entries', () => {
		expect(Object.keys(CREATE_FIELD_MAPPINGS).length).toBeGreaterThanOrEqual(5);
	});

	it('should have addresses mapping with required API field names', () => {
		const addr = CREATE_FIELD_MAPPINGS['addresses'];
		expect(addr).toBeDefined();
		expect(addr.addressAddress1).toBe('address1');
		expect(addr.addressCountryId).toBe('id_country');
		expect(addr.addressCustomerId).toBe('id_customer');
	});
});

// ─── processResponseForMode — null / undefined inputs ────────────────────────

describe('processResponseForMode — null and undefined inputs', () => {
	it('should handle null response gracefully', () => {
		const result = processResponseForMode(null, 'products');
		expect(result).toBeNull();
	});

	it('should handle undefined response gracefully', () => {
		const result = processResponseForMode(undefined, 'products');
		expect(result).toBeUndefined();
	});

	it('should handle non-prestashop object response', () => {
		const result = processResponseForMode({ success: true }, 'products');
		expect(result).toBeDefined();
	});
});

// ─── cleanErrorMessage — non-string input guard ───────────────────────────────

describe('cleanErrorMessage — non-string input guard', () => {
	it('should return a number unchanged (guard: typeof !== string)', () => {
		expect(cleanErrorMessage(42 as any)).toBe(42);
	});

	it('should return null unchanged', () => {
		expect(cleanErrorMessage(null as any)).toBeNull();
	});

	it('should return an object unchanged', () => {
		const obj = { code: 500 };
		expect(cleanErrorMessage(obj as any)).toBe(obj);
	});
});

// ─── buildCreateXml — multiple language entries for the same field ────────────

describe('buildCreateXml — multiple languages for same field', () => {
	it('should produce one <language id="1"> and one <language id="2"> within the same tag', () => {
		const xml = buildCreateXml('products', [
			{ name: 'name-1', value: 'English Name' },
			{ name: 'name-2', value: 'Nom Français' },
			{ name: 'price', value: '19.99' },
			{ name: 'id_category_default', value: '2' },
		]);
		expect(xml).toContain('<language id="1">');
		expect(xml).toContain('<language id="2">');
		expect(xml).toContain('English Name');
		expect(xml).toContain('Nom Français');
	});

	it('should group both lang entries under a single <name> tag (not two separate tags)', () => {
		const xml = buildCreateXml('products', [
			{ name: 'name-1', value: 'A' },
			{ name: 'name-2', value: 'B' },
		]);
		const openCount = (xml.match(/<name>/g) || []).length;
		const closeCount = (xml.match(/<\/name>/g) || []).length;
		expect(openCount).toBe(1);
		expect(closeCount).toBe(1);
	});

	it('should handle three languages for description field', () => {
		const xml = buildCreateXml('categories', [
			{ name: 'description-1', value: 'EN desc' },
			{ name: 'description-2', value: 'FR desc' },
			{ name: 'description-3', value: 'DE desc' },
		]);
		expect(xml).toContain('<language id="1">');
		expect(xml).toContain('<language id="3">');
	});
});

// ─── processDisplayParameter — edge cases ─────────────────────────────────────

describe('processDisplayParameter — edge cases', () => {
	it('should throw when display is "custom" but no customFields provided', () => {
		// 'display=custom' is not a valid PrestaShop value: must fail clearly
		expect(() => processDisplayParameter('custom', 'products')).toThrow(
			/requires at least one field/,
		);
	});

	it('should return "full" when display is empty string', () => {
		// '' || 'full' → 'full'
		const result = processDisplayParameter('', 'products');
		expect(result).toBe('full');
	});

	it('should throw when customFields is empty string', () => {
		expect(() => processDisplayParameter('custom', 'products', '')).toThrow(
			/requires at least one field/,
		);
	});

	it('should return the display value unchanged for an unrecognised mode', () => {
		// e.g. a future 'schema' mode passed directly → returned as-is
		const result = processDisplayParameter('schema', 'products');
		expect(result).toBe('schema');
	});
});

// ─── simplifyPrestashopResponse — xml2js single-key-object association ────────

describe('simplifyPrestashopResponse — xml2js-style single-key association', () => {
	it('should unwrap single-key object association (xml2js format)', () => {
		// xml2js produces { associations: { category: { id: ['2', '5'] } } } for single-item lists
		// but more commonly: { associations: { categories: { category: [{id:'2'}, {id:'5'}] } } }
		const raw = {
			prestashop: {
				product: {
					id: '1',
					associations: {
						categories: {
							category: [{ id: '2' }, { id: '5' }],
						},
					},
				},
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product');
		expect(result).toHaveProperty('categories');
		expect(Array.isArray(result.categories)).toBe(true);
		expect(result.categories.length).toBeGreaterThan(0);
	});

	it('should produce an empty array for falsy association value', () => {
		const raw = {
			prestashop: {
				product: {
					id: '1',
					associations: { categories: null },
				},
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product');
		expect(result.categories).toEqual([]);
	});
});

// ─── buildUrlWithFilters — numeric-zero value ─────────────────────────────────

describe('buildUrlWithFilters — numeric-zero option value', () => {
	it('should include param with value 0 (not filtered out as falsy)', () => {
		const url = buildUrlWithFilters('https://shop.com/api/products', { offset: 0, limit: 10 });
		expect(url).toContain('offset=0');
		expect(url).toContain('limit=10');
	});

	it('should exclude param with empty string value', () => {
		const url = buildUrlWithFilters('https://shop.com/api/products', { sort: '', limit: 5 });
		expect(url).not.toContain('sort=');
		expect(url).toContain('limit=5');
	});

	it('should exclude param with null value', () => {
		const url = buildUrlWithFilters('https://shop.com/api/products', { display: null, limit: 5 });
		expect(url).not.toContain('display=');
	});
});

// ─── node execute() — display='custom' URL integration ───────────────────────

describe('PrestaShop8.node execute() — display parameter in URL', () => {
	// These tests verify that the display parameter is correctly forwarded to the API URL.
	function createMock(params: Record<string, any> = {}) {
		const defaults: Record<string, any> = {
			resource: 'products',
			operation: 'list',
			id: '',
			'options.timeout': 30000,
			'options.response.neverError': false,
			'options.response.includeResponseHeaders': false,
			'options.response.rawMode': false,
			'options.request.showRequestInfo': false,
			'options.request.showRequestUrl': false,
			display: 'full',
			customFields: '',
			limit: 10,
			offset: 0,
			sort: '',
			filters: { standardFilter: [], customFilter: [] },
		};
		const merged = { ...defaults, ...params };
		return {
			getNodeParameter: jest.fn((name: string, _idx: number, def?: any) =>
				Object.prototype.hasOwnProperty.call(merged, name) ? merged[name] : def,
			),
			getCredentials: jest.fn().mockResolvedValue({ apiKey: 'KEY', baseUrl: 'https://shop.com/api' }),
			getNode: jest.fn().mockReturnValue({ name: 'PrestaShop8', type: 'prestaShop8' }),
			helpers: { httpRequest: jest.fn().mockResolvedValue({ prestashop: { products: [] } }) },
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			continueOnFail: jest.fn().mockReturnValue(false),
		};
	}

	it('should append display=full to URL when display is "full"', async () => {
		const { PrestaShop8 } = await import('../../nodes/PrestaShop8/PrestaShop8.node');
		const mock = createMock({ display: 'full' });
		const node = new PrestaShop8();
		await node.execute.call(mock as any);
		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).toContain('display=full');
	});

	it('should NOT append display param when display is "minimal"', async () => {
		const { PrestaShop8 } = await import('../../nodes/PrestaShop8/PrestaShop8.node');
		const mock = createMock({ display: 'minimal' });
		const node = new PrestaShop8();
		await node.execute.call(mock as any);
		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).not.toContain('display=');
	});

	it('should append display=[id,name,price] when display is "custom" with customFields', async () => {
		const { PrestaShop8 } = await import('../../nodes/PrestaShop8/PrestaShop8.node');
		const mock = createMock({ display: 'custom', customFields: 'id,name,price' });
		const node = new PrestaShop8();
		await node.execute.call(mock as any);
		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).toContain('display=');
		expect(decodeURIComponent(url)).toContain('[id,name,price]');
	});
});

// ─── node execute() — rawMode for update and delete ──────────────────────────

// rawMode for update and delete uses httpRequest (not axios) — unlike list/search which use axios.
// The node sends Output-Format: XML + json: false via buildHttpOptions(rawMode=true),
// then processes the response as { raw: <data> } instead of JSON-parsing it.

describe('PrestaShop8.node execute() — rawMode update', () => {
	function createRawUpdateMock() {
		const params: Record<string, any> = {
			resource: 'products',
			operation: 'update',
			id: '7',
			'options.timeout': 30000,
			'options.response.neverError': false,
			'options.response.includeResponseHeaders': false,
			'options.response.rawMode': true,
			'options.request.showRequestInfo': false,
			'options.request.showRequestUrl': false,
			display: 'full',
			customFields: '',
			'fieldsToUpdate.standardField': [{ name: 'price', value: '25.00' }],
			'fieldsToUpdate.customField': [],
			filters: { standardFilter: [], customFilter: [] },
		};
		return {
			getNodeParameter: jest.fn((name: string, _idx: number, def?: any) =>
				Object.prototype.hasOwnProperty.call(params, name) ? params[name] : def,
			),
			getCredentials: jest.fn().mockResolvedValue({ apiKey: 'KEY', baseUrl: 'https://shop.com/api' }),
			getNode: jest.fn().mockReturnValue({ name: 'PrestaShop8', type: 'prestaShop8' }),
			helpers: { httpRequest: jest.fn().mockResolvedValue({ id: '7', price: '25.00' }) },
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			continueOnFail: jest.fn().mockReturnValue(false),
		};
	}

	it('should use httpRequest (not axios) for rawMode update and return { raw: response }', async () => {
		const { PrestaShop8 } = await import('../../nodes/PrestaShop8/PrestaShop8.node');
		const mock = createRawUpdateMock();
		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(mock.helpers.httpRequest).toHaveBeenCalled();
		// rawMode → response wrapped as { raw: ... }
		expect(result[0][0].json).toHaveProperty('raw');
	});

	it('should send PATCH with Output-Format: XML header in rawMode', async () => {
		const { PrestaShop8 } = await import('../../nodes/PrestaShop8/PrestaShop8.node');
		const mock = createRawUpdateMock();
		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const call = mock.helpers.httpRequest.mock.calls[0][0];
		expect(call.method).toBe('PATCH');
		expect(call.headers['Output-Format']).toBe('XML');
		expect(call.url).toContain('/products/7');
	});
});

describe('PrestaShop8.node execute() — rawMode delete', () => {
	function createRawDeleteMock() {
		const params: Record<string, any> = {
			resource: 'products',
			operation: 'delete',
			id: '10',
			'options.timeout': 30000,
			'options.response.neverError': false,
			'options.response.includeResponseHeaders': false,
			'options.response.rawMode': true,
			'options.request.showRequestInfo': false,
			'options.request.showRequestUrl': false,
			display: 'full',
			customFields: '',
			filters: { standardFilter: [], customFilter: [] },
		};
		return {
			getNodeParameter: jest.fn((name: string, _idx: number, def?: any) =>
				Object.prototype.hasOwnProperty.call(params, name) ? params[name] : def,
			),
			getCredentials: jest.fn().mockResolvedValue({ apiKey: 'KEY', baseUrl: 'https://shop.com/api' }),
			getNode: jest.fn().mockReturnValue({ name: 'PrestaShop8', type: 'prestaShop8' }),
			helpers: { httpRequest: jest.fn().mockResolvedValue({}) },
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			continueOnFail: jest.fn().mockReturnValue(false),
		};
	}

	it('should use httpRequest for rawMode delete and include deletedId in output', async () => {
		const { PrestaShop8 } = await import('../../nodes/PrestaShop8/PrestaShop8.node');
		const mock = createRawDeleteMock();
		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(mock.helpers.httpRequest).toHaveBeenCalled();
		expect(result[0]).toBeDefined();
		expect(result[0][0].json).toHaveProperty('deletedId', '10');
	});

	it('should send DELETE with Output-Format: XML header in rawMode', async () => {
		const { PrestaShop8 } = await import('../../nodes/PrestaShop8/PrestaShop8.node');
		const mock = createRawDeleteMock();
		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const call = mock.helpers.httpRequest.mock.calls[0][0];
		expect(call.method).toBe('DELETE');
		expect(call.headers['Output-Format']).toBe('XML');
	});
});

// ─── getAvailableFields — description markers ────────────────────────────────

describe('loadOptions.getAvailableFields — description markers', () => {
	async function getAvailableFields(resource: string) {
		const { PrestaShop8 } = await import('../../nodes/PrestaShop8/PrestaShop8.node');
		const node = new PrestaShop8();
		const mock = {
			getCurrentNodeParameter: jest.fn((p: string) => (p === 'resource' ? resource : undefined)),
		};
		return node.methods.loadOptions.getAvailableFields.call(mock as any);
	}

	it('should not include any undefined markers in descriptions (schema has all flags false)', async () => {
		// The auto-generated schema sets multilang/readOnly/required to false for all fields.
		// Verify the absence logic: no spurious markers injected when flags are false.
		const fields = await getAvailableFields('products');
		for (const f of fields as any[]) {
			expect(f.description).not.toContain('undefined');
		}
	});

	it('should always include the field type in every description', async () => {
		const fields = await getAvailableFields('products');
		for (const f of fields as any[]) {
			expect(f.description).toContain('Type:');
		}
	});

	it('should not emit Multilingual/Read-only/Required markers when schema flags are all false', async () => {
		// All product schema fields have multilang:false, readOnly:false, required:false.
		// Verify none of the optional markers appear.
		const fields = await getAvailableFields('products');
		const hasMultilingual = fields.some((f: any) => f.description.includes('Multilingual'));
		const hasReadOnly = fields.some((f: any) => f.description.includes('Read-only'));
		const hasRequired = fields.some((f: any) => f.description.includes('Required'));
		expect(hasMultilingual).toBe(false);
		expect(hasReadOnly).toBe(false);
		expect(hasRequired).toBe(false);
	});

	it('should show max size constraint in description when set', async () => {
		// At least one product field should have a maxSize constraint
		const fields = await getAvailableFields('products');
		const hasMaxSize = fields.some((f: any) => f.description.includes('Max:'));
		expect(hasMaxSize).toBe(true);
	});
});

// ─── buildCreateXml / buildUpdateXml — SINGULAR_RESOURCE_MAP resources ───────

describe('buildCreateXml — SINGULAR_RESOURCE_MAP irregular plural forms', () => {
	it('should use <category> tag for categories resource', () => {
		const xml = buildCreateXml('categories', [{ name: 'name-1', value: 'Shoes' }]);
		expect(xml).toContain('<category>');
		expect(xml).toContain('</category>');
		expect(xml).not.toContain('<categories>');
	});

	it('should use <address> tag for addresses resource', () => {
		const xml = buildCreateXml('addresses', [{ name: 'city', value: 'Paris' }]);
		expect(xml).toContain('<address>');
		expect(xml).toContain('</address>');
	});

	it('should use <currency> tag for currencies resource', () => {
		const xml = buildCreateXml('currencies', [{ name: 'iso_code', value: 'USD' }]);
		expect(xml).toContain('<currency>');
		expect(xml).not.toContain('<currencies>');
	});

	it('should use <language> tag for languages resource', () => {
		const xml = buildCreateXml('languages', [{ name: 'iso_code', value: 'en' }]);
		expect(xml).toContain('<language>');
	});

	it('should use <zone> tag for zones resource', () => {
		const xml = buildCreateXml('zones', [{ name: 'name', value: 'EU' }]);
		expect(xml).toContain('<zone>');
		expect(xml).not.toContain('<zones>');
	});
});

describe('buildUpdateXml — SINGULAR_RESOURCE_MAP irregular plural forms', () => {
	it('should use <category> tag and embed the ID for categories', () => {
		const xml = buildUpdateXml('categories', '3', [{ name: 'name-1', value: 'Updated' }]);
		expect(xml).toContain('<category>');
		expect(xml).toContain('</category>');
		expect(xml).toContain('CDATA[3]');
	});

	it('should use <address> tag for addresses', () => {
		const xml = buildUpdateXml('addresses', 12, [{ name: 'city', value: 'Lyon' }]);
		expect(xml).toContain('<address>');
		expect(xml).toContain('</address>');
	});

	it('should use <country> tag for countries', () => {
		const xml = buildUpdateXml('countries', '1', [{ name: 'active', value: '1' }]);
		expect(xml).toContain('<country>');
		expect(xml).not.toContain('<countries>');
	});
});

// ─── convertResourceArray — direct coverage ───────────────────────────────────

describe('convertResourceArray', () => {
	it('should apply convertResourceTypes to every item in the array', () => {
		const input = [
			{ id: '1', price: '9.99' },
			{ id: '2', price: '19.99' },
		];
		const result = convertResourceArray(input, 'products');
		expect(result[0].id).toBe(1);
		expect(result[0].price).toBe(9.99);
		expect(result[1].id).toBe(2);
		expect(result[1].price).toBe(19.99);
	});

	it('should return the argument unchanged when it is not an array', () => {
		const notAnArray = { id: '1' } as any;
		// The function signature takes any[]; passing a non-array returns it as-is
		expect(convertResourceArray(notAnArray, 'products')).toBe(notAnArray);
	});

	it('should handle an empty array without error', () => {
		expect(convertResourceArray([], 'products')).toEqual([]);
	});

	it('should return items unchanged for an unknown resource (no schema)', () => {
		const input = [{ id: '5', name: 'x' }];
		const result = convertResourceArray(input, 'nonexistent');
		expect(result[0]).toEqual({ id: '5', name: 'x' });
	});
});

// ─── convertByFieldPattern — _id suffix ──────────────────────────────────────

describe('convertResourceTypes — _id suffix field conversion', () => {
	it('should convert field ending with _id to number', () => {
		// convertByFieldPattern: key.endsWith('_id') → convert numeric string to number
		const result = convertResourceArray([{ shop_id: '3', name: 'test' }], 'products');
		expect(result[0].shop_id).toBe(3);
		expect(typeof result[0].shop_id).toBe('number');
	});

	it('should not convert non-numeric _id suffix field', () => {
		const result = convertResourceArray([{ shop_id: 'abc' }], 'products');
		expect(result[0].shop_id).toBe('abc');
	});

	it('should convert parent_id to number', () => {
		const result = convertResourceArray([{ parent_id: '10' }], 'products');
		expect(result[0].parent_id).toBe(10);
	});
});

// ─── wrapResponse — includeHeaders=false explicit path ───────────────────────

describe('wrapResponse — includeHeaders false', () => {
	it('should return the payload directly without wrapping', () => {
		const payload = { id: 1, name: 'Test' };
		const result = wrapResponse(payload, false);
		expect(result).toBe(payload);
	});

	it('should return array payload unchanged', () => {
		const payload = [{ id: 1 }, { id: 2 }];
		const result = wrapResponse(payload, false, {}, 200);
		expect(result).toBe(payload);
	});

	it('should return null payload as-is', () => {
		expect(wrapResponse(null, false)).toBeNull();
	});
});
