/**
 * Advanced execute() coverage: rawMode, showRequestInfo/Url, includeResponseHeaders,
 * URL normalisation, delete edge cases, unsupported operation.
 */

import { PrestaShop8 } from '../../nodes/PrestaShop8/PrestaShop8.node';

function createExecuteMock(overrides: Record<string, any> = {}) {
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
		getNodeParameter: jest.fn((name: string, _index: number, defaultValue?: any) => {
			if (Object.prototype.hasOwnProperty.call(params, name)) return params[name];
			return defaultValue;
		}),
		getCredentials: jest.fn().mockResolvedValue({
			apiKey: 'TESTKEY',
			baseUrl: 'https://shop.com',
		}),
		getNode: jest.fn().mockReturnValue({ name: 'PrestaShop8', type: 'prestaShop8' }),
		helpers: {
			httpRequest: jest.fn(),
		},
		getInputData: jest.fn().mockReturnValue([{ json: {} }]),
		continueOnFail: jest.fn().mockReturnValue(false),
	};
}

// ─── URL normalisation ────────────────────────────────────────────────────────

describe('PrestaShop8.node execute() — URL normalisation', () => {
	it('should add /api suffix when baseUrl does not end with /api', async () => {
		const mock = createExecuteMock({ operation: 'list' });
		mock.getCredentials.mockResolvedValue({ apiKey: 'KEY', baseUrl: 'https://shop.com' });
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).toContain('/api/');
	});

	it('should strip trailing slash before checking /api suffix', async () => {
		const mock = createExecuteMock({ operation: 'list' });
		mock.getCredentials.mockResolvedValue({ apiKey: 'KEY', baseUrl: 'https://shop.com/api/' });
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		// After stripping trailing slash we get /api, no /api/api duplication
		expect(url).not.toMatch(/\/api\/api/);
		expect(url).toContain('/api/');
	});

	it('should not duplicate /api when baseUrl already ends with /api', async () => {
		const mock = createExecuteMock({ operation: 'list' });
		mock.getCredentials.mockResolvedValue({ apiKey: 'KEY', baseUrl: 'https://shop.com/api' });
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		const apiCount = (url.match(/\/api/g) || []).length;
		expect(apiCount).toBe(1);
	});
});

// ─── rawMode — list ───────────────────────────────────────────────────────────

describe('PrestaShop8.node execute() — rawMode list', () => {
	it('should request an unparsed text body and return raw XML string', async () => {
		const rawXml = '<?xml version="1.0"?><prestashop><products/></prestashop>';
		const mock = createExecuteMock({ operation: 'list', 'options.response.rawMode': true });
		mock.helpers.httpRequest.mockResolvedValue({ statusCode: 200, body: rawXml, headers: {} });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(mock.helpers.httpRequest).toHaveBeenCalledTimes(1);
		const options = mock.helpers.httpRequest.mock.calls[0][0];
		expect(options.json).toBe(false);
		expect(options.encoding).toBe('text');
		expect(result[0][0].json).toHaveProperty('raw', rawXml);
	});

	it('should not append output_format=JSON in raw mode URL', async () => {
		const mock = createExecuteMock({ operation: 'list', 'options.response.rawMode': true });
		mock.helpers.httpRequest.mockResolvedValue({ statusCode: 200, body: '<prestashop/>', headers: {} });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const calledUrl: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(calledUrl).not.toContain('output_format=JSON');
	});
});

// ─── rawMode — getById ────────────────────────────────────────────────────────

describe('PrestaShop8.node execute() — rawMode getById', () => {
	it('should return { raw: response } without JSON processing', async () => {
		const rawResponse = { some: 'xml-parsed-data' };
		const mock = createExecuteMock({
			operation: 'getById',
			id: '5',
			'options.response.rawMode': true,
		});
		mock.helpers.httpRequest.mockResolvedValue(rawResponse);

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0][0].json).toHaveProperty('raw', rawResponse);
	});
});

// ─── rawMode — create ─────────────────────────────────────────────────────────

