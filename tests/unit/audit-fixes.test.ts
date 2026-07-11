/**
 * Tests for the fixes from the 2026-07 project audit:
 * - API key masking in debug info
 * - retry: string httpCode (429), non-idempotent POST exclusion
 * - delete with neverError reports real failures
 * - type conversion applied under Show Request URL / Include Response Headers wrappers
 * - irregular singular unwrap (categories -> category)
 * - CUSTOM filter values containing '='
 * - id URL-encoding in resource paths
 * - XML field name validation (injection guard)
 */

import { PrestaShop8 } from '../../nodes/PrestaShop8/PrestaShop8.node';
import {
	isRetryableError,
	maskSecret,
	executeHttpRequest,
} from '../../nodes/PrestaShop8/helpers/http';
import { buildCreateXml } from '../../nodes/PrestaShop8/utils/xml';

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
		helpers: { httpRequest: jest.fn() },
		getInputData: jest.fn().mockReturnValue([{ json: {} }]),
		continueOnFail: jest.fn().mockReturnValue(false),
	};
}

// ─── maskSecret ───────────────────────────────────────────────────────────────

describe('maskSecret', () => {
	it('keeps only the first 4 characters of a long key', () => {
		expect(maskSecret('ABCDEFGHIJKLMNOP')).toBe('ABCD***');
	});

	it('fully masks short keys', () => {
		expect(maskSecret('SHORT')).toBe('***');
	});

	it('returns empty string for missing values', () => {
		expect(maskSecret(undefined)).toBe('');
		expect(maskSecret('')).toBe('');
	});
});

// ─── isRetryableError — string httpCode and non-idempotent calls ─────────────

describe('isRetryableError — httpCode as string (n8n NodeApiError)', () => {
	it('retries on 429 given as a string', () => {
		expect(isRetryableError({ httpCode: '429' })).toBe(true);
	});

	it('retries on 503 given as a string', () => {
		expect(isRetryableError({ httpCode: '503' })).toBe(true);
	});

	it('does not retry on 404 given as a string', () => {
		expect(isRetryableError({ httpCode: '404' })).toBe(false);
	});
});

describe('isRetryableError — non-idempotent (POST) calls', () => {
	it('does not retry ambiguous timeout errors for non-idempotent calls', () => {
		expect(isRetryableError({ code: 'ETIMEDOUT' }, true)).toBe(false);
		expect(isRetryableError({ code: 'ECONNABORTED' }, true)).toBe(false);
		expect(isRetryableError({ message: 'timeout of 30000ms exceeded' }, true)).toBe(false);
		expect(isRetryableError({ message: 'socket hang up' }, true)).toBe(false);
	});

	it('still retries pre-send network errors for non-idempotent calls', () => {
		expect(isRetryableError({ code: 'ECONNREFUSED' }, true)).toBe(true);
		expect(isRetryableError({ code: 'ENOTFOUND' }, true)).toBe(true);
	});

	it('still retries ambiguous errors for idempotent calls', () => {
		expect(isRetryableError({ code: 'ETIMEDOUT' }, false)).toBe(true);
	});
});

describe('executeHttpRequest — POST timeout is not retried', () => {
	const credentials = { apiKey: 'KEY', baseUrl: 'https://shop.com/api' };
	const retry = { enabled: true, maxRetries: 2, retryDelay: 0 };

	it('fails immediately on POST timeout (single call, no duplicate create)', async () => {
		const timeoutError = Object.assign(new Error('timeout of 30000ms exceeded'), {
			code: 'ETIMEDOUT',
		});
		const helpers = { httpRequest: jest.fn().mockRejectedValue(timeoutError) };
		const options: any = { method: 'POST', url: 'https://shop.com/api/products' };

		await expect(
			executeHttpRequest(helpers, options, credentials, false, 'create', 'products', false, '<xml/>', retry),
		).rejects.toThrow();
		expect(helpers.httpRequest).toHaveBeenCalledTimes(1);
	});

	it('retries GET timeouts as before', async () => {
		const timeoutError = Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' });
		const helpers = { httpRequest: jest.fn().mockRejectedValue(timeoutError) };
		const options: any = { method: 'GET', url: 'https://shop.com/api/products' };

		await expect(
			executeHttpRequest(helpers, options, credentials, false, 'list', 'products', false, undefined, retry),
		).rejects.toThrow();
		// 1 initial attempt + 2 retries
		expect(helpers.httpRequest).toHaveBeenCalledTimes(3);
	});
});

// ─── delete + neverError reports the real failure ─────────────────────────────

describe('PrestaShop8.node execute() — delete with neverError', () => {
	it('reports success: false when the delete actually failed (404)', async () => {
		const mock = createExecuteMock({
			operation: 'delete',
			id: '99999',
			'options.response.neverError': true,
		});
		const notFound = Object.assign(new Error('Not Found'), {
			httpCode: '404',
			response: { status: 404, data: 'Not found' },
		});
		mock.helpers.httpRequest.mockRejectedValue(notFound);

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0][0].json.success).toBe(false);
		expect(result[0][0].json.status).toBe(404);
		expect(result[0][0].json.deletedId).toBe('99999');
	});

	it('reports success: true when the delete succeeded', async () => {
		const mock = createExecuteMock({
			operation: 'delete',
			id: '7',
			'options.response.neverError': true,
		});
		mock.helpers.httpRequest.mockResolvedValue({ body: '', headers: {}, statusCode: 200 });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0][0].json.success).toBe(true);
		expect(result[0][0].json.deletedId).toBe('7');
	});
});

