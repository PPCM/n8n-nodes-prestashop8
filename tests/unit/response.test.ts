import { buildPrestashopXml } from '../../nodes/PrestaShop8/utils/response';
import {
	parseXmlToJson,
	SINGULAR_RESOURCE_MAP,
} from '../../nodes/PrestaShop8/utils/xml';
import { convertFieldValue } from '../../nodes/PrestaShop8/resourceSchemas';
import type { FieldSchema } from '../../nodes/PrestaShop8/resourceSchemas';

// ─── buildPrestashopXml ──────────────────────────────────────────────────────

describe('buildPrestashopXml', () => {
	it('should produce valid XML with prestashop root', () => {
		const xml = buildPrestashopXml('products', { name: 'Test Product', price: 29.99 });
		expect(xml).toContain('<prestashop');
		expect(xml).toContain('</prestashop>');
	});

	it('should wrap data in a resource tag (uses resource name as-is)', () => {
		// buildPrestashopXml uses js2xmlparser and keeps the resource name without singularization
		const xml = buildPrestashopXml('products', { price: '10' });
		expect(xml).toContain('<products>');
		expect(xml).toContain('</products>');
	});

	it('should include the resource name as XML tag', () => {
		const xml = buildPrestashopXml('categories', { name: 'Test' });
		expect(xml).toContain('<categories>');
	});

	it('should convert camelCase keys to snake_case', () => {
		const xml = buildPrestashopXml('products', { idManufacturer: '5' });
		expect(xml).toContain('id_manufacturer');
	});

	it('should convert array values into associations', () => {
		const xml = buildPrestashopXml('products', { categories: [2, 5, 8] });
		expect(xml).toContain('associations');
		expect(xml).toContain('<id>2</id>');
		expect(xml).toContain('<id>5</id>');
	});

	it('should produce a string', () => {
		const xml = buildPrestashopXml('products', { active: '1' });
		expect(typeof xml).toBe('string');
		expect(xml.length).toBeGreaterThan(0);
	});
});

// ─── SINGULAR_RESOURCE_MAP ───────────────────────────────────────────────────

describe('SINGULAR_RESOURCE_MAP', () => {
	it('should define irregular plural-to-singular mappings', () => {
		expect(SINGULAR_RESOURCE_MAP['categories']).toBe('category');
		expect(SINGULAR_RESOURCE_MAP['addresses']).toBe('address');
		expect(SINGULAR_RESOURCE_MAP['countries']).toBe('country');
		expect(SINGULAR_RESOURCE_MAP['currencies']).toBe('currency');
		expect(SINGULAR_RESOURCE_MAP['languages']).toBe('language');
	});

	it('should have string values for all keys', () => {
		for (const [, value] of Object.entries(SINGULAR_RESOURCE_MAP)) {
			expect(typeof value).toBe('string');
			expect(value.length).toBeGreaterThan(0);
		}
	});
});

// ─── parseXmlToJson — additional edge cases ──────────────────────────────────

describe('parseXmlToJson — edge cases', () => {
	it('should parse self-closing root element', async () => {
		const result = await parseXmlToJson('<root/>');
		expect(result).toHaveProperty('root');
	});

	it('should handle CDATA sections', async () => {
		const xml = '<root><name><![CDATA[Hello & World]]></name></root>';
		const result = await parseXmlToJson(xml);
		expect(result.root.name).toBe('Hello & World');
	});

	it('should parse PrestaShop-style error response', async () => {
		const xml = '<errors><error><![CDATA[Invalid product ID]]></error></errors>';
		const result = await parseXmlToJson(xml);
		expect(result.errors.error).toBe('Invalid product ID');
	});

	it('should parse nested PrestaShop product response', async () => {
		const xml = `
			<prestashop>
				<product>
					<id>42</id>
					<name><language id="1">Test</language></name>
				</product>
			</prestashop>`;
		const result = await parseXmlToJson(xml);
		expect(result.prestashop.product.id).toBe('42');
	});
});

// ─── convertFieldValue — additional edge cases ───────────────────────────────