describe('PrestaShop8.node execute() — rawMode create', () => {
	it('should skip field validation when rawMode is true', async () => {
		// No fields provided — would normally throw "At least one field"
		const mock = createExecuteMock({
			operation: 'create',
			'options.response.rawMode': true,
			'fieldsToCreate.standardField': [],
			'fieldsToCreate.customField': [],
		});
		mock.helpers.httpRequest.mockResolvedValue({ id: '1' });

		const node = new PrestaShop8();
		// Should NOT throw even though no fields are provided
		await expect(node.execute.call(mock as any)).resolves.toBeDefined();
	});

	it('should skip required-field validation when rawMode is true', async () => {
		// Products missing price and id_category_default — normally invalid
		const mock = createExecuteMock({
			operation: 'create',
			resource: 'products',
			'options.response.rawMode': true,
			'fieldsToCreate.standardField': [{ name: 'name-1', value: 'Only Name' }],
			'fieldsToCreate.customField': [],
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { product: { id: '1' } } });

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).resolves.toBeDefined();
	});

	it('should return { raw: response } in create rawMode', async () => {
		const rawResponse = '<prestashop><product><id>10</id></product></prestashop>';
		const mock = createExecuteMock({
			operation: 'create',
			resource: 'manufacturers',
			'options.response.rawMode': true,
			'fieldsToCreate.standardField': [{ name: 'name', value: 'Acme' }],
			'fieldsToCreate.customField': [],
		});
		mock.helpers.httpRequest.mockResolvedValue(rawResponse);

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0][0].json).toHaveProperty('raw', rawResponse);
	});
});

// ─── rawMode — search ─────────────────────────────────────────────────────────

describe('PrestaShop8.node execute() — rawMode search', () => {
	it('should return raw XML for rawMode search', async () => {
		const rawXml = '<prestashop><products/></prestashop>';
		const mock = createExecuteMock({
			operation: 'search',
			'options.response.rawMode': true,
			filters: {
				standardFilter: [{ field: 'active', operator: '=', value: '1' }],
				customFilter: [],
			},
		});
		mock.helpers.httpRequest.mockResolvedValue({ statusCode: 200, body: rawXml, headers: {} });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(mock.helpers.httpRequest).toHaveBeenCalledTimes(1);
		expect(result[0][0].json).toHaveProperty('raw', rawXml);
	});
});

// ─── showRequestUrl ───────────────────────────────────────────────────────────

describe('PrestaShop8.node execute() — showRequestUrl', () => {
	it('should include requestUrl in output when showRequestUrl is true', async () => {
		const mock = createExecuteMock({
			operation: 'list',
			'options.request.showRequestUrl': true,
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0][0].json).toHaveProperty('requestUrl');
		expect(typeof result[0][0].json.requestUrl).toBe('string');
	});

	it('should wrap data under "data" key when showRequestUrl is true', async () => {
		const mock = createExecuteMock({
			operation: 'list',
			'options.request.showRequestUrl': true,
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [{ id: '1' }] } });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0][0].json).toHaveProperty('data');
	});

	it('should NOT include requestUrl when showRequestUrl is false', async () => {
		const mock = createExecuteMock({ operation: 'list', 'options.request.showRequestUrl': false });
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [{ id: '1' }] } });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0][0].json).not.toHaveProperty('requestUrl');
	});
});

// ─── showRequestInfo ──────────────────────────────────────────────────────────

describe('PrestaShop8.node execute() — showRequestInfo', () => {
	it('should include requestInfo in output when showRequestInfo is true', async () => {
		const mock = createExecuteMock({
			operation: 'list',
			'options.request.showRequestInfo': true,
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0][0].json).toHaveProperty('requestInfo');
		expect(result[0][0].json).toHaveProperty('data');
	});

	it('should include both requestUrl and requestInfo when both flags are true', async () => {
		const mock = createExecuteMock({
			operation: 'list',
			'options.request.showRequestUrl': true,
			'options.request.showRequestInfo': true,
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0][0].json).toHaveProperty('requestUrl');
		expect(result[0][0].json).toHaveProperty('requestInfo');
	});
});

// ─── includeResponseHeaders ───────────────────────────────────────────────────

describe('PrestaShop8.node execute() — includeResponseHeaders', () => {
	it('should wrap list response with body/headers/statusCode when flag is true', async () => {
		const mock = createExecuteMock({
			operation: 'list',
			'options.response.includeResponseHeaders': true,
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		const json = result[0][0].json;
		expect(json).toHaveProperty('body');
		expect(json).toHaveProperty('headers');
		expect(json).toHaveProperty('statusCode');
	});

	it('should return unwrapped response when includeResponseHeaders is false', async () => {
		const mock = createExecuteMock({
			operation: 'list',
			'options.response.includeResponseHeaders': false,
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [{ id: '1' }] } });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0][0].json).not.toHaveProperty('statusCode');
	});
});