// ─── type conversion under output wrappers ────────────────────────────────────

describe('PrestaShop8.node execute() — type conversion with output wrappers', () => {
	it('converts types under the Show Request URL wrapper', async () => {
		const mock = createExecuteMock({ 'options.request.showRequestUrl': true });
		mock.helpers.httpRequest.mockResolvedValue({
			body: { products: [{ id: '5', price: '19.900000' }] },
			headers: {},
			statusCode: 200,
		});

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		const json: any = result[0][0].json;
		expect(json.requestUrl).toBeDefined();
		expect(json.data[0].id).toBe(5);
		expect(json.data[0].price).toBe(19.9);
	});

	it('converts types under the Include Response Headers wrapper', async () => {
		const mock = createExecuteMock({ 'options.response.includeResponseHeaders': true });
		mock.helpers.httpRequest.mockResolvedValue({
			body: { products: [{ id: '5', price: '19.900000' }] },
			headers: { 'x-powered-by': 'PrestaShop' },
			statusCode: 200,
		});

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		const json: any = result[0][0].json;
		expect(json.headers['x-powered-by']).toBe('PrestaShop');
		expect(json.statusCode).toBe(200);
		expect(json.body[0].price).toBe(19.9);
	});
});

// ─── irregular singular unwrap ────────────────────────────────────────────────

describe('PrestaShop8.node execute() — irregular singular unwrap', () => {
	it('unwraps { category: {...} } for a categories getById', async () => {
		const mock = createExecuteMock({ resource: 'categories', operation: 'getById', id: '3' });
		mock.helpers.httpRequest.mockResolvedValue({
			body: { category: { id: '3', active: '1' } },
			headers: {},
			statusCode: 200,
		});

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		const json: any = result[0][0].json;
		// The payload must be unwrapped (no 'category' envelope) and converted
		expect(json.category).toBeUndefined();
		expect(json.id).toBe(3);
	});
});

// ─── CUSTOM filter values containing '=' ─────────────────────────────────────

describe('PrestaShop8.node execute() — CUSTOM filter with = in value', () => {
	it('keeps the full value after the first =', async () => {
		const mock = createExecuteMock({
			operation: 'search',
			filters: {
				standardFilter: [],
				customFilter: [
					{ operator: 'CUSTOM', customFilterExpression: 'filter[reference]=SKU=BLUE-1' },
				],
			},
		});
		mock.helpers.httpRequest.mockResolvedValue({
			body: { products: [] },
			headers: {},
			statusCode: 200,
		});

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(decodeURIComponent(url)).toContain('filter[reference]=SKU=BLUE-1');
	});
});

// ─── id URL-encoding ─────────────────────────────────────────────────────────

describe('PrestaShop8.node execute() — id is URL-encoded in resource paths', () => {
	it('encodes a path-traversal id on delete', async () => {
		const mock = createExecuteMock({ operation: 'delete', id: '5/../../customers/3' });
		mock.helpers.httpRequest.mockResolvedValue({ body: '', headers: {}, statusCode: 200 });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).toContain('/products/5%2F..%2F..%2Fcustomers%2F3');
		expect(url).not.toContain('/customers/3');
	});

	it('encodes a query-injection id on update', async () => {
		const mock = createExecuteMock({
			operation: 'update',
			id: '5?ws_key=evil',
			'fieldsToUpdate.standardField': [{ name: 'reference', value: 'X' }],
			'fieldsToUpdate.customField': [],
		});
		mock.helpers.httpRequest.mockResolvedValue({ body: {}, headers: {}, statusCode: 200 });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).toContain('5%3Fws_key%3Devil');
		expect(url).not.toContain('5?ws_key=evil');
	});
});

// ─── dynamic dropdowns reload when the resource changes ──────────────────────

describe('description — dynamic dropdowns depend on resource', () => {
	it('every loadOptionsMethod property declares loadOptionsDependsOn resource', () => {
		const { PrestaShop8Description } = require('../../nodes/PrestaShop8/PrestaShop8.node.description');
		const found: any[] = [];
		const walk = (obj: any) => {
			if (!obj || typeof obj !== 'object') return;
			if (obj.typeOptions?.loadOptionsMethod) found.push(obj);
			for (const value of Object.values(obj)) walk(value);
		};
		walk(PrestaShop8Description.properties);
		expect(found.length).toBeGreaterThan(0);
		for (const prop of found) {
			// Without this, n8n caches the options loaded for the first resource
			// (e.g. order_details would offer Create/Delete from products)
			expect(prop.typeOptions.loadOptionsDependsOn).toEqual(['resource']);
		}
	});
});

// ─── XML field name validation ───────────────────────────────────────────────

describe('buildCreateXml — field name validation', () => {
	it('rejects field names containing XML markup', () => {
		expect(() =>
			buildCreateXml('products', [
				{ name: 'reference><active><![CDATA[1]]></active><reference', value: '1' },
			]),
		).toThrow(/Invalid field name/);
	});

	it('rejects field names with spaces', () => {
		expect(() => buildCreateXml('products', [{ name: 'my field', value: '1' }])).toThrow(
			/Invalid field name/,
		);
	});

	it('accepts regular PrestaShop field names', () => {
		expect(() =>
			buildCreateXml('products', [
				{ name: 'id_category_default', value: '2' },
				{ name: 'name-1', value: 'Produit' },
			]),
		).not.toThrow();
	});
});
