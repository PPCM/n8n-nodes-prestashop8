// Mock axios before importing the module that require()'s it
const mockAxios = jest.fn();
jest.mock('axios', () => mockAxios);

import {
	getOperationOptions,
	executeHttpRequest,
	executeRawModeRequest,
} from '../../nodes/PrestaShop8/helpers/http';

// ─── getOperationOptions ─────────────────────────────────────────────────────

describe('getOperationOptions', () => {
	function createMockExecute(params: Record<string, any>) {
		return {
			getNodeParameter: jest.fn((name: string, _index: number, defaultValue: any) => {
				return Object.prototype.hasOwnProperty.call(params, name) ? params[name] : defaultValue;
			}),
		};
	}

	it('should return defaults when no params are set', () => {
		const mock = createMockExecute({});
		const opts = getOperationOptions(mock as any, 0);
		expect(opts.timeout).toBe(30000);
		expect(opts.neverError).toBe(false);
		expect(opts.includeResponseHeaders).toBe(false);
		expect(opts.rawMode).toBe(false);
		expect(opts.showRequestInfo).toBe(false);
		expect(opts.showRequestUrl).toBe(false);
	});

	it('should pick up custom timeout', () => {
		const mock = createMockExecute({ 'options.timeout': 60000 });
		const opts = getOperationOptions(mock as any, 0);
		expect(opts.timeout).toBe(60000);
	});

	it('should pick up neverError flag', () => {
		const mock = createMockExecute({ 'options.response.neverError': true });
		const opts = getOperationOptions(mock as any, 0);
		expect(opts.neverError).toBe(true);
	});

	it('should pick up rawMode flag', () => {
		const mock = createMockExecute({ 'options.response.rawMode': true });
		const opts = getOperationOptions(mock as any, 0);
		expect(opts.rawMode).toBe(true);
	});

	it('should pick up includeResponseHeaders flag', () => {
		const mock = createMockExecute({ 'options.response.includeResponseHeaders': true });
		const opts = getOperationOptions(mock as any, 0);
		expect(opts.includeResponseHeaders).toBe(true);
	});

	it('should pick up showRequestInfo and showRequestUrl flags', () => {
		const mock = createMockExecute({
			'options.request.showRequestInfo': true,
			'options.request.showRequestUrl': true,
		});
		const opts = getOperationOptions(mock as any, 0);
		expect(opts.showRequestInfo).toBe(true);
		expect(opts.showRequestUrl).toBe(true);
	});
});

// ─── executeHttpRequest ──────────────────────────────────────────────────────

describe('executeHttpRequest', () => {
	const credentials = { apiKey: 'TESTKEY', baseUrl: 'https://shop.com/api' };
	const options: any = {
		method: 'GET',
		url: 'https://shop.com/api/products',
		headers: { 'Output-Format': 'JSON' },
		timeout: 30000,
	};

	it('should return response body, real headers and status code on success', async () => {
		const mockBody = { prestashop: { products: [] } };
		const helpers = {
			httpRequest: jest.fn().mockResolvedValue({
				body: mockBody,
				headers: { 'content-type': 'application/json' },
				statusCode: 200,
			}),
		};

		const result = await executeHttpRequest(helpers, options, credentials, false, 'list', 'products');

		// The request must ask n8n for the full response to get real metadata
		expect(helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({ returnFullResponse: true }),
		);
		expect(result.response).toEqual(mockBody);
		expect(result.debugInfo).toBeDefined();
		expect(result.url).toBe('https://shop.com/api/products');
		expect(result.responseHeaders).toEqual({ 'content-type': 'application/json' });
		expect(result.statusCode).toBe(200);
	});

	it('should surface the real status code (e.g. 201 on create)', async () => {
		const helpers = {
			httpRequest: jest.fn().mockResolvedValue({
				body: { prestashop: { product: { id: '9' } } },
				headers: {},
				statusCode: 201,
			}),
		};

		const result = await executeHttpRequest(helpers, options, credentials, false, 'create', 'products');
		expect(result.statusCode).toBe(201);
	});

	it('should re-throw error when neverError is false', async () => {
		const helpers = { httpRequest: jest.fn().mockRejectedValue(new Error('Network error')) };

		await expect(
			executeHttpRequest(helpers, options, credentials, false, 'list', 'products', false),
		).rejects.toThrow('Network error');
	});

	it('should return error payload when neverError is true', async () => {
		const httpError = Object.assign(new Error('Not Found'), {
			httpCode: 404,
			response: { status: 404, data: 'Not found' },
		});
		const helpers = { httpRequest: jest.fn().mockRejectedValue(httpError) };

		const result = await executeHttpRequest(helpers, options, credentials, false, 'list', 'products', true);

		expect(result.response.status).toBe(404);
		expect(result.response.message).toBe('Not found');
		expect(result.statusCode).toBe(404);
	});

	it('should fall back to 500 status when error has no httpCode', async () => {
		const helpers = { httpRequest: jest.fn().mockRejectedValue(new Error('Unknown')) };

		const result = await executeHttpRequest(helpers, options, credentials, false, 'list', 'products', true);

		expect(result.response.status).toBe(500);
	});

	it('should include body in debugInfo when provided', async () => {
		const helpers = { httpRequest: jest.fn().mockResolvedValue({}) };
		const body = '<prestashop><product><name>Test</name></product></prestashop>';

		const result = await executeHttpRequest(helpers, options, credentials, false, 'create', 'products', false, body);

		expect(result.debugInfo.body).toBe(body);
	});
});