// ─── delete edge cases ────────────────────────────────────────────────────────

describe('PrestaShop8.node execute() — delete edge cases', () => {
	it('should throw when id is missing', async () => {
		const mock = createExecuteMock({ operation: 'delete', id: '' });

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('ID required');
	});

	it('should return success payload with deletedId on successful delete', async () => {
		const mock = createExecuteMock({ operation: 'delete', id: '99' });
		mock.helpers.httpRequest.mockResolvedValue({});

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		const json = result[0][0].json as any;
		expect(json.success).toBe(true);
		expect(json.deletedId).toBe('99');
		expect(typeof json.message).toBe('string');
	});
});

// ─── unsupported operation ────────────────────────────────────────────────────

describe('PrestaShop8.node execute() — unsupported operation', () => {
	it('should throw NodeOperationError for unknown operation', async () => {
		const mock = createExecuteMock({ operation: 'export' });

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('not supported');
	});
});

// ─── create operation ────────────────────────────────────────────────────────

describe('PrestaShop8.node execute() — create', () => {
	it('should call httpRequest with POST method and XML body', async () => {
		const mock = createExecuteMock({
			operation: 'create',
			resource: 'zones',
			'fieldsToCreate.standardField': [],
			'fieldsToCreate.customField': [
				{ name: 'name', value: 'Test Zone' },
				{ name: 'active', value: '1' },
			],
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { zone: { id: '10', name: 'Test Zone', active: '1' } } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const call = mock.helpers.httpRequest.mock.calls[0][0];
		expect(call.method).toBe('POST');
		expect(call.url).toContain('/zones');
		expect(typeof call.body).toBe('string');
		expect(call.body).toContain('<?xml');
		expect(call.body).toContain('Test Zone');
	});

	it('should throw when no fields are provided', async () => {
		const mock = createExecuteMock({
			operation: 'create',
			resource: 'zones',
			'fieldsToCreate.standardField': [],
			'fieldsToCreate.customField': [],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('At least one field');
	});

	it('should throw when a field has no name', async () => {
		const mock = createExecuteMock({
			operation: 'create',
			resource: 'zones',
			'fieldsToCreate.standardField': [],
			'fieldsToCreate.customField': [{ name: '', value: 'test' }],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow();
	});

	it('should throw when a required field is missing', async () => {
		const mock = createExecuteMock({
			operation: 'create',
			resource: 'zones',
			'fieldsToCreate.standardField': [],
			// Missing 'active' (required for zones)
			'fieldsToCreate.customField': [{ name: 'name', value: 'Zone' }],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow(/Missing required fields/);
	});

	it('should skip all validation and call httpRequest in rawMode', async () => {
		const rawResp = '<prestashop><zone/></prestashop>';
		const mock = createExecuteMock({
			operation: 'create',
			resource: 'zones',
			'options.response.rawMode': true,
			'fieldsToCreate.standardField': [],
			'fieldsToCreate.customField': [], // empty — OK in rawMode
		});
		mock.helpers.httpRequest.mockResolvedValue(rawResp);

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(mock.helpers.httpRequest).toHaveBeenCalledTimes(1);
		expect(result[0][0].json).toHaveProperty('raw', rawResp);
	});

	it('should only use customField for images resource', async () => {
		const mock = createExecuteMock({
			operation: 'create',
			resource: 'images',
			'fieldsToCreate.standardField': [{ name: 'shouldBeIgnored', value: 'x' }],
			'fieldsToCreate.customField': [{ name: 'id_product', value: '5' }],
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { image: { id: '1' } } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const call = mock.helpers.httpRequest.mock.calls[0][0];
		expect(call.body).toContain('id_product');
		expect(call.body).not.toContain('shouldBeIgnored');
	});
});

// ─── update operation ────────────────────────────────────────────────────────

describe('PrestaShop8.node execute() — update', () => {
	it('should call httpRequest with PATCH method and XML body containing the ID', async () => {
		const mock = createExecuteMock({
			operation: 'update',
			id: '7',
			'fieldsToUpdate.standardField': [],
			'fieldsToUpdate.customField': [{ name: 'active', value: '0' }],
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { product: { id: '7', active: '0' } } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const call = mock.helpers.httpRequest.mock.calls[0][0];
		expect(call.method).toBe('PATCH');
		expect(call.url).toContain('/products/7');
		expect(call.body).toContain('<id>');
		expect(call.body).toContain('CDATA[7]');
	});

	it('should throw when no update fields are provided', async () => {
		const mock = createExecuteMock({
			operation: 'update',
			id: '7',
			'fieldsToUpdate.standardField': [],
			'fieldsToUpdate.customField': [],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('At least one field');
	});

	it('should throw when id is missing', async () => {
		const mock = createExecuteMock({
			operation: 'update',
			id: '',
			'fieldsToUpdate.standardField': [],
			'fieldsToUpdate.customField': [{ name: 'active', value: '1' }],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('ID required');
	});

	it('should throw when a field has no name', async () => {
		const mock = createExecuteMock({
			operation: 'update',
			id: '7',
			'fieldsToUpdate.standardField': [],
			'fieldsToUpdate.customField': [{ name: '', value: 'test' }],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow();
	});
});

// ─── search operation (non-rawMode) ──────────────────────────────────────────

describe('PrestaShop8.node execute() — search (non-rawMode)', () => {
	it('should append filter parameters to URL', async () => {
		const mock = createExecuteMock({
			operation: 'search',
			filters: {
				standardFilter: [{ field: 'active', operator: 'EQ', value: '1' }],
				customFilter: [],
			},
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [{ id: '1' }] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).toContain('filter%5Bactive%5D');
	});

	it('should throw NodeOperationError when filters array is empty', async () => {
		const mock = createExecuteMock({
			operation: 'search',
			filters: { standardFilter: [], customFilter: [] },
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow(/filter/i);
	});

	it('should handle CUSTOM operator by splitting key=value pairs', async () => {
		const mock = createExecuteMock({
			operation: 'search',
			filters: {
				standardFilter: [],
				customFilter: [{ field: '', operator: 'CUSTOM', customFilterExpression: 'date=1&filter[name]=test' }],
			},
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(decodeURIComponent(url)).toContain('date=1');
	});

	it('should handle IS_EMPTY operator (no value required)', async () => {
		const mock = createExecuteMock({
			operation: 'search',
			filters: {
				standardFilter: [{ field: 'description', operator: 'IS_EMPTY', value: '' }],
				customFilter: [],
			},
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(decodeURIComponent(url)).toContain('filter[description]=[]');
	});

	it('should read filtersImages param for images resource', async () => {
		const mock = createExecuteMock({
			operation: 'search',
			resource: 'images',
			filtersImages: {
				customFilter: [{ field: 'id_product', operator: 'EQ', value: '42' }],
			},
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { images: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(decodeURIComponent(url)).toContain('filter[id_product]');
	});
});

// ─── continueOnFail ───────────────────────────────────────────────────────────

describe('PrestaShop8.node execute() — continueOnFail', () => {
	it('should push error as output item instead of throwing when continueOnFail is true', async () => {
		const mock = createExecuteMock({ operation: 'list' });
		mock.helpers.httpRequest.mockRejectedValue(new Error('Network timeout'));
		mock.continueOnFail.mockReturnValue(true);

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0]).toHaveLength(1);
		const item = result[0][0].json as any;
		expect(item).toHaveProperty('error');
		expect(item).toHaveProperty('resource', 'products');
		expect(item).toHaveProperty('operation', 'list');
		expect(item).toHaveProperty('originalError');
	});
});

// ─── list with dateFormat option ─────────────────────────────────────────────

describe('PrestaShop8.node execute() — list with dateFormat', () => {
	it('should append date=1 to URL when advancedOptions.dateFormat is true', async () => {
		const mock = createExecuteMock({
			operation: 'list',
			advancedOptions: { dateFormat: true },
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).toContain('date=1');
	});

	it('should NOT append date param when dateFormat is false/absent', async () => {
		const mock = createExecuteMock({
			operation: 'list',
			advancedOptions: {},
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).not.toMatch(/[?&]date=/);
	});
});
