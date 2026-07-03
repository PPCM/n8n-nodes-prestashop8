import {
	FILTER_OPERATOR_FORMATS,
	buildHttpOptions,
	captureRequestDebugInfo,
	wrapResponse,
	sleep,
	getOperationOptions,
	isRetryableError,
	withRetry,
	describeError,
} from '../../nodes/PrestaShop8/helpers/http';

// ─── FILTER_OPERATOR_FORMATS ────────────────────────────────────────────────

describe('FILTER_OPERATOR_FORMATS', () => {
	it('should define all operators', () => {
		// 'EQ' is the UI value for Equal; '=' is kept as a legacy alias.
		const expected = ['EQ', '=', '!=', '>', '>=', '<', '<=', 'CONTAINS', 'BEGINS', 'ENDS', 'IS_EMPTY', 'IS_NOT_EMPTY'];
		expect(Object.keys(FILTER_OPERATOR_FORMATS)).toEqual(expect.arrayContaining(expected));
		expect(Object.keys(FILTER_OPERATOR_FORMATS)).toHaveLength(12);
	});

	it('should mark IS_EMPTY and IS_NOT_EMPTY as not requiring a value', () => {
		expect(FILTER_OPERATOR_FORMATS['IS_EMPTY'].requiresValue).toBe(false);
		expect(FILTER_OPERATOR_FORMATS['IS_NOT_EMPTY'].requiresValue).toBe(false);
	});

	it('should mark all other operators as requiring a value', () => {
		const valueOperators = ['=', '!=', '>', '>=', '<', '<=', 'CONTAINS', 'BEGINS', 'ENDS'];
		for (const op of valueOperators) {
			expect(FILTER_OPERATOR_FORMATS[op].requiresValue).toBe(true);
		}
	});

	it('should use {v} placeholder in templates that require a value', () => {
		for (const [op, def] of Object.entries(FILTER_OPERATOR_FORMATS)) {
			if (def.requiresValue) {
				expect(def.template).toContain('{v}');
			}
		}
	});

	it('should produce correct template strings for key operators', () => {
		expect(FILTER_OPERATOR_FORMATS['='].template).toBe('[{v}]');
		expect(FILTER_OPERATOR_FORMATS['!='].template).toBe('![{v}]');
		expect(FILTER_OPERATOR_FORMATS['CONTAINS'].template).toBe('%[{v}]%');
		expect(FILTER_OPERATOR_FORMATS['BEGINS'].template).toBe('[{v}]%');
		expect(FILTER_OPERATOR_FORMATS['ENDS'].template).toBe('%[{v}]');
		expect(FILTER_OPERATOR_FORMATS['IS_EMPTY'].template).toBe('[]');
		expect(FILTER_OPERATOR_FORMATS['IS_NOT_EMPTY'].template).toBe('![]');
	});
});

// ─── buildHttpOptions ───────────────────────────────────────────────────────