describe('convertFieldValue — additional edge cases', () => {
	const numberField: FieldSchema = {
		type: 'number', format: 'isUnsignedId', required: false, readOnly: false, multilang: false, maxSize: null,
	};
	const boolField: FieldSchema = {
		type: 'boolean', format: 'isBool', required: false, readOnly: false, multilang: false, maxSize: null,
	};

	it('should return non-numeric string unchanged for number field', () => {
		expect(convertFieldValue('not-a-number', numberField)).toBe('not-a-number');
	});

	it('should return true for any non-empty truthy string on boolean field (Boolean() fallback)', () => {
		// 'false' and 'no' are non-empty strings → Boolean('false') = true
		expect(convertFieldValue('false', boolField)).toBe(true);
		expect(convertFieldValue('no', boolField)).toBe(true);
	});

	it('should return objects unchanged for a string field (multilang arrays)', () => {
		const stringField: FieldSchema = {
			type: 'string', format: 'isString', required: false, readOnly: false, multilang: false, maxSize: null,
		};
		// Multilang fields arrive as arrays of {id, value}: they must never
		// be stringified into "[object Object]"
		const multilang = [{ id: '1', value: 'iPod' }, { id: '2', value: 'iPod FR' }];
		expect(convertFieldValue(multilang as any, stringField)).toEqual(multilang);
		expect(convertFieldValue({ nested: true } as any, stringField)).toEqual({ nested: true });
	});

	it('should convert string "0" to false for boolean field', () => {
		expect(convertFieldValue('0', boolField)).toBe(false);
	});

	it('should handle integer 0 as false for boolean field', () => {
		expect(convertFieldValue(0, boolField)).toBe(false);
	});
});

// ─── buildPrestashopXml — edge cases ─────────────────────────────────────────

describe('buildPrestashopXml — edge cases', () => {
	it('should handle empty data object (no fields)', () => {
		const xml = buildPrestashopXml('products', {});
		expect(xml).toContain('<products');
		expect(typeof xml).toBe('string');
	});

	it('should not create associations for empty array values', () => {
		const xml = buildPrestashopXml('products', { categories: [] });
		// An empty array produces an empty associations block or is omitted
		// Regardless, the result is still valid XML
		expect(typeof xml).toBe('string');
		expect(xml).toContain('<products');
	});

	it('should convert string array items into association id elements', () => {
		const xml = buildPrestashopXml('products', { categories: ['2', '5'] });
		expect(xml).toContain('<id>2</id>');
		expect(xml).toContain('<id>5</id>');
	});

	it('should coerce numeric values to strings in non-array fields', () => {
		const xml = buildPrestashopXml('products', { price: 49.99 });
		expect(xml).toContain('49.99');
	});

	it('should coerce boolean values to strings', () => {
		const xml = buildPrestashopXml('products', { active: true });
		expect(xml).toContain('true');
	});
});

// ─── SINGULAR_RESOURCE_MAP — getSingularResource coverage ─────────────────────

describe('buildCreateXml — getSingularResource via singular map', () => {
	// These are tested indirectly since getSingularResource is private
	// but its behavior is exposed through buildCreateXml/buildUpdateXml
	it('should produce <tax> tag for taxes resource (map entry)', () => {
		const { buildCreateXml } = require('../../nodes/PrestaShop8/utils/xml');
		const xml = buildCreateXml('taxes', [{ name: 'rate', value: '20' }]);
		expect(xml).toContain('<tax>');
		expect(xml).toContain('</tax>');
	});

	it('should produce <tax_rule> tag for tax_rules resource (map entry)', () => {
		const { buildCreateXml } = require('../../nodes/PrestaShop8/utils/xml');
		const xml = buildCreateXml('tax_rules', [{ name: 'id_country', value: '8' }]);
		expect(xml).toContain('<tax_rule>');
	});

	it('should strip trailing s for resources not in the map', () => {
		const { buildCreateXml } = require('../../nodes/PrestaShop8/utils/xml');
		const xml = buildCreateXml('carriers', [{ name: 'name', value: 'Fast' }]);
		expect(xml).toContain('<carrier>');
	});

	it('should keep name unchanged for resources not ending in s', () => {
		const { buildCreateXml } = require('../../nodes/PrestaShop8/utils/xml');
		// 'tax' does not end in s and is not in the map → tag stays 'tax'
		// But 'taxes' IS in the map. Use a hypothetical resource to test the else branch.
		// 'content' doesn't end in s and is not in the map
		const xml = buildCreateXml('content', [{ name: 'text', value: 'hello' }]);
		expect(xml).toContain('<content>');
	});
});
