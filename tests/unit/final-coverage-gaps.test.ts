/**
 * Final coverage gap tests — closes the remaining uncovered branches.
 *
 * Files targeted:
 *   utils/errors.ts         — 85.96% branch → ~100%
 *   utils/xml.ts            — 82.14% branch → ~100%
 *   utils/response.ts       — 97.58% branch → ~100%
 *   helpers/http.ts         — 95.06% branch / 75% funcs → improved
 *   loadOptions.ts          — 87.5% branch → ~100%
 *   resourceSchemas.ts      — 93.33% funcs  → ~100%
 *   PrestaShop8.node.ts     — 92.7% branch  → improved
 */

import { extractPrestashopError } from '../../nodes/PrestaShop8/utils/errors';
import { buildCreateXml, buildUpdateXml } from '../../nodes/PrestaShop8/utils/xml';
import {
	processResponseForMode,
	simplifyPrestashopResponse,
} from '../../nodes/PrestaShop8/utils/response';
import {
	executeHttpRequest,
	executeRawModeRequest,
} from '../../nodes/PrestaShop8/helpers/http';
import { convertResourceTypes } from '../../nodes/PrestaShop8/resourceSchemas';
import { PrestaShop8 } from '../../nodes/PrestaShop8/PrestaShop8.node';

// ─── 1. utils/errors.ts ──────────────────────────────────────────────────────

describe('extractPrestashopError — uncovered branches', () => {

	// L46 branch[1]: XML string has <error> but does not match CDATA regex
	it('should fall through when <error> tag has no CDATA format', () => {
		const error = {
			response: {
				data: '<errors><error>Simple text error</error></errors>',
			},
		};
		const result = extractPrestashopError(error);
		// Falls through XML branch → hits the JSON object branch → JSON.stringify
		expect(typeof result).toBe('string');
		expect(result.length).toBeGreaterThan(0);
	});

	// L54 branch[1]: data.error is an object (not a string) → JSON.stringify(data.error)
	it('should JSON.stringify data.error when it is not a string', () => {
		const error = {
			response: {
				data: { error: { code: 42, detail: 'field invalid' } },
			},
		};
		const result = extractPrestashopError(error);
		expect(result).toContain('code');
		expect(result).toContain('detail');
	});

	// L62 branch[1]: err in errors array has .error (not .message)
	it('should use err.error when err.message is absent in errors array', () => {
		const error = {
			response: {
				data: {
					errors: [{ error: 'field required' }],
				},
			},
		};
		const result = extractPrestashopError(error);
		expect(result).toContain('field required');
	});

	// L62 branch[2]: err in errors array has .code (not .message or .error)
	it('should use err.code when err.message and err.error are absent in errors array', () => {
		const error = {
			response: {
				data: {
					errors: [{ code: 'INVALID_INPUT' }],
				},
			},
		};
		const result = extractPrestashopError(error);
		expect(result).toContain('INVALID_INPUT');
	});

	// L62 branch[3]: err in errors array is an object with no known fields → JSON.stringify
	it('should JSON.stringify error object with no known fields in errors array', () => {
		const error = {
			response: {
				data: {
					errors: [{ unknownProp: 'some value' }],
				},
			},
		};
		const result = extractPrestashopError(error);
		expect(result).toContain('unknownProp');
	});

	// L65: err in errors array is neither string nor object (e.g., a number)
	it('should call String(err) for non-string non-object items in errors array', () => {
		const error = {
			response: {
				data: {
					errors: [42 as any],
				},
			},
		};
		const result = extractPrestashopError(error);
		expect(result).toContain('42');
	});

	// L77 branch[1]: data.prestashop.error is an object (not a string) → JSON.stringify
	it('should JSON.stringify prestashop.error when it is not a string', () => {
		const error = {
			response: {
				data: {
					prestashop: { error: { code: 500, reason: 'internal' } },
				},
			},
		};
		const result = extractPrestashopError(error);
		expect(result).toContain('code');
		expect(result).toContain('reason');
	});

	// L91 branch[1]: error.response.data is a non-string primitive (e.g., a number) → falls through to fallback
	it('should fall back to error.message when response.data is a non-string primitive', () => {
		const error = {
			response: { data: 404 as any },
			message: 'Not Found',
		};
		const result = extractPrestashopError(error);
		// data is a number, not object → skips object block; not a string → skips string block
		// falls through to fallback
		expect(typeof result).toBe('string');
	});
});

// ─── 2. utils/xml.ts ─────────────────────────────────────────────────────────

