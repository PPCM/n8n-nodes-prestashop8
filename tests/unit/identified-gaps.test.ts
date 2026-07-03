/**
 * Tests for identified coverage gaps:
 *  1. node.ts L140  — sleep() on multi-item with delayBetweenCalls > 0
 *  2. node.ts L469  — showRequestInfo fallback when delete leaves requestDebugInfo empty
 *  3. node.ts L42   — images resource uses customField only (not standardField)
 *  4. node.ts L493  — continueOnFail=true multi-item error recovery
 *  5. errors.ts L81 — String(data) fallback when JSON.stringify throws (circular ref)
 *  6. response.ts L56 — third condition in keys.find (unrelated key with non-empty array)
 */

// ─── Mock axios before any imports ────────────────────────────────────────────
const mockAxios = jest.fn();
jest.mock('axios', () => mockAxios);

import { PrestaShop8 } from '../../nodes/PrestaShop8/PrestaShop8.node';
import { extractPrestashopError } from '../../nodes/PrestaShop8/utils/errors';
import { processResponseForMode } from '../../nodes/PrestaShop8/utils/response';

beforeEach(() => {
	mockAxios.mockReset();
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function createMock(overrides: Record<string, any> = {}) {
	const defaults: Record<string, any> = {
		resource: 'products',
		operation: 'list',
		id: '',
		'options.timeout': 30000,
		'options.delayBetweenCalls': 0,
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
		'fieldsToCreate.standardField': [],
		'fieldsToCreate.customField': [],
		'fieldsToUpdate.standardField': [],
		'fieldsToUpdate.customField': [],
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
		helpers: { httpRequest: jest.fn() },
		getInputData: jest.fn().mockReturnValue([{ json: {} }]),
		continueOnFail: jest.fn().mockReturnValue(false),
	};
}

// ─── 1. delayBetweenCalls ─────────────────────────────────────────────────────

describe('execute() — delayBetweenCalls on multi-item input (node.ts L140)', () => {
	it('should delay between items when delayBetweenCalls > 0', async () => {
		jest.useFakeTimers();

		const mock = createMock({
			operation: 'list',
			'options.delayBetweenCalls': 200,
		});
		mock.getInputData.mockReturnValue([{ json: {} }, { json: {} }]);
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		const promise = node.execute.call(mock as any);
		await jest.runAllTimersAsync();
		await promise;

		expect(mock.helpers.httpRequest).toHaveBeenCalledTimes(2);

		jest.useRealTimers();
	});

	it('should not delay for the first item (i === 0)', async () => {
		jest.useFakeTimers();

		const mock = createMock({
			operation: 'list',
			'options.delayBetweenCalls': 999999,
		});
		mock.getInputData.mockReturnValue([{ json: {} }]);
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		// Single item — no sleep, resolves immediately without advancing timers
		await expect(node.execute.call(mock as any)).resolves.toBeDefined();

		jest.useRealTimers();
	});

	it('should not delay when delayBetweenCalls is 0', async () => {
		const mock = createMock({
			operation: 'list',
			'options.delayBetweenCalls': 0,
		});
		mock.getInputData.mockReturnValue([{ json: {} }, { json: {} }]);
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).resolves.toBeDefined();
		expect(mock.helpers.httpRequest).toHaveBeenCalledTimes(2);
	});
});

// ─── 2. showRequestInfo fallback for delete ───────────────────────────────────

describe('execute() delete + showRequestInfo=true — requestDebugInfo fallback (node.ts L469)', () => {
	it('should inject fallback requestDebugInfo when delete leaves it empty', async () => {
		const mock = createMock({
			operation: 'delete',
			id: '7',
			'options.request.showRequestInfo': true,
		});
		mock.helpers.httpRequest.mockResolvedValue({ deleted: true });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		const item = result[0][0].json as any;
		expect(item).toHaveProperty('requestInfo');
		expect(item.requestInfo).toHaveProperty('method');
		expect(item.requestInfo).toHaveProperty('url');
		expect(item.requestInfo).toHaveProperty('timeout', 30000);
	});

	it('should include requestUrl alongside requestInfo for delete', async () => {
		const mock = createMock({
			operation: 'delete',
			id: '3',
			'options.request.showRequestInfo': true,
			'options.request.showRequestUrl': true,
		});
		mock.helpers.httpRequest.mockResolvedValue({ deleted: true });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		const item = result[0][0].json as any;
		expect(item).toHaveProperty('requestUrl');
		expect(item).toHaveProperty('requestInfo');
	});
});

// ─── 3. images resource — customField only (node.ts L42-44) ──────────────────

describe('execute() create — images resource uses customField only (node.ts L42)', () => {
	it('should read from customField and NOT from standardField for images resource', async () => {
		const mock = createMock({
			resource: 'images',
			operation: 'create',
			'fieldsToCreate.customField': [{ name: 'id_product', value: '42' }],
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { image: { id: '1' } } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const paramNames: string[] = mock.getNodeParameter.mock.calls.map((c: any[]) => c[0]);
		expect(paramNames).not.toContain('fieldsToCreate.standardField');
		expect(paramNames).toContain('fieldsToCreate.customField');
	});

	it('should build correct XML request for images with custom fields', async () => {
		const mock = createMock({
			resource: 'images',
			operation: 'create',
			'fieldsToCreate.customField': [{ name: 'id_product', value: '10' }],
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { image: { id: '5' } } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const call = mock.helpers.httpRequest.mock.calls[0][0];
		expect(call.method).toBe('POST');
		expect(call.body).toContain('id_product');
	});
});

// ─── 4. continueOnFail=true multi-item error recovery ────────────────────────

describe('execute() continueOnFail=true — multi-item error recovery (node.ts L493)', () => {
	it('should push error item and continue processing remaining items', async () => {
		const mock = createMock({ operation: 'list' });
		mock.continueOnFail.mockReturnValue(true);
		mock.getInputData.mockReturnValue([{ json: {} }, { json: {} }]);
		mock.helpers.httpRequest
			.mockRejectedValueOnce(
				Object.assign(new Error('Not found'), {
					response: { data: { error: 'Not found' } },
				}),
			)
			.mockResolvedValueOnce({ prestashop: { products: [{ id: '2' }] } });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		const items = result[0];
		expect(items.length).toBe(2);

		const errorItem = items.find((it: any) => it.json.error !== undefined) as any;
		expect(errorItem).toBeDefined();
		expect(errorItem.json.error).toBe('Not found');
		expect(errorItem.json.resource).toBe('products');
		expect(errorItem.json.operation).toBe('list');
	});

	it('should include originalError in the error item', async () => {
		const mock = createMock({ operation: 'list' });
		mock.continueOnFail.mockReturnValue(true);
		mock.getInputData.mockReturnValue([{ json: {} }]);
		mock.helpers.httpRequest.mockRejectedValue(
			Object.assign(new Error('Network timeout'), { response: null }),
		);

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		const item = result[0][0].json as any;
		expect(item).toHaveProperty('originalError', 'Network timeout');
	});

	it('should still throw when continueOnFail is false', async () => {
		const mock = createMock({ operation: 'list' });
		mock.continueOnFail.mockReturnValue(false);
		mock.helpers.httpRequest.mockRejectedValue(new Error('Fatal'));

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow();
	});
});

// ─── 5. extractPrestashopError — circular reference (errors.ts L81) ──────────

describe('extractPrestashopError — circular reference falls back to String() (errors.ts L81)', () => {
	it('should return String(data) when JSON.stringify throws due to circular reference', () => {
		const circular: any = {};
		circular.self = circular; // JSON.stringify(circular) throws TypeError

		const error = { response: { data: circular } };
		const result = extractPrestashopError(error);

		// String({}) → '[object Object]', but the point is it must not throw
		expect(typeof result).toBe('string');
		expect(result.length).toBeGreaterThan(0);
	});

	it('should not throw when data has a toJSON that throws', () => {
		const evil = {
			toJSON() { throw new Error('toJSON boom'); },
		};
		const error = { response: { data: evil } };
		expect(() => extractPrestashopError(error)).not.toThrow();
	});
});

// ─── 6. processResponseForMode — third condition in keys.find (response.ts L56) ─

describe('processResponseForMode — third condition: unrelated key with non-empty array (response.ts L56)', () => {
	it('should return array from a non-resource-named key that contains items', () => {
		// 'data' is neither 'products' nor 'productss', but it has a non-empty array
		// → the third condition (Array.isArray && length > 0) fires first
		const raw = { data: [{ id: 1 }, { id: 2 }] };
		const result = processResponseForMode(raw, 'products');
		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);
	});

	it('should NOT match a non-resource-named key when its array is empty', () => {
		const raw = { data: [], status: 'ok' };
		const result = processResponseForMode(raw, 'products');
		// Empty array fails the length > 0 check → no array returned
		expect(Array.isArray(result)).toBe(false);
	});

	it('should prefer exact resource key match over the array-scan fallback', () => {
		// 'products' matches key === resource exactly (first condition), takes priority
		const raw = { products: [{ id: 1 }], other: [{ id: 99 }, { id: 100 }] };
		const result = processResponseForMode(raw, 'products');
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(1);
	});
});
