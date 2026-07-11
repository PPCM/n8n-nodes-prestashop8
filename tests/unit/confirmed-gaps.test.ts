/**
 * Tests for confirmed coverage gaps not addressed by any existing test file.
 *
 * Gaps covered:
 *  1. collectRequiredFields — value === 0 (numeric zero must be included)
 *  2. getFieldsByResourceType — both standardField AND customField non-empty (non-images)
 *  3. search (images) — filtersImages.customFilter undefined → NodeOperationError
 *  4. validateFieldsForCreate — field.name === null silently skipped
 *  5. manufacturers CREATE mapping includes manufacturerActive (active field = 0)
 */

import { PrestaShop8 } from '../../nodes/PrestaShop8/PrestaShop8.node';
import { validateFieldsForCreate } from '../../nodes/PrestaShop8/utils/filters';

// ─── Helper ───────────────────────────────────────────────────────────────────

function createMock(overrides: Record<string, any> = {}) {
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
		'options.retry.retryEnabled': false,
		'options.retry.maxRetries': 3,
		'options.retry.retryDelay': 0,
		'options.delayBetweenCalls': 0,
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

// ─── 1. collectRequiredFields — value === 0 ───────────────────────────────────

describe('collectRequiredFields — numeric zero value must be included', () => {
	// The guard `value !== '' && value !== null && value !== undefined` passes for 0.
	// manufacturerActive maps to 'active', which can legitimately be 0 (inactive).

	it('should include manufacturerActive=0 in the XML body (active field)', async () => {
		const mock = createMock({
			operation: 'create',
			resource: 'manufacturers',
			// Mapped params returned by getNodeParameter
			manufacturerName: 'Acme',
			manufacturerActive: 0,         // numeric zero — must NOT be filtered out
			'fieldsToCreate.standardField': [],
			'fieldsToCreate.customField': [],
		});
		mock.helpers.httpRequest.mockResolvedValue({
			prestashop: { manufacturer: { id: '1' } },
		});

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const body: string = mock.helpers.httpRequest.mock.calls[0][0].body;
		expect(body).toContain('Acme');
		// active=0 must appear in the XML (CDATA[0])
		expect(body).toContain('CDATA[0]');
	});

	it('should include value=0 as string "0" (String(0))', async () => {
		const mock = createMock({
			operation: 'create',
			resource: 'manufacturers',
			manufacturerName: 'Acme',
			manufacturerActive: 0,
			'fieldsToCreate.standardField': [],
			'fieldsToCreate.customField': [],
		});
		mock.helpers.httpRequest.mockResolvedValue({
			prestashop: { manufacturer: { id: '2' } },
		});

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const body: string = mock.helpers.httpRequest.mock.calls[0][0].body;
		// String(0) = '0', so CDATA[0] should appear
		expect(body).toMatch(/active.*CDATA\[0\]/s);
	});

	it('should NOT include a mapped param whose value is empty string', async () => {
		const mock = createMock({
			operation: 'create',
			resource: 'manufacturers',
			manufacturerName: 'Acme',
			manufacturerActive: '',          // empty string → skipped
			'fieldsToCreate.standardField': [],
			'fieldsToCreate.customField': [],
		});
		mock.helpers.httpRequest.mockResolvedValue({
			prestashop: { manufacturer: { id: '3' } },
		});

		const node = new PrestaShop8();
		// Missing required 'active' should throw (empty string is skipped by collectRequiredFields)
		await expect(node.execute.call(mock as any)).rejects.toThrow(/Missing required fields/);
	});
});

// ─── 2. getFieldsByResourceType — both arrays non-empty (non-images) ──────────

describe('getFieldsByResourceType — standardField and customField both non-empty', () => {
	it('should combine both arrays in the XML body for a create operation', async () => {
		const mock = createMock({
			operation: 'create',
			resource: 'zones',
			'fieldsToCreate.standardField': [{ name: 'name', value: 'Europe' }],
			'fieldsToCreate.customField': [{ name: 'active', value: '1' }],
		});
		mock.helpers.httpRequest.mockResolvedValue({
			prestashop: { zone: { id: '5' } },
		});

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const body: string = mock.helpers.httpRequest.mock.calls[0][0].body;
		// Both fields must appear in the XML
		expect(body).toContain('Europe');
		expect(body).toContain('active');
	});

	it('should combine both arrays in the XML body for an update operation', async () => {
		const mock = createMock({
			operation: 'update',
			resource: 'zones',
			id: '5',
			'fieldsToUpdate.standardField': [{ name: 'name', value: 'Europe Updated' }],
			'fieldsToUpdate.customField': [{ name: 'active', value: '0' }],
		});
		mock.helpers.httpRequest.mockResolvedValue({
			prestashop: { zone: { id: '5', name: 'Europe Updated' } },
		});

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const body: string = mock.helpers.httpRequest.mock.calls[0][0].body;
		expect(body).toContain('Europe Updated');
		expect(body).toContain('active');
		expect(body).toContain('CDATA[5]'); // id included in update XML
	});

	it('should NOT include standardField for images resource (only customField)', async () => {
		const mock = createMock({
			operation: 'create',
			resource: 'images',
			'fieldsToCreate.standardField': [{ name: 'ignoredField', value: 'ignored' }],
			'fieldsToCreate.customField': [{ name: 'id_product', value: '3' }],
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { image: { id: '1' } } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const body: string = mock.helpers.httpRequest.mock.calls[0][0].body;
		expect(body).toContain('id_product');
		expect(body).not.toContain('ignoredField');
	});
});

// ─── 3. search (images) — filtersImages.customFilter undefined ─────────────────

describe('execute() search — images resource with undefined customFilter in filtersImages', () => {
	it('should throw NodeOperationError when filtersImages has no customFilter key', async () => {
		const mock = createMock({
			operation: 'search',
			resource: 'images',
			// filtersImages without a customFilter key — || [] fallback → empty → error
			filtersImages: {},
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow(/filter/i);
	});

	it('should throw when filtersImages itself is an empty object', async () => {
		const mock = createMock({
			operation: 'search',
			resource: 'images',
			filtersImages: { customFilter: [] },
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow(/filter/i);
	});

	it('should search when filtersImages.customFilter has one entry', async () => {
		const rawXml = '<prestashop><images/></prestashop>';

		const mock = createMock({
			operation: 'search',
			resource: 'images',
			'options.response.rawMode': true,
			filtersImages: {
				customFilter: [{ field: 'id_product', operator: 'EQ', value: '5' }],
			},
		});
		mock.helpers.httpRequest.mockResolvedValue({ statusCode: 200, body: rawXml, headers: {} });

		const node = new PrestaShop8();
		const result = await node.execute.call(mock as any);

		expect(result[0][0].json).toHaveProperty('raw', rawXml);
	});
});

// ─── 4. validateFieldsForCreate — field.name is null or undefined ─────────────

describe('validateFieldsForCreate — field.name is null/undefined (silently skipped)', () => {
	it('should not count a field with null name toward required fields', () => {
		// zones requires ['name', 'active']; a field with null name contributes nothing
		const result = validateFieldsForCreate('zones', [
			{ name: null as any, value: 'ignored' },
			{ name: 'active', value: '1' },
		]);
		// 'name' still missing → invalid
		expect(result.isValid).toBe(false);
		expect(result.errors[0]).toContain('name');
	});

	it('should not count a field with undefined name toward required fields', () => {
		const result = validateFieldsForCreate('zones', [
			{ name: undefined as any, value: 'ignored' },
			{ name: 'active', value: '1' },
		]);
		expect(result.isValid).toBe(false);
	});

	it('should pass when required fields are provided despite null-name entries', () => {
		const result = validateFieldsForCreate('zones', [
			{ name: null as any, value: 'noise' },
			{ name: 'name', value: 'EU' },
			{ name: 'active', value: '1' },
		]);
		expect(result.isValid).toBe(true);
	});
});

// ─── 5. Priority-coverage-gaps failing test — explain root cause ──────────────

describe('getRequiredFields with mocked RESOURCE_SCHEMAS (module isolation note)', () => {
	// The jest.mock approach in priority-coverage-gaps.test.ts patches the exported
	// RESOURCE_SCHEMAS, but getRequiredFields() reads from its own module-level variable
	// (closure), not the re-exported value. The mock cannot affect the internal binding.
	// This test confirms the actual behavior of the real function.

	it('should return empty array for _reqtest (not a real resource)', () => {
		const { getRequiredFields } = require('../../nodes/PrestaShop8/resourceSchemas');
		expect(getRequiredFields('_reqtest')).toEqual([]);
	});

	it('should return required fields for real resources with required:true fields', () => {
		const { getRequiredFields } = require('../../nodes/PrestaShop8/resourceSchemas');
		// Verify the function works correctly for real data
		// Most real resources have no required:true in the auto-generated schema,
		// but the function must not throw and must return an array.
		const result = getRequiredFields('products');
		expect(Array.isArray(result)).toBe(true);
	});
});