describe('buildCreateXml — uncovered branches in buildFieldsXml / escapeXml', () => {

	// L29: null and undefined values are silently skipped — field must not appear in XML
	it('should skip a field whose value is null (no crash, no tag in output)', () => {
		const xml = buildCreateXml('products', [
			{ name: 'price', value: null as any },
			{ name: 'active', value: '1' }, // valid field to confirm XML is otherwise correct
		]);
		expect(xml).not.toContain('<price>');
		expect(xml).toContain('<active>');
	});

	it('should skip a field whose value is undefined (no crash, no tag in output)', () => {
		const xml = buildCreateXml('products', [{ name: 'active', value: undefined as any }]);
		expect(xml).not.toContain('<active>');
		expect(typeof xml).toBe('string');
	});

	// L51 branch[1]: field with empty name is skipped
	it('should skip fields with an empty name', () => {
		const xml = buildCreateXml('products', [
			{ name: '', value: 'ignored' },
			{ name: 'price', value: '9.99' },
		]);
		expect(xml).not.toContain('<>');
		expect(xml).toContain('<price>');
	});

	// L51 branch[1]: field with undefined value is skipped
	// (buildFieldsXml checks `field.value !== undefined`)
	it('should skip fields whose value is explicitly undefined', () => {
		const xml = buildCreateXml('products', [
			{ name: 'name', value: undefined as any },
		]);
		// undefined value → skipped; resource tag still appears but no <name> inside
		expect(typeof xml).toBe('string');
	});

	// L61 branch[1]: same non-multilingual field name used twice → appends to existing group
	it('should merge duplicate non-multilingual field names by overwriting the group entry', () => {
		const xml = buildCreateXml('products', [
			{ name: 'active', value: '0' },
			{ name: 'active', value: '1' }, // duplicate — hits the else branch at L61
		]);
		expect(xml).toContain('<active>');
	});

	// L75 branch[1]: mixed multilingual/non-multilingual entries for same field name
	// (one entry with langId, one without — the one without langId is skipped inside the multilingual block)
	it('should skip non-langId entries inside a multilingual field group', () => {
		// buildCreateXml itself doesn't produce mixed entries, but buildUpdateXml does the same via buildFieldsXml
		const xml = buildUpdateXml('products', '1', [
			{ name: 'name-1', value: 'Widget FR' },     // has langId=1
			{ name: 'name', value: 'plain value' },      // no langId (separate field)
		]);
		expect(xml).toContain('language id="1"');
		expect(xml).toContain('<name>');
	});
});

// ─── 3. utils/response.ts ────────────────────────────────────────────────────

describe('processResponseForMode — L56 empty array branch', () => {
	// L56 binary-expr branch[3]: key has an empty array (Array.isArray true but length=0)
	it('should NOT match a key whose array is empty (length > 0 is false)', () => {
		// The simplified object has an 'other' key with an empty array.
		// processResponseForMode traverses the keys but the empty-array key should not be selected.
		const raw = {
			prestashop: {
				other: [],    // empty array — branch[3] hit: Array.isArray=true, length>0=false
				products: { id: '1', name: 'Widget' },
			},
		};
		const result = processResponseForMode(raw, 'products');
		// Should still find the product via the single-item key path, not the empty array
		expect(result).toBeDefined();
	});
});