describe('buildHttpOptions', () => {
	const credentials = { apiKey: 'TESTAPIKEY', baseUrl: 'https://shop.com/api' };

	it('should set method and url', () => {
		const opts = buildHttpOptions('GET', 'https://shop.com/api/products', credentials, false, 30000);
		expect(opts.method).toBe('GET');
		expect(opts.url).toBe('https://shop.com/api/products');
	});

	it('should use apiKey as auth username with empty password', () => {
		const opts = buildHttpOptions('GET', 'https://shop.com/api/products', credentials, false, 30000);
		expect((opts.auth as any).username).toBe('TESTAPIKEY');
		expect((opts.auth as any).password).toBe('');
	});

	it('should set Output-Format: JSON in non-raw mode', () => {
		const opts = buildHttpOptions('GET', 'https://shop.com/api/products', credentials, false, 30000);
		expect((opts.headers as any)['Output-Format']).toBe('JSON');
	});

	it('should set Output-Format: XML in raw mode', () => {
		const opts = buildHttpOptions('GET', 'https://shop.com/api/products', credentials, true, 30000);
		expect((opts.headers as any)['Output-Format']).toBe('XML');
	});

	it('should set Content-Type: application/xml for POST with body', () => {
		const opts = buildHttpOptions('POST', 'https://shop.com/api/products', credentials, false, 30000, '<xml/>');
		expect((opts.headers as any)['Content-Type']).toBe('application/xml');
	});

	it('should not set Content-Type for GET requests', () => {
		const opts = buildHttpOptions('GET', 'https://shop.com/api/products', credentials, false, 30000);
		expect((opts.headers as any)['Content-Type']).toBeUndefined();
	});

	it('should not set Content-Type for POST without body', () => {
		const opts = buildHttpOptions('POST', 'https://shop.com/api/products', credentials, false, 30000);
		expect((opts.headers as any)['Content-Type']).toBeUndefined();
	});

	it('should pass timeout', () => {
		const opts = buildHttpOptions('GET', 'https://shop.com/api/products', credentials, false, 60000);
		expect(opts.timeout).toBe(60000);
	});

	it('should set json: false in raw mode', () => {
		const opts = buildHttpOptions('GET', 'https://shop.com/api/products', credentials, true, 30000);
		expect((opts as any).json).toBe(false);
	});

	it('should not include json key in non-raw mode', () => {
		const opts = buildHttpOptions('GET', 'https://shop.com/api/products', credentials, false, 30000);
		expect(Object.prototype.hasOwnProperty.call(opts, 'json')).toBe(false);
	});

	it('should include body when provided', () => {
		const opts = buildHttpOptions('POST', 'https://shop.com/api/products', credentials, false, 30000, '<xml/>');
		expect((opts as any).body).toBe('<xml/>');
	});
});

// ─── captureRequestDebugInfo ────────────────────────────────────────────────

describe('captureRequestDebugInfo', () => {
	const options = { method: 'GET', url: 'https://shop.com/api/products', headers: { 'Output-Format': 'JSON' }, timeout: 30000 };
	const credentials = { apiKey: 'MYKEY', baseUrl: 'https://shop.com/api' };

	it('should include method, url, operation, resource', () => {
		const info = captureRequestDebugInfo(options, credentials, false, 'list', 'products');
		expect(info.method).toBe('GET');
		expect(info.url).toBe('https://shop.com/api/products');
		expect(info.operation).toBe('list');
		expect(info.resource).toBe('products');
	});

	it('should redact the Authorization header (the API key must never leak)', () => {
		const info = captureRequestDebugInfo(options, credentials, false, 'list', 'products');
		expect(info.headers['Authorization']).toBe('Basic [REDACTED]');
		expect(JSON.stringify(info)).not.toContain('MYKEY');
		expect(JSON.stringify(info)).not.toContain(Buffer.from('MYKEY:').toString('base64'));
	});

	it('should mask the API key in the authentication username', () => {
		const longKey = { apiKey: 'ABCDEFGHIJKLMNOP', baseUrl: 'https://shop.com/api' };
		const info = captureRequestDebugInfo(options, longKey, false, 'list', 'products');
		expect(info.authentication.username).toBe('ABCD***');
	});

	it('should mark mode as JSON for non-raw', () => {
		const info = captureRequestDebugInfo(options, credentials, false, 'list', 'products');
		expect(info.mode).toBe('JSON');
	});

	it('should mark mode as Raw XML for raw mode', () => {
		const info = captureRequestDebugInfo(options, credentials, true, 'list', 'products');
		expect(info.mode).toBe('Raw XML');
	});

	it('should hide password in authentication section', () => {
		const info = captureRequestDebugInfo(options, credentials, false, 'list', 'products');
		expect(info.authentication.password).toBe('[HIDDEN]');
	});

	it('should include body when provided', () => {
		const info = captureRequestDebugInfo(options, credentials, false, 'create', 'products', '<xml/>');
		expect(info.body).toBe('<xml/>');
	});

	it('should not include body key when not provided', () => {
		const info = captureRequestDebugInfo(options, credentials, false, 'list', 'products');
		expect(Object.prototype.hasOwnProperty.call(info, 'body')).toBe(false);
	});
});

// ─── wrapResponse ───────────────────────────────────────────────────────────

