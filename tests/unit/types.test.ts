import {
	PRESTASHOP_RESOURCES,
	IPrestaShopResource,
	FILTER_OPERATORS,
} from '../../nodes/PrestaShop8/types';

describe('PRESTASHOP_RESOURCES', () => {
	it('should contain exactly 34 resources', () => {
		expect(Object.keys(PRESTASHOP_RESOURCES).length).toBe(34);
	});

	it('should expose order_invoices with full CRUD support', () => {
		const invoices = PRESTASHOP_RESOURCES['order_invoices'];
		expect(invoices).toBeDefined();
		expect(invoices.supportsList).toBe(true);
		expect(invoices.supportsGetById).toBe(true);
		expect(invoices.supportsSearch).toBe(true);
	});

	it('should have dictionary key matching resource.name for every entry', () => {
		for (const [key, resource] of Object.entries(PRESTASHOP_RESOURCES)) {
			expect(resource.name).toBe(key);
		}
	});

	it('should have complete IPrestaShopResource structure for each resource', () => {
		const requiredKeys: (keyof IPrestaShopResource)[] = [
			'name',
			'displayName',
			'description',
			'supportsCreate',
			'supportsUpdate',
			'supportsDelete',
			'supportsList',
			'supportsGetById',
			'supportsSearch',
		];

		for (const [key, resource] of Object.entries(PRESTASHOP_RESOURCES)) {
			for (const prop of requiredKeys) {
				expect(resource).toHaveProperty(prop);
			}
			// Type checks
			expect(typeof resource.name).toBe('string');
			expect(typeof resource.displayName).toBe('string');
			expect(typeof resource.description).toBe('string');
			expect(typeof resource.supportsCreate).toBe('boolean');
			expect(typeof resource.supportsUpdate).toBe('boolean');
			expect(typeof resource.supportsDelete).toBe('boolean');
			expect(typeof resource.supportsList).toBe('boolean');
			expect(typeof resource.supportsGetById).toBe('boolean');
			expect(typeof resource.supportsSearch).toBe('boolean');
		}
	});

	// Resources with limited capabilities
	describe('Limited capability resources', () => {
		it('stock_availables: no create, no delete', () => {
			const r = PRESTASHOP_RESOURCES['stock_availables'];
			expect(r.supportsCreate).toBe(false);
			expect(r.supportsDelete).toBe(false);
			expect(r.supportsUpdate).toBe(true);
			expect(r.supportsList).toBe(true);
			expect(r.supportsGetById).toBe(true);
			expect(r.supportsSearch).toBe(true);
		});

		it('order_details: no create, no delete', () => {
			const r = PRESTASHOP_RESOURCES['order_details'];
			expect(r.supportsCreate).toBe(false);
			expect(r.supportsDelete).toBe(false);
			expect(r.supportsUpdate).toBe(true);
			expect(r.supportsList).toBe(true);
			expect(r.supportsGetById).toBe(true);
			expect(r.supportsSearch).toBe(true);
		});

		it('order_histories: no update, no delete', () => {
			const r = PRESTASHOP_RESOURCES['order_histories'];
			expect(r.supportsCreate).toBe(true);
			expect(r.supportsUpdate).toBe(false);
			expect(r.supportsDelete).toBe(false);
			expect(r.supportsList).toBe(true);
			expect(r.supportsGetById).toBe(true);
			expect(r.supportsSearch).toBe(true);
		});

		it('configurations: no create, no delete', () => {
			const r = PRESTASHOP_RESOURCES['configurations'];
			expect(r.supportsCreate).toBe(false);
			expect(r.supportsDelete).toBe(false);
			expect(r.supportsUpdate).toBe(true);
			expect(r.supportsList).toBe(true);
			expect(r.supportsGetById).toBe(true);
			expect(r.supportsSearch).toBe(true);
		});

		it('stock_movements: read-only (no create, update, or delete)', () => {
			const r = PRESTASHOP_RESOURCES['stock_movements'];
			expect(r.supportsCreate).toBe(false);
			expect(r.supportsUpdate).toBe(false);
			expect(r.supportsDelete).toBe(false);
			expect(r.supportsList).toBe(true);
			expect(r.supportsGetById).toBe(true);
			expect(r.supportsSearch).toBe(true);
		});
	});

	// All other resources should have full CRUD
	describe('Full CRUD resources', () => {
		const limitedResources = ['stock_availables', 'stock_movements', 'order_details', 'order_histories', 'configurations'];
		const fullCrudResources = Object.keys(PRESTASHOP_RESOURCES).filter(
			(k) => !limitedResources.includes(k),
		);

		it.each(fullCrudResources)('%s should have all 6 capability flags set to true', (key) => {
			const r = PRESTASHOP_RESOURCES[key];
			expect(r.supportsCreate).toBe(true);
			expect(r.supportsUpdate).toBe(true);
			expect(r.supportsDelete).toBe(true);
			expect(r.supportsList).toBe(true);
			expect(r.supportsGetById).toBe(true);
			expect(r.supportsSearch).toBe(true);
		});
	});
});

describe('FILTER_OPERATORS', () => {
	it('should contain exactly 12 operators', () => {
		expect(FILTER_OPERATORS.length).toBe(12);
	});

	it('should have all expected operator values', () => {
		// 'EQ' (not '='): a value starting with '=' is parsed as an expression by n8n.
		const expectedValues = [
			'EQ', '!=', '>', '>=', '<', '<=',
			'CONTAINS', 'BEGINS', 'ENDS',
			'IS_EMPTY', 'IS_NOT_EMPTY', 'CUSTOM',
		];
		const actualValues = FILTER_OPERATORS.map((op) => op.value);
		expect(actualValues).toEqual(expect.arrayContaining(expectedValues));
		expect(actualValues.length).toBe(expectedValues.length);
	});

	it('should have name and value for each operator', () => {
		for (const op of FILTER_OPERATORS) {
			expect(op).toHaveProperty('name');
			expect(op).toHaveProperty('value');
			expect(typeof op.name).toBe('string');
			expect(typeof op.value).toBe('string');
			expect(op.name.length).toBeGreaterThan(0);
			expect(op.value.length).toBeGreaterThan(0);
		}
	});
});