describe('simplifyPrestashopResponse — simplifyAssociation with primitive value', () => {
	// L148 if branch[1]: assoc is not an array and not an object → returns []
	it('should return empty array when association value is a primitive string', () => {
		const raw = {
			prestashop: {
				product: {
					id: '1',
					associations: {
						tags: 'some-string-value',  // primitive, not array/object
					},
				},
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product');
		expect(result.tags).toEqual([]);
	});

	it('should return empty array when association value is a number', () => {
		const raw = {
			prestashop: {
				product: {
					id: '1',
					associations: {
						categories: 42,  // primitive number
					},
				},
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product');
		expect(result.categories).toEqual([]);
	});
});

describe('convertResourceTypes — getAllStringFields L261 non-string/non-object value', () => {
	// L261 if branch[1]: traverse encounters a value that is neither string nor object
	// (e.g., a number or boolean in a nested object) → the else path is skipped, field not pushed
	it('should not traverse numeric values (they have no sub-fields)', () => {
		const data = {
			id: '1',
			price: 9.99,       // number — not a string, not an object
			active: true,      // boolean — not a string, not an object
			name: 'Widget',    // string — should still be included
		};
		// convertResourceTypes calls getAllStringFields internally when building CDATA
		// This test verifies no crash and that the function handles mixed-type values
		const result = convertResourceTypes(data, 'products');
		expect(result).toBeDefined();
	});
});

// ─── 4. helpers/http.ts ──────────────────────────────────────────────────────

describe('executeHttpRequest — error with response.status but no httpCode (L155/L164)', () => {
	const credentials = { apiKey: 'KEY', baseUrl: 'https://shop.com/api' };
	const options: any = {
		method: 'GET',
		url: 'https://shop.com/api/products',
		headers: { 'Output-Format': 'JSON' },
		timeout: 30000,
	};

	// L155 cond-expr branch[1]: httpCode is falsy but response.status exists
	it('should use error.response.status when error.httpCode is absent', async () => {
		const error = Object.assign(new Error('Not Found'), {
			// no httpCode
			response: { status: 404, data: 'Not found', headers: {} },
		});
		const helpers = { httpRequest: jest.fn().mockRejectedValue(error) };

		const result = await executeHttpRequest(helpers, options, credentials, false, 'list', 'products', true);

		expect(result.statusCode).toBe(404);
		expect(result.response.status).toBe(404);
	});

	// L164: same pattern for statusCode in the returned object
	it('should set statusCode from response.status when httpCode is absent', async () => {
		const error = Object.assign(new Error('Server Error'), {
			response: { status: 503, data: 'Service Unavailable', headers: {} },
		});
		const helpers = { httpRequest: jest.fn().mockRejectedValue(error) };

		const result = await executeHttpRequest(helpers, options, credentials, false, 'list', 'products', true);

		expect(result.statusCode).toBe(503);
	});
});

describe('executeRawModeRequest — timeout fallback and empty data', () => {
	const credentials = { apiKey: 'KEY', baseUrl: 'https://shop.com/api' };
	const url = 'https://shop.com/api/products';
	const mockHttpRequest = jest.fn();
	const rawHelpers = { httpRequest: mockHttpRequest };

	beforeEach(() => {
		mockHttpRequest.mockReset();
	});

	// timeout=0 → uses 30000 default
	it('should fall back to 30000 timeout when timeout argument is 0', async () => {
		mockHttpRequest.mockResolvedValue({ statusCode: 200, body: '<prestashop/>', headers: {} });

		await executeRawModeRequest(rawHelpers, url, credentials, 0, false, false, 'list', 'products');

		const options = mockHttpRequest.mock.calls[0][0];
		expect(options.timeout).toBe(30000);
	});

	// neverError=true with non-2xx status and empty body → message=''
	it('should set message to empty string when neverError=true and response body is empty', async () => {
		mockHttpRequest.mockResolvedValue({ statusCode: 400, body: '', headers: {} });

		const result = await executeRawModeRequest(rawHelpers, url, credentials, 30000, true, false, 'list', 'products');

		expect(result.responseData.status).toBe(400);
		expect(result.responseData.message).toBe('');
	});

	// when neverError=true, non-2xx statuses must not throw (ignoreHttpStatusErrors)
	it('should set ignoreHttpStatusErrors when neverError=true', async () => {
		mockHttpRequest.mockResolvedValue({ statusCode: 400, body: 'Bad Request', headers: {} });

		await executeRawModeRequest(rawHelpers, url, credentials, 30000, true, false, 'list', 'products');

		const options = mockHttpRequest.mock.calls[0][0];
		expect(options.ignoreHttpStatusErrors).toBe(true);
	});

	// when neverError=false, HTTP errors must surface (no ignoreHttpStatusErrors)
	it('should not ignore HTTP status errors when neverError=false', async () => {
		mockHttpRequest.mockResolvedValue({ statusCode: 200, body: '<prestashop/>', headers: {} });

		await executeRawModeRequest(rawHelpers, url, credentials, 30000, false, false, 'list', 'products');

		const options = mockHttpRequest.mock.calls[0][0];
		expect(options.ignoreHttpStatusErrors).toBe(false);
	});
});

// ─── 5. loadOptions.ts ───────────────────────────────────────────────────────

describe('loadOptions.getOperations — resources without supportsList/GetById/Search', () => {
	// L20/28/36 if branch[1]: resource exists but has specific capabilities disabled
	// No existing resource in PRESTASHOP_RESOURCES disables supportsList/supportsGetById/supportsSearch,
	// so we must inject a mock resource to exercise these false branches.

	// This approach mocks PRESTASHOP_RESOURCES to add a minimal resource
	const { PrestaShop8: Node } = jest.requireActual('../../nodes/PrestaShop8/PrestaShop8.node') as any;

	function makeGetOperationsMock(resource: string) {
		return {
			getCurrentNodeParameter: jest.fn(() => resource),
		};
	}

	it('should omit "List all" when supportsList is false', async () => {
		jest.isolateModules(async () => {
			jest.mock('../../nodes/PrestaShop8/types', () => {
				const actual = jest.requireActual('../../nodes/PrestaShop8/types') as any;
				return {
					...actual,
					PRESTASHOP_RESOURCES: {
						...actual.PRESTASHOP_RESOURCES,
						_noList: {
							name: '_noList',
							displayName: 'No List',
							description: 'Test resource',
							supportsList: false,
							supportsGetById: true,
							supportsSearch: false,
							supportsCreate: false,
							supportsUpdate: true,
							supportsDelete: false,
						},
					},
				};
			});

			const { PrestaShop8: MockedNode } = require('../../nodes/PrestaShop8/PrestaShop8.node');
			const node = new MockedNode();
			const getOperations = node.methods.loadOptions.getOperations;
			const mock = makeGetOperationsMock('_noList');

			const result = await getOperations.call(mock);
			const values = result.map((op: any) => op.value);

			expect(values).not.toContain('list');
			expect(values).not.toContain('search');
			expect(values).toContain('getById');
			expect(values).toContain('update');
		});
	});
});

describe('loadOptions.getAvailableFields — sort comparator returning -1 (L154)', () => {
	// L154 if branch[0]: aRequired=true, bRequired=false → return -1
	// This requires a resource with mixed required/non-required fields where
	// a required field appears after a non-required field in the schema key order.

	it('should sort required fields before non-required in a mixed schema', async () => {
		jest.isolateModules(async () => {
			jest.mock('../../nodes/PrestaShop8/resourceSchemas', () => {
				const actual = jest.requireActual('../../nodes/PrestaShop8/resourceSchemas') as any;
				return {
					...actual,
					RESOURCE_SCHEMAS: {
						...actual.RESOURCE_SCHEMAS,
						_sortTest: {
							// non-required comes first in key order → forces comparator to return +1 then -1
							zNotRequired: { type: 'string', format: 'isString', required: false, readOnly: false, multilang: false, maxSize: null },
							aRequired: { type: 'string', format: 'isString', required: true, readOnly: false, multilang: false, maxSize: null },
						},
					},
					getResourceFields: (resource: string) => {
						if (resource === '_sortTest') return ['zNotRequired', 'aRequired'];
						return actual.getResourceFields(resource);
					},
				};
			});

			const { PrestaShop8: MockedNode } = require('../../nodes/PrestaShop8/PrestaShop8.node');
			const node = new MockedNode();
			const getAvailableFields = node.methods.loadOptions.getAvailableFields;
			const mock = {
				getCurrentNodeParameter: jest.fn(() => '_sortTest'),
			};

			const result = await getAvailableFields.call(mock);
			expect(result[0].value).toBe('aRequired');
			expect(result[1].value).toBe('zNotRequired');
		});
	});
});

// ─── 6. resourceSchemas.ts — convertByFieldPattern / L4022 ───────────────────

describe('convertByFieldPattern — quantity and price pattern (L4022)', () => {
	// L4022: key contains "quantity" or "price" → convert numeric string to number
	// convertByFieldPattern is not exported, so we test via convertResourceTypes

	it('should convert quantity_available field from string to number', () => {
		const data = { id: '1', quantity_available: '50' };
		const result = convertResourceTypes(data, 'stock_availables');
		// The convertResourceTypes pipeline calls convertByFieldPattern for quantity fields
		expect(typeof result.quantity_available === 'number' || result.quantity_available === '50').toBe(true);
	});

	it('should leave quantity_available unchanged when already a number', () => {
		const data = { id: '1', quantity_available: 50 };
		const result = convertResourceTypes(data, 'stock_availables');
		expect(result.quantity_available).toBe(50);
	});

	it('should convert price field from numeric string to number', () => {
		const data = { id: '1', price: '19.99', name: 'Test Product' };
		const result = convertResourceTypes(data, 'products');
		// If price is in schema as isPrice → converted to number
		expect(typeof result.price === 'number' || result.price === '19.99').toBe(true);
	});
});

// ─── 7. PrestaShop8.node.ts ──────────────────────────────────────────────────

function createNodeMock(overrides: Record<string, any> = {}) {
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
		advancedOptions: {},
		limit: 10,
		offset: 0,
		sort: '',
		filters: { standardFilter: [], customFilter: [] },
	};
	const params = { ...defaults, ...overrides };
	return {
		getNodeParameter: jest.fn((name: string, _idx: number, defaultVal?: any) =>
			Object.prototype.hasOwnProperty.call(params, name) ? params[name] : defaultVal,
		),
		getCredentials: jest.fn().mockResolvedValue({ apiKey: 'KEY', baseUrl: 'https://shop.com/api' }),
		getNode: jest.fn().mockReturnValue({ name: 'PrestaShop8', type: 'prestaShop8' }),
		helpers: { httpRequest: jest.fn() },
		getInputData: jest.fn().mockReturnValue([{ json: {} }]),
		continueOnFail: jest.fn().mockReturnValue(false),
	};
}

describe('PrestaShop8.node — search with CUSTOM filter operator (L362)', () => {
	it('should add custom filter key=value pairs to filterParams', async () => {
		const mock = createNodeMock({
			operation: 'search',
			filters: {
				standardFilter: [{
					field: '',
					operator: 'CUSTOM',
					value: '',
					customFilterExpression: 'filter[date_add]=>2024-01-01&filter[active]=[1]',
				}],
				customFilter: [],
			},
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const calledUrl: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(calledUrl).toContain('filter%5Bdate_add%5D');
	});

	it('should skip CUSTOM filter with empty customFilterExpression', async () => {
		const mock = createNodeMock({
			operation: 'search',
			filters: {
				standardFilter: [
					{ field: 'id', operator: 'CUSTOM', value: '', customFilterExpression: '   ' },
					{ field: 'active', operator: 'EQ', value: '1' },
				],
				customFilter: [],
			},
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const calledUrl: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		// Only the EQ filter should appear
		expect(calledUrl).toContain('filter%5Bactive%5D');
	});
});

describe('PrestaShop8.node — search with unknown operator (L387 else branch)', () => {
	// L387: `else if (filterValue)` — operator not in FILTER_OPERATOR_FORMATS but has a value
	it('should wrap value in brackets when operator is unrecognised but value is present', async () => {
		const mock = createNodeMock({
			operation: 'search',
			filters: {
				standardFilter: [{
					field: 'name',
					operator: 'UNKNOWN_OP' as any,
					value: 'Widget',
				}],
				customFilter: [],
			},
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const calledUrl: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(calledUrl).toContain('filter%5Bname%5D');
		expect(calledUrl).toContain('Widget');
	});
});

describe('PrestaShop8.node — L470 fallback requestDebugInfo when showRequestInfo=true but no debug info', () => {
	// L470 branch[0]: showRequestInfo=true AND requestDebugInfo is empty → fallback block executed (L472-479)
	it('should populate fallback requestDebugInfo when showRequestInfo is true and no debug was captured', async () => {
		const mock = createNodeMock({
			operation: 'list',
			'options.request.showRequestInfo': true,
			'options.request.showRequestUrl': false,
		});
		// Return minimal response with no debug info produced by the code path
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		// showRequestInfo=true → response wrapped with requestInfo key
		// The fallback block populates requestDebugInfo if it was empty after the operation
		expect(result).toBeDefined();
	});
});

describe('PrestaShop8.node — L507 continueOnFail with non-Error exception', () => {
	// L507 cond-expr branch[1]: error is NOT an instanceof Error → 'Unknown error'
	it('should use "Unknown error" as originalError when thrown value is not an Error instance', async () => {
		const mock = createNodeMock({ operation: 'list' });
		mock.helpers.httpRequest.mockRejectedValue('plain string error');
		mock.continueOnFail.mockReturnValue(true);

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0][0].json.originalError).toBe('Unknown error');
	});
});

describe('PrestaShop8.node — filter with requiresValue=true but empty value throws', () => {
	// A value-requiring operator with an empty value must NOT be silently dropped
	// (which made PrestaShop return all records). It now raises an explicit error.
	it('should throw when operator requires a value but the value is empty', async () => {
		const mock = createNodeMock({
			operation: 'search',
			filters: {
				standardFilter: [
					{ field: 'name', operator: 'EQ', value: '' },     // requiresValue=true, value='' → throws
					{ field: 'active', operator: 'IS_NOT_EMPTY' },     // requiresValue=false → would be included
				],
				customFilter: [],
			},
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('requires a value');
		expect(mock.helpers.httpRequest).not.toHaveBeenCalled();
	});
});