describe('wrapResponse', () => {
	const payload = { id: 1, name: 'Test' };

	it('should return payload directly when includeHeaders is false', () => {
		const result = wrapResponse(payload, false);
		expect(result).toEqual(payload);
	});

	it('should wrap with body, headers, statusCode when includeHeaders is true', () => {
		const result = wrapResponse(payload, true, { 'x-custom': 'value' }, 200);
		expect(result).toHaveProperty('body', payload);
		expect(result).toHaveProperty('headers');
		expect(result).toHaveProperty('statusCode', 200);
		expect(result).toHaveProperty('statusMessage', 'OK');
	});

	it('should use empty headers when none provided', () => {
		const result = wrapResponse(payload, true);
		expect(result.headers).toEqual({});
	});

	it('should use statusCode 200 by default', () => {
		const result = wrapResponse(payload, true);
		expect(result.statusCode).toBe(200);
	});

	it('should set statusMessage to Error for non-2xx status', () => {
		const result = wrapResponse(payload, true, {}, 404);
		expect(result.statusMessage).toBe('Error');
	});

	it('should set statusMessage to OK for 201 Created', () => {
		const result = wrapResponse(payload, true, {}, 201);
		expect(result.statusMessage).toBe('OK');
	});
});

// ─── sleep ──────────────────────────────────────────────────────────────────

describe('sleep', () => {
	it('should resolve after the given delay', async () => {
		jest.useFakeTimers();
		let resolved = false;
		const p = sleep(500).then(() => { resolved = true; });
		expect(resolved).toBe(false);
		jest.advanceTimersByTime(500);
		await p;
		expect(resolved).toBe(true);
		jest.useRealTimers();
	});
});

// ─── getOperationOptions ─────────────────────────────────────────────────────

describe('getOperationOptions', () => {
	function mockExec(params: Record<string, any>) {
		return {
			getNodeParameter: (name: string, _i: number, fallback: any) =>
				name in params ? params[name] : fallback,
		} as any;
	}

	it('should read delayBetweenCalls (default 0)', () => {
		const opts = getOperationOptions(mockExec({}), 0);
		expect(opts.delayBetweenCalls).toBe(0);
	});

	it('should return the configured delayBetweenCalls', () => {
		const opts = getOperationOptions(mockExec({ 'options.delayBetweenCalls': 250 }), 0);
		expect(opts.delayBetweenCalls).toBe(250);
	});

	it('should expose retry defaults (disabled, 3 retries, 1000ms)', () => {
		const opts = getOperationOptions(mockExec({}), 0);
		expect(opts.retry).toEqual({ enabled: false, maxRetries: 3, retryDelay: 1000 });
	});

	it('should return the configured retry options', () => {
		const opts = getOperationOptions(mockExec({
			'options.retry.retryEnabled': true,
			'options.retry.maxRetries': 5,
			'options.retry.retryDelay': 2000,
		}), 0);
		expect(opts.retry).toEqual({ enabled: true, maxRetries: 5, retryDelay: 2000 });
	});
});

// ─── isRetryableError ────────────────────────────────────────────────────────

describe('isRetryableError', () => {
	it('should retry on network/timeout error codes', () => {
		for (const code of ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ECONNABORTED', 'ENOTFOUND', 'EAI_AGAIN', 'EPIPE']) {
			expect(isRetryableError({ code })).toBe(true);
		}
	});

	it('should retry when the code is nested under cause', () => {
		expect(isRetryableError({ cause: { code: 'ECONNRESET' } })).toBe(true);
	});

	it('should retry on socket hang up and timeout messages', () => {
		expect(isRetryableError({ message: 'socket hang up' })).toBe(true);
		expect(isRetryableError({ message: 'Request timeout exceeded' })).toBe(true);
	});

	it('should retry on 429 and 5xx statuses', () => {
		expect(isRetryableError({ httpCode: 429 })).toBe(true);
		expect(isRetryableError({ response: { status: 500 } })).toBe(true);
		expect(isRetryableError({ response: { status: 503 } })).toBe(true);
	});

	it('should NOT retry on 4xx client errors', () => {
		expect(isRetryableError({ httpCode: 400 })).toBe(false);
		expect(isRetryableError({ response: { status: 401 } })).toBe(false);
		expect(isRetryableError({ response: { status: 404 } })).toBe(false);
	});

	it('should NOT retry on an unknown error', () => {
		expect(isRetryableError({ message: 'invalid XML payload' })).toBe(false);
		expect(isRetryableError({})).toBe(false);
	});
});

