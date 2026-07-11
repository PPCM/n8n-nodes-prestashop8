/**
 * Tests for confirmed uncovered scenarios identified by coverage analysis.
 *
 * Gaps covered:
 *  1. execute() create — field value is null → NodeOperationError
 *  2. execute() update — field value is null → NodeOperationError
 *  3. execute() search — advancedOptions.dateFormat → date=1 in URL
 *  4. buildUrlWithFilters — numeric 0 is included (not filtered as falsy)
 *  5. buildUrlWithFilters — rawMode=true omits output_format param
 *  6. convertValue float path (via simplifyPrestashopResponse)
 *  7. escapeXml special characters via buildCreateXml
 *  8. processDisplayParameter — custom with no customFields → returns 'custom'
 *  9. validateFieldsForCreate — multilingual field-name-2 strips to base name
 * 10. getSingularResource — non-mapped resource ending in non-s (via buildCreateXml)
 * 11. execute() — create/update field with whitespace-only name → NodeOperationError
 */

import { buildUrlWithFilters, validateFieldsForCreate } from '../../nodes/PrestaShop8/utils/filters';
import { processDisplayParameter, simplifyPrestashopResponse } from '../../nodes/PrestaShop8/utils/response';
import { buildCreateXml, buildUpdateXml } from '../../nodes/PrestaShop8/utils/xml';
import { PrestaShop8 } from '../../nodes/PrestaShop8/PrestaShop8.node';

// ─── Helper: minimal execute mock ─────────────────────────────────────────────

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

// ─── 1. execute() create — null field value ────────────────────────────────────

