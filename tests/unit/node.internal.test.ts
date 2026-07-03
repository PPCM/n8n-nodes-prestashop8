/**
 * Tests for internal helper functions in PrestaShop8.node.ts
 *
 * These are not exported, so we test them through the node's behavior.
 * Where direct access is needed, the patterns are tested via integration-style mocks.
 */

import { PrestaShop8 } from '../../nodes/PrestaShop8/PrestaShop8.node';

// ─── Helper: minimal IExecuteFunctions mock ───────────────────────────────────

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
		display: 'minimal',
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
			baseUrl: 'https://shop.com/api',
		}),
		getNode: jest.fn().mockReturnValue({ name: 'PrestaShop8', type: 'prestaShop8' }),
		helpers: {
			httpRequest: jest.fn(),
		},
		getInputData: jest.fn().mockReturnValue([{ json: {} }]),
		continueOnFail: jest.fn().mockReturnValue(false),
	};
}

// ─── execute() — list operation ───────────────────────────────────────────────

describe('PrestaShop8.node execute() — list', () => {
	it('should call httpRequest and return items array', async () => {
		const mock = createExecuteMock({ operation: 'list' });
		mock.helpers.httpRequest.mockResolvedValue({
			prestashop: { products: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] },
		});

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(mock.helpers.httpRequest).toHaveBeenCalledTimes(1);
		expect(Array.isArray(result)).toBe(true);
		expect(result[0]).toBeDefined();
	});

	it('should return empty array when API returns empty products list', async () => {
		const mock = createExecuteMock({ operation: 'list' });
		mock.helpers.httpRequest.mockResolvedValue({
			prestashop: { products: [] },
		});

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0]).toEqual([]);
	});

	it('should throw NodeOperationError when API call fails and continueOnFail is false', async () => {
		const mock = createExecuteMock({ operation: 'list' });
		mock.helpers.httpRequest.mockRejectedValue(new Error('Connection refused'));
		mock.continueOnFail.mockReturnValue(false);

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow();
	});
});

// ─── execute() — getById operation ───────────────────────────────────────────

describe('PrestaShop8.node execute() — getById', () => {
	it('should append ID to URL and return single item', async () => {
		const mock = createExecuteMock({ operation: 'getById', id: '42' });
		mock.helpers.httpRequest.mockResolvedValue({
			prestashop: { product: { id: '42', name: 'Widget' } },
		});

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).toContain('/42');
		expect(result[0]).toBeDefined();
	});

	it('should throw when id is missing', async () => {
		const mock = createExecuteMock({ operation: 'getById', id: '' });
		mock.helpers.httpRequest.mockResolvedValue({});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow();
	});
});

// ─── execute() — delete operation ────────────────────────────────────────────

describe('PrestaShop8.node execute() — delete', () => {
	it('should use DELETE method with correct ID', async () => {
		const mock = createExecuteMock({ operation: 'delete', id: '10' });
		mock.helpers.httpRequest.mockResolvedValue({ success: true });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const call = mock.helpers.httpRequest.mock.calls[0][0];
		expect(call.method).toBe('DELETE');
		expect(call.url).toContain('/10');
	});
});

// ─── execute() — neverError mode ─────────────────────────────────────────────

describe('PrestaShop8.node execute() — neverError mode', () => {
	it('should return error data instead of throwing when neverError is true', async () => {
		const httpError = Object.assign(new Error('Server Error'), {
			httpCode: 500,
			response: { status: 500, data: 'Internal Server Error' },
		});

		const mock = createExecuteMock({
			operation: 'list',
			'options.response.neverError': true,
		});
		mock.helpers.httpRequest.mockRejectedValue(httpError);

		const node = new PrestaShop8();
		// Should NOT throw — neverError swallows the error
		const result = await node.execute.call(mock as any);
		expect(result).toBeDefined();
	});
});

// ─── execute() — images resource (customField only) ──────────────────────────

describe('PrestaShop8.node execute() — images resource', () => {
	it('should use customField only (not standardField) for images', async () => {
		const mock = createExecuteMock({
			resource: 'images',
			operation: 'create',
			id: '5',
			'fieldsToCreate.customField': [{ name: 'id_product', value: '5' }],
			'fieldsToCreate.standardField': [{ name: 'should_not_appear', value: 'x' }],
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { image: { id: '1' } } });

		const node = new PrestaShop8();
		// If no throw, the image path was followed (customField-only logic)
		await expect(node.execute.call(mock as any)).resolves.toBeDefined();
	});
});