// ─── withRetry ───────────────────────────────────────────────────────────────

describe('withRetry', () => {
	const disabled = { enabled: false, maxRetries: 3, retryDelay: 0 };

	it('should return the result without retrying on success', async () => {
		const fn = jest.fn().mockResolvedValue('ok');
		const result = await withRetry(disabled, fn);
		expect(result).toBe('ok');
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('should not retry when disabled, even on a retryable error', async () => {
		const fn = jest.fn().mockRejectedValue({ code: 'ETIMEDOUT' });
		await expect(withRetry(disabled, fn)).rejects.toEqual({ code: 'ETIMEDOUT' });
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('should retry a transient error then succeed (fresh budget per call)', async () => {
		const retry = { enabled: true, maxRetries: 3, retryDelay: 0 };
		const fn = jest.fn()
			.mockRejectedValueOnce({ code: 'ECONNRESET' })
			.mockRejectedValueOnce({ code: 'ECONNRESET' })
			.mockResolvedValue('recovered');
		const result = await withRetry(retry, fn);
		expect(result).toBe('recovered');
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it('should rethrow after exhausting the retry budget', async () => {
		const retry = { enabled: true, maxRetries: 2, retryDelay: 0 };
		const fn = jest.fn().mockRejectedValue({ code: 'ETIMEDOUT' });
		await expect(withRetry(retry, fn)).rejects.toEqual({ code: 'ETIMEDOUT' });
		// 1 initial attempt + 2 retries
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it('should not retry a non-retryable error', async () => {
		const retry = { enabled: true, maxRetries: 3, retryDelay: 0 };
		const fn = jest.fn().mockRejectedValue({ httpCode: 404 });
		await expect(withRetry(retry, fn)).rejects.toEqual({ httpCode: 404 });
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('should call onRetry before each retry with the 1-based attempt number', async () => {
		const onRetry = jest.fn();
		const retry = { enabled: true, maxRetries: 3, retryDelay: 0, onRetry };
		const err = { code: 'ECONNRESET' };
		const fn = jest.fn()
			.mockRejectedValueOnce(err)
			.mockRejectedValueOnce(err)
			.mockResolvedValue('ok');
		await withRetry(retry, fn);
		expect(onRetry).toHaveBeenCalledTimes(2);
		expect(onRetry).toHaveBeenNthCalledWith(1, 1, err);
		expect(onRetry).toHaveBeenNthCalledWith(2, 2, err);
	});

	it('should not call onRetry when the error is not retryable', async () => {
		const onRetry = jest.fn();
		const retry = { enabled: true, maxRetries: 3, retryDelay: 0, onRetry };
		const fn = jest.fn().mockRejectedValue({ httpCode: 400 });
		await expect(withRetry(retry, fn)).rejects.toEqual({ httpCode: 400 });
		expect(onRetry).not.toHaveBeenCalled();
	});
});

// ─── describeError ───────────────────────────────────────────────────────────

describe('describeError', () => {
	it('should prefer the network code', () => {
		expect(describeError({ code: 'ETIMEDOUT' })).toBe('ETIMEDOUT');
		expect(describeError({ cause: { code: 'ECONNRESET' } })).toBe('ECONNRESET');
	});

	it('should fall back to the HTTP status', () => {
		expect(describeError({ httpCode: 503 })).toBe('HTTP 503');
		expect(describeError({ response: { status: 429 } })).toBe('HTTP 429');
	});

	it('should fall back to the message', () => {
		expect(describeError({ message: 'socket hang up' })).toBe('socket hang up');
	});

	it('should return a default label when nothing is available', () => {
		expect(describeError({})).toBe('unknown error');
	});
});