describe('execute() create — null field value throws NodeOperationError', () => {
	it('should throw "must have a value" when a field value is null', async () => {
		const mock = createMock({
			operation: 'create',
			resource: 'zones',
			'fieldsToCreate.standardField': [],
			'fieldsToCreate.customField': [{ name: 'name', value: null }],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow(/must have a value/);
	});

	it('should include the field name in the error message', async () => {
		const mock = createMock({
			operation: 'create',
			resource: 'zones',
			'fieldsToCreate.standardField': [],
			'fieldsToCreate.customField': [{ name: 'active', value: null }],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow(/"active"/);
	});
});

// ─── 2. execute() update — null field value ────────────────────────────────────

describe('execute() update — null field value throws NodeOperationError', () => {
	it('should throw "must have a value" when an update field value is null', async () => {
		const mock = createMock({
			operation: 'update',
			resource: 'products',
			id: '5',
			'fieldsToUpdate.standardField': [],
			'fieldsToUpdate.customField': [{ name: 'active', value: null }],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow(/must have a value/);
	});

	it('should throw when update field value is undefined', async () => {
		const mock = createMock({
			operation: 'update',
			resource: 'products',
			id: '5',
			'fieldsToUpdate.standardField': [],
			'fieldsToUpdate.customField': [{ name: 'price', value: undefined }],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow(/must have a value/);
	});
});

// ─── 3. execute() search — advancedOptions.dateFormat ─────────────────────────

describe('execute() search — advancedOptions.dateFormat appends date=1', () => {
	it('should append date=1 to URL when dateFormat is true', async () => {
		const mock = createMock({
			operation: 'search',
			filters: {
				standardFilter: [{ field: 'active', operator: 'EQ', value: '1' }],
				customFilter: [],
			},
			advancedOptions: { dateFormat: true },
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).toContain('date=1');
	});

	it('should NOT append date param when dateFormat is absent in search', async () => {
		const mock = createMock({
			operation: 'search',
			filters: {
				standardFilter: [{ field: 'active', operator: 'EQ', value: '1' }],
				customFilter: [],
			},
			advancedOptions: {},
		});
		mock.helpers.httpRequest.mockResolvedValue({ prestashop: { products: [] } });

		const node = new PrestaShop8();
		await node.execute.call(mock as any);

		const url: string = mock.helpers.httpRequest.mock.calls[0][0].url;
		expect(url).not.toMatch(/[?&]date=/);
	});
});

// ─── 4. buildUrlWithFilters — numeric 0 passes through ───────────────────────

describe('buildUrlWithFilters — numeric 0 is included', () => {
	it('should include value 0 in the URL (not filtered out as falsy)', () => {
		const url = buildUrlWithFilters('https://shop.com/api/products', { offset: 0 }, false);
		expect(url).toContain('offset=0');
	});

	it('should include boolean-false-equivalent numeric string "0" as a param', () => {
		const url = buildUrlWithFilters('https://shop.com/api/products', { active: 0 }, false);
		expect(url).toContain('active=0');
	});
});

// ─── 5. buildUrlWithFilters — rawMode omits output_format ─────────────────────

describe('buildUrlWithFilters — rawMode=true does not append output_format', () => {
	it('should NOT add output_format param when rawMode is true', () => {
		const url = buildUrlWithFilters('https://shop.com/api/products', { limit: 10 }, true);
		expect(url).not.toContain('output_format');
	});

	it('should add output_format=JSON when rawMode is false', () => {
		const url = buildUrlWithFilters('https://shop.com/api/products', { limit: 10 }, false);
		expect(url).toContain('output_format=JSON');
	});

	it('should add output_format=JSON by default (rawMode undefined)', () => {
		const url = buildUrlWithFilters('https://shop.com/api/products', { limit: 10 });
		expect(url).toContain('output_format=JSON');
	});
});

// ─── 6. convertValue float path ───────────────────────────────────────────────

describe('simplifyPrestashopResponse — float string converted to number', () => {
	it('should parse "9.99" as float 9.99', () => {
		const raw = {
			prestashop: {
				product: { id: '1', price: '9.99', active: '1' },
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product') as any;
		expect(result.price).toBe(9.99);
		expect(typeof result.price).toBe('number');
	});

	it('should parse "0.50" as float 0.5', () => {
		const raw = {
			prestashop: {
				product: { id: '2', price: '0.50' },
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product') as any;
		expect(result.price).toBe(0.5);
	});

	it('should NOT parse "9.9.9" as float (stays as string)', () => {
		const raw = {
			prestashop: {
				product: { id: '3', ref: '9.9.9' },
			},
		};
		const result = simplifyPrestashopResponse(raw, 'product') as any;
		expect(typeof result.ref).toBe('string');
	});
});

// ─── 7. escapeXml via buildCreateXml ──────────────────────────────────────────

describe('buildCreateXml — CDATA keeps values verbatim', () => {
	it('should keep < unescaped inside CDATA', () => {
		const xml = buildCreateXml('products', [{ name: 'description', value: 'price < 10' }]);
		expect(xml).toContain('<![CDATA[price < 10]]>');
		expect(xml).not.toContain('&lt;');
	});

	it('should keep > unescaped inside CDATA', () => {
		const xml = buildCreateXml('products', [{ name: 'description', value: 'qty > 0' }]);
		expect(xml).toContain('<![CDATA[qty > 0]]>');
		expect(xml).not.toContain('&gt;');
	});

	it('should keep & unescaped inside CDATA', () => {
		const xml = buildCreateXml('products', [{ name: 'name', value: 'Salt & Pepper' }]);
		expect(xml).toContain('<![CDATA[Salt & Pepper]]>');
		expect(xml).not.toContain('&amp;');
	});

	it('should keep " unescaped inside CDATA', () => {
		const xml = buildCreateXml('products', [{ name: 'name', value: 'say "hello"' }]);
		expect(xml).toContain('<![CDATA[say "hello"]]>');
	});

	it('should keep single quote unescaped inside CDATA', () => {
		const xml = buildCreateXml('products', [{ name: 'name', value: "it's fine" }]);
		expect(xml).toContain("<![CDATA[it's fine]]>");
	});

	it('should split ]]> across CDATA sections to prevent breakout', () => {
		const xml = buildCreateXml('products', [{ name: 'description', value: 'evil]]><injected/>' }]);
		expect(xml).toContain(']]]]><![CDATA[>');
		expect(xml).not.toContain('<![CDATA[evil]]><injected/>]]>');
	});

	it('should not escape plain text', () => {
		const xml = buildCreateXml('products', [{ name: 'name', value: 'Widget Pro' }]);
		expect(xml).toContain('Widget Pro');
	});
});

// ─── 8. processDisplayParameter — custom with no customFields ─────────────────

describe('processDisplayParameter — custom with no customFields', () => {
	it('should throw when display is custom but customFields is empty', () => {
		// 'display=custom' is not a valid PrestaShop value: must fail clearly
		expect(() => processDisplayParameter('custom', 'products', '')).toThrow(
			/requires at least one field/,
		);
	});

	it('should throw when display is custom but customFields is undefined', () => {
		expect(() => processDisplayParameter('custom', 'products', undefined)).toThrow(
			/requires at least one field/,
		);
	});

	it('should still wrap fields when customFields is provided', () => {
		const result = processDisplayParameter('custom', 'products', 'id,name');
		expect(result).toBe('[id,name]');
	});
});

// ─── 9. validateFieldsForCreate — multilingual field strips language suffix ───

describe('validateFieldsForCreate — multilingual field name stripping', () => {
	it('should accept name-1 as satisfying the "name" required field', () => {
		const result = validateFieldsForCreate('categories', [
			{ name: 'name-1', value: 'Test Category' },
			{ name: 'id_parent', value: '2' },
		]);
		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should accept name-2 as satisfying the "name" required field', () => {
		const result = validateFieldsForCreate('categories', [
			{ name: 'name-2', value: 'Test Category FR' },
			{ name: 'id_parent', value: '2' },
		]);
		expect(result.isValid).toBe(true);
	});

	it('should accept multiple language variants and still pass validation', () => {
		const result = validateFieldsForCreate('products', [
			{ name: 'name-1', value: 'Widget EN' },
			{ name: 'name-2', value: 'Widget FR' },
			{ name: 'price', value: '9.99' },
			{ name: 'id_category_default', value: '2' },
		]);
		expect(result.isValid).toBe(true);
	});

	it('should fail when even the base name is absent (no name or name-N)', () => {
		const result = validateFieldsForCreate('categories', [
			{ name: 'id_parent', value: '2' },
			// 'name' and 'name-N' are missing
		]);
		expect(result.isValid).toBe(false);
		expect(result.errors[0]).toContain('name');
	});
});

// ─── 10. getSingularResource (via buildCreateXml/buildUpdateXml) ───────────────

describe('buildCreateXml — getSingularResource fallback logic', () => {
	it('should remove trailing -s for regular resources (products → product)', () => {
		const xml = buildCreateXml('products', [{ name: 'active', value: '1' }]);
		expect(xml).toContain('<product>');
		expect(xml).toContain('</product>');
	});

	it('should handle SINGULAR_RESOURCE_MAP entry: categories → category', () => {
		const xml = buildCreateXml('categories', [{ name: 'active', value: '1' }]);
		expect(xml).toContain('<category>');
		expect(xml).toContain('</category>');
	});

	it('should handle SINGULAR_RESOURCE_MAP entry: addresses → address', () => {
		const xml = buildCreateXml('addresses', [{ name: 'city', value: 'Paris' }]);
		expect(xml).toContain('<address>');
	});

	it('should keep resource name unchanged when it does not end in s (e.g. tax_rule)', () => {
		// tax_rule ends in 'e', not 's' → no stripping
		const xml = buildCreateXml('tax_rule', [{ name: 'rate', value: '5' }]);
		expect(xml).toContain('<tax_rule>');
		expect(xml).toContain('</tax_rule>');
	});

	it('should use correct singular in buildUpdateXml too', () => {
		const xml = buildUpdateXml('orders', '42', [{ name: 'total_paid', value: '100' }]);
		expect(xml).toContain('<order>');
		expect(xml).toContain('<id>');
	});
});

// ─── 11. execute() create/update — whitespace-only field name ─────────────────

describe('execute() create/update — whitespace-only field name', () => {
	it('create: should throw when field name is only whitespace', async () => {
		const mock = createMock({
			operation: 'create',
			resource: 'zones',
			'fieldsToCreate.standardField': [],
			'fieldsToCreate.customField': [{ name: '   ', value: 'test' }],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow(/must have a name/i);
	});

	it('update: should throw when field name is only whitespace', async () => {
		const mock = createMock({
			operation: 'update',
			resource: 'products',
			id: '1',
			'fieldsToUpdate.standardField': [],
			'fieldsToUpdate.customField': [{ name: '   ', value: 'test' }],
		});

		const node = new PrestaShop8();
		await expect(node.execute.call(mock as any)).rejects.toThrow(/must have a name/i);
	});
});
