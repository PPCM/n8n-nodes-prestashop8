import {
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { IPrestaShopCredentials } from '../types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const axios = require('axios');

/**
 * Map of filter operators to their PrestaShop format templates.
 * {v} is replaced by the filter value.
 */
export const FILTER_OPERATOR_FORMATS: Record<string, { template: string; requiresValue: boolean }> = {
	'EQ':           { template: '[{v}]',  requiresValue: true },
	'=':            { template: '[{v}]',  requiresValue: true }, // legacy alias (custom filters / API)
	'!=':           { template: '![{v}]', requiresValue: true },
	'>':            { template: '>[{v}]', requiresValue: true },
	'>=':           { template: '>=[{v}]', requiresValue: true },
	'<':            { template: '<[{v}]', requiresValue: true },
	'<=':           { template: '<=[{v}]', requiresValue: true },
	'CONTAINS':     { template: '%[{v}]%', requiresValue: true },
	'BEGINS':       { template: '[{v}]%', requiresValue: true },
	'ENDS':         { template: '%[{v}]', requiresValue: true },
	'IS_EMPTY':     { template: '[]', requiresValue: false },
	'IS_NOT_EMPTY': { template: '![]', requiresValue: false },
};

/**
 * Common operation options extracted once per iteration
 */
export interface OperationOptions {
	timeout: number;
	neverError: boolean;
	includeResponseHeaders: boolean;
	rawMode: boolean;
	showRequestInfo: boolean;
	showRequestUrl: boolean;
	delayBetweenCalls: number;
	retry: RetryOptions;
}

/**
 * Retry configuration applied to each individual HTTP call.
 * The retry budget is per call: every failing call gets a fresh set of attempts.
 */
export interface RetryOptions {
	enabled: boolean;
	maxRetries: number;
	retryDelay: number;
}

/**
 * Pause execution for the given number of milliseconds (used to throttle calls).
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine whether an error is transient and worth retrying.
 * Retries on network/timeout errors, 5xx server errors and 429 rate-limit.
 * Never retries on 4xx (invalid key, not found, invalid XML, etc.).
 */
export function isRetryableError(error: any): boolean {
	// Network / timeout errors expose a code on the error or its cause
	const code = error?.code || error?.cause?.code;
	const retryableCodes = [
		'ETIMEDOUT',
		'ECONNRESET',
		'ECONNREFUSED',
		'ECONNABORTED',
		'ENOTFOUND',
		'EAI_AGAIN',
		'EPIPE',
	];
	if (code && retryableCodes.includes(code)) {
		return true;
	}

	// "socket hang up" and timeout messages have no stable code
	const message = String(error?.message || '').toLowerCase();
	if (message.includes('socket hang up') || message.includes('timeout')) {
		return true;
	}

	// HTTP status: retry on 429 (rate-limit) and 5xx (server errors) only
	const status = error?.httpCode || error?.response?.status;
	if (status === 429 || (status >= 500 && status <= 599)) {
		return true;
	}

	return false;
}

/**
 * Run an async HTTP operation with per-call retry on transient errors.
 * Each call gets its own retry budget; on the last attempt the error is rethrown
 * so existing neverError / continueOnFail handling applies unchanged.
 */
export async function withRetry<T>(retry: RetryOptions, fn: () => Promise<T>): Promise<T> {
	const maxRetries = retry.enabled ? Math.max(0, retry.maxRetries) : 0;

	for (let attempt = 0; ; attempt++) {
		try {
			return await fn();
		} catch (error) {
			if (attempt >= maxRetries || !isRetryableError(error)) {
				throw error;
			}
			if (retry.retryDelay > 0) {
				await sleep(retry.retryDelay);
			}
		}
	}
}

/**
 * Extract common operation options from node parameters
 */
export function getOperationOptions(executeFunctions: IExecuteFunctions, itemIndex: number): OperationOptions {
	return {
		timeout: executeFunctions.getNodeParameter('options.timeout', itemIndex, 30000) as number,
		neverError: executeFunctions.getNodeParameter('options.response.neverError', itemIndex, false) as boolean,
		includeResponseHeaders: executeFunctions.getNodeParameter('options.response.includeResponseHeaders', itemIndex, false) as boolean,
		rawMode: executeFunctions.getNodeParameter('options.response.rawMode', itemIndex, false) as boolean,
		showRequestInfo: executeFunctions.getNodeParameter('options.request.showRequestInfo', itemIndex, false) as boolean,
		showRequestUrl: executeFunctions.getNodeParameter('options.request.showRequestUrl', itemIndex, false) as boolean,
		delayBetweenCalls: executeFunctions.getNodeParameter('options.delayBetweenCalls', itemIndex, 0) as number,
		retry: {
			enabled: executeFunctions.getNodeParameter('options.retry.retryEnabled', itemIndex, false) as boolean,
			maxRetries: executeFunctions.getNodeParameter('options.retry.maxRetries', itemIndex, 3) as number,
			retryDelay: executeFunctions.getNodeParameter('options.retry.retryDelay', itemIndex, 1000) as number,
		},
	};
}

/**
 * Build HTTP request options with appropriate headers
 */
export function buildHttpOptions(method: IHttpRequestMethods, url: string, credentials: IPrestaShopCredentials, rawMode: boolean, timeout: number, body?: string): IHttpRequestOptions {
	const headers: Record<string, string> = {};

	// Add Content-Type for requests with body (POST, PATCH, PUT)
	if (body && ['POST', 'PATCH', 'PUT'].includes(method)) {
		headers['Content-Type'] = 'application/xml';
	}

	// Add Output-Format header based on mode
	headers['Output-Format'] = rawMode ? 'XML' : 'JSON';

	return {
		method,
		url,
		auth: {
			username: credentials.apiKey,
			password: '',
		},
		headers,
		timeout,
		...(rawMode ? { json: false } : {}),
		...(body && { body }),
	};
}

/**
 * Capture complete request information for debugging
 */
export function captureRequestDebugInfo(options: any, credentials: any, rawMode: boolean, operation: string, resource: string, body?: string): any {
	return {
		method: options.method,
		url: options.url,
		headers: {
			...options.headers,
			'Authorization': `Basic ${Buffer.from(credentials.apiKey + ':').toString('base64')}`,
			'User-Agent': 'n8n-prestashop8-node/1.0.0',
		},
		authentication: {
			type: 'Basic Auth',
			username: credentials.apiKey,
			password: '[HIDDEN]',
			baseUrl: credentials.baseUrl,
		},
		operation: operation,
		resource: resource,
		mode: rawMode ? 'Raw XML' : 'JSON',
		timeout: options.timeout,
		...(body && { body: body }),
		...(options.json !== undefined && { jsonParsing: options.json }),
	};
}

/**
 * Wrap response with optional headers and status information
 */
export function wrapResponse(processedResponse: any, includeHeaders: boolean, headers?: any, statusCode?: number): any {
	if (includeHeaders) {
		return {
			body: processedResponse,
			headers: headers || {},
			statusCode: statusCode || 200,
			statusMessage: statusCode && statusCode >= 200 && statusCode < 300 ? 'OK' : 'Error',
		};
	}
	return processedResponse;
}

/**
 * Execute HTTP request with debug capture and response metadata
 */
export async function executeHttpRequest(
	helpers: any,
	options: IHttpRequestOptions,
	credentials: any,
	rawMode: boolean,
	operation: string,
	resource: string,
	neverError: boolean = false,
	body?: string,
	retry: RetryOptions = { enabled: false, maxRetries: 0, retryDelay: 0 },
): Promise<{ response: any; debugInfo: any; url: string; responseHeaders?: any; statusCode?: number }> {
	const requestUrl = options.url as string;
	const debugInfo = captureRequestDebugInfo(options, credentials, rawMode, operation, resource, body);

	try {
		const response = await withRetry(retry, () => helpers.httpRequest(options));

		return {
			response,
			debugInfo,
			url: requestUrl,
			responseHeaders: {},
			statusCode: 200,
		};
	} catch (error: any) {
		if (neverError) {
			const errorResponse = {
				status: error.httpCode || error.response?.status || 500,
				message: error.response?.data || '',
			};

			return {
				response: errorResponse,
				debugInfo,
				url: requestUrl,
				responseHeaders: error.response?.headers || {},
				statusCode: error.httpCode || error.response?.status || 500,
			};
		}
		throw error;
	}
}

/**
 * Execute a raw mode request using axios directly (bypasses n8n parsing)
 */
export async function executeRawModeRequest(
	requestUrl: string,
	credentials: IPrestaShopCredentials,
	timeout: number,
	neverError: boolean,
	includeResponseHeaders: boolean,
	operation: string,
	resource: string,
	retry: RetryOptions = { enabled: false, maxRetries: 0, retryDelay: 0 },
): Promise<{ responseData: any; requestDebugInfo: any; requestHeaders: any }> {
	let responseData: any;
	try {
		const axiosResponse = await withRetry<any>(retry, () => axios({
			method: 'GET',
			url: requestUrl,
			auth: {
				username: credentials.apiKey,
				password: '',
			},
			headers: { 'Output-Format': 'XML' },
			timeout: timeout || 30000,
			transformResponse: [(data: any) => data],
			validateStatus: neverError ? () => true : undefined,
		}));

		const requestDebugInfo = captureRequestDebugInfo({
			method: 'GET',
			url: requestUrl,
			headers: { 'Output-Format': 'XML' },
			timeout,
		}, credentials, true, operation, resource);
		const requestHeaders = requestDebugInfo.headers;

		if (neverError && (axiosResponse.status < 200 || axiosResponse.status >= 300)) {
			responseData = { status: axiosResponse.status, message: axiosResponse.data || '' };
		} else {
			const processedResponse = { raw: axiosResponse.data };
			responseData = wrapResponse(processedResponse, includeResponseHeaders, axiosResponse.headers, axiosResponse.status);
		}
		return { responseData, requestDebugInfo, requestHeaders };
	} catch (error: any) {
		if (neverError) {
			responseData = { status: error.response?.status || 500, message: error.response?.data || '' };
			return { responseData, requestDebugInfo: {}, requestHeaders: {} };
		}
		throw error;
	}
}