// ─── executeRawModeRequest ───────────────────────────────────────────────────

describe('executeRawModeRequest', () => {
	const credentials = { apiKey: 'TESTKEY', baseUrl: 'https://shop.com/api' };
	const url = 'https://shop.com/api/products';

	beforeEach(() => {
		mockAxios.mockReset();
	});

	it('should return raw XML response data on success', async () => {
		const rawXml = '<?xml version="1.0"?><prestashop><products/></prestashop>';
		mockAxios.mockResolvedValue({
			status: 200,
			data: rawXml,
			headers: { 'content-type': 'text/xml' },
		});

		const result = await executeRawModeRequest(url, credentials, 30000, false, false, 'list', 'products');

		expect(result.responseData).toHaveProperty('raw', rawXml);
		expect(result.requestDebugInfo).toBeDefined();
		expect(result.requestHeaders).toBeDefined();
	});

	it('should return error payload when neverError is true and axios rejects', async () => {
		mockAxios.mockRejectedValue(
			Object.assign(new Error('Connection refused'), {
				response: { status: 503, data: 'Service unavailable' },
			}),
		);

		const result = await executeRawModeRequest(url, credentials, 30000, true, false, 'list', 'products');

		expect(result.responseData).toHaveProperty('status', 503);
		expect(result.responseData).toHaveProperty('message', 'Service unavailable');
	});

	it('should fall back to status 500 when error has no response', async () => {
		mockAxios.mockRejectedValue(new Error('Network error'));

		const result = await executeRawModeRequest(url, credentials, 30000, true, false, 'list', 'products');

		expect(result.responseData).toHaveProperty('status', 500);
	});

	it('should rethrow when neverError is false and axios rejects', async () => {
		mockAxios.mockRejectedValue(new Error('Timeout'));

		await expect(
			executeRawModeRequest(url, credentials, 30000, false, false, 'list', 'products'),
		).rejects.toThrow('Timeout');
	});

	it('should wrap response with headers when includeResponseHeaders is true', async () => {
		const rawXml = '<prestashop/>';
		mockAxios.mockResolvedValue({
			status: 200,
			data: rawXml,
			headers: { 'x-custom': 'header-value' },
		});

		const result = await executeRawModeRequest(url, credentials, 30000, false, true, 'list', 'products');

		expect(result.responseData).toHaveProperty('body');
		expect(result.responseData).toHaveProperty('headers');
		expect(result.responseData).toHaveProperty('statusCode', 200);
	});

	it('should return error response when server returns non-2xx and neverError is true', async () => {
		mockAxios.mockResolvedValue({
			status: 404,
			data: 'Not found',
			headers: {},
		});

		const result = await executeRawModeRequest(url, credentials, 30000, true, false, 'getById', 'products');

		expect(result.responseData).toHaveProperty('status', 404);
		expect(result.responseData).toHaveProperty('message', 'Not found');
	});
});