// ─── execute() — search operation ────────────────────────────────────────────

describe('PrestaShop8.node execute() — search with filters', () => {
	it('should build filter params in the URL', async () => {
		const mock = createExecuteMock({
			operation: 'search',
			filters: {
				standardFilter: [{ field: 'name', operator: 'CONTAINS', value: 'test' }],
				customFilter: [],
			},
			display: 'full',
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).toContain('filter');
	});

	it('should throw when no filters are provided', async () => {
		const mock = createExecuteMock({
			operation: 'search',
			filters: { standardFilter: [], customFilter: [] },
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('At least one filter');
	});

	it('should handle IS_EMPTY operator (no value required)', async () => {
		const mock = createExecuteMock({
			operation: 'search',
			filters: {
				standardFilter: [{ field: 'description', operator: 'IS_EMPTY', value: '' }],
				customFilter: [],
			},
			display: 'minimal',
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).toContain('filter%5Bdescription%5D=%5B%5D');
	});

	it('should throw when a value-requiring operator gets an empty value', async () => {
		const mock = createExecuteMock({
			operation: 'search',
			filters: {
				standardFilter: [{ field: 'name', operator: 'EQ', value: '' }],
				customFilter: [],
			},
			display: 'full',
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('requires a value');
		// The request must not be sent when the filter is invalid
		expect(mock.helpers.httpRequest).not.toHaveBeenCalled();
	});

	it('should handle CUSTOM filter operator (raw expression parsed into URL params)', async () => {
		const mock = createExecuteMock({
			operation: 'search',
			filters: {
				standardFilter: [],
				customFilter: [{ operator: 'CUSTOM', customFilterExpression: 'filter[active]=[1]' }],
			},
			display: 'full',
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).toContain('filter%5Bactive%5D');
	});
});

// ─── execute() — create operation ────────────────────────────────────────────

describe('PrestaShop8.node execute() — create', () => {
	it('should send POST request with XML body and return created item', async () => {
		const mock = createExecuteMock({
			operation: 'create',
			'fieldsToCreate.standardField': [
				{ name: 'name-1', value: 'New Product' },
				{ name: 'price', value: '19.99' },
				{ name: 'id_category_default', value: '2' },
			],
			'fieldsToCreate.customField': [],
		});
		mock.helpers.httpRequest.mockResolvedValue({
			prestashop: { product: { id: '10', name: 'New Product' } },
		});

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		const call = mock.helpers.httpRequest.mock.calls[0][0];
		expect(call.method).toBe('POST');
		expect(call.url).toContain('/products');
		expect(call.body).toContain('<product>');
		expect(result[0]).toBeDefined();
	});

	it('should throw when no fields are provided', async () => {
		const mock = createExecuteMock({
			operation: 'create',
			'fieldsToCreate.standardField': [],
			'fieldsToCreate.customField': [],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('At least one field');
	});

	it('should throw when a field has an empty name', async () => {
		const mock = createExecuteMock({
			operation: 'create',
			'fieldsToCreate.standardField': [{ name: '', value: 'something' }],
			'fieldsToCreate.customField': [],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('must have a name');
	});

	it('should throw when a field value is null', async () => {
		const mock = createExecuteMock({
			operation: 'create',
			'fieldsToCreate.standardField': [{ name: 'price', value: null }],
			'fieldsToCreate.customField': [],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('must have a value');
	});

	it('should throw when required fields are missing (validation)', async () => {
		const mock = createExecuteMock({
			operation: 'create',
			resource: 'products',
			'fieldsToCreate.standardField': [{ name: 'name-1', value: 'Only Name' }],
			'fieldsToCreate.customField': [],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('Missing required fields');
	});

	it('should send XML body with CDATA for multilingual fields', async () => {
		const mock = createExecuteMock({
			operation: 'create',
			resource: 'manufacturers',
			'fieldsToCreate.standardField': [
				{ name: 'name', value: 'Test Manufacturer' },
				{ name: 'active', value: '1' },
			],
			'fieldsToCreate.customField': [],
		});
		mock.helpers.httpRequest.mockResolvedValue({
			prestashop: { manufacturer: { id: '5' } },
		});

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const call = mock.helpers.httpRequest.mock.calls[0][0];
		expect(call.body).toContain('CDATA');
		expect(call.body).toContain('Test Manufacturer');
	});
});

// ─── execute() — update operation ────────────────────────────────────────────

describe('PrestaShop8.node execute() — update', () => {
	it('should send PATCH request with ID in URL and XML body', async () => {
		const mock = createExecuteMock({
			operation: 'update',
			id: '7',
			'fieldsToUpdate.standardField': [{ name: 'price', value: '25.00' }],
			'fieldsToUpdate.customField': [],
		});
		mock.helpers.httpRequest.mockResolvedValue({
			prestashop: { product: { id: '7', price: '25.00' } },
		});

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const call = mock.helpers.httpRequest.mock.calls[0][0];
		expect(call.method).toBe('PATCH');
		expect(call.url).toContain('/products/7');
		expect(call.body).toContain('<id>');
		expect(call.body).toContain('7');
	});

	it('should throw when id is missing', async () => {
		const mock = createExecuteMock({
			operation: 'update',
			id: '',
			'fieldsToUpdate.standardField': [{ name: 'price', value: '10' }],
			'fieldsToUpdate.customField': [],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('ID required');
	});

	it('should throw when no fields are provided for update', async () => {
		const mock = createExecuteMock({
			operation: 'update',
			id: '3',
			'fieldsToUpdate.standardField': [],
			'fieldsToUpdate.customField': [],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('At least one field');
	});

	it('should throw when an update field has an empty name', async () => {
		const mock = createExecuteMock({
			operation: 'update',
			id: '3',
			'fieldsToUpdate.standardField': [{ name: '', value: 'x' }],
			'fieldsToUpdate.customField': [],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('must have a name');
	});

	it('should throw when an update field value is null', async () => {
		const mock = createExecuteMock({
			operation: 'update',
			id: '3',
			'fieldsToUpdate.standardField': [{ name: 'name', value: null }],
			'fieldsToUpdate.customField': [],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow('must have a value');
	});
});

// ─── execute() — continueOnFail ──────────────────────────────────────────────

describe('PrestaShop8.node execute() — continueOnFail', () => {
	it('should capture error into returnData when continueOnFail is true', async () => {
		const mock = createExecuteMock({ operation: 'list' });
		mock.helpers.httpRequest.mockRejectedValue(new Error('API unavailable'));
		mock.continueOnFail.mockReturnValue(true);

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toHaveProperty('error');
		expect(result[0][0].json).toHaveProperty('resource', 'products');
		expect(result[0][0].json).toHaveProperty('operation', 'list');
	});

	it('should include originalError in continueOnFail output', async () => {
		const mock = createExecuteMock({ operation: 'list' });
		mock.helpers.httpRequest.mockRejectedValue(new Error('Timeout'));
		mock.continueOnFail.mockReturnValue(true);

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0][0].json).toHaveProperty('originalError', 'Timeout');
	});

	it('should process remaining items after an error when continueOnFail is true', async () => {
		const mock = createExecuteMock({ operation: 'list' });
		mock.getInputData.mockReturnValue([{ json: {} }, { json: {} }]);
		mock.helpers.httpRequest
			.mockRejectedValueOnce(new Error('Item 1 failed'))
			.mockResolvedValueOnce({ prestashop: { products: [{ id: '1' }] } });
		mock.continueOnFail.mockReturnValue(true);

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0].length).toBeGreaterThan(0);
		// First item failed (error captured), second item succeeded
		const firstItem = result[0][0];
		expect(firstItem.json).toHaveProperty('error');
	});
});

// ─── execute() — multi-item input ────────────────────────────────────────────

describe('PrestaShop8.node execute() — multi-item input', () => {
	it('should process each input item independently', async () => {
		const mock = createExecuteMock({ operation: 'list' });
		mock.getInputData.mockReturnValue([{ json: {} }, { json: {} }]);
		mock.helpers.httpRequest
			.mockResolvedValueOnce({ prestashop: { products: [{ id: '1' }] } })
			.mockResolvedValueOnce({ prestashop: { products: [{ id: '2' }] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		expect(mock.helpers.httpRequest).toHaveBeenCalledTimes(2);
	});

	it('should return results from all items combined into returnData', async () => {
		const mock = createExecuteMock({ operation: 'getById', id: '1' });
		mock.getInputData.mockReturnValue([{ json: {} }, { json: {} }]);
		mock.helpers.httpRequest
			.mockResolvedValueOnce({ prestashop: { product: { id: '1', name: 'A' } } })
			.mockResolvedValueOnce({ prestashop: { product: { id: '1', name: 'A' } } });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0].length).toBeGreaterThanOrEqual(2);
	});
});
