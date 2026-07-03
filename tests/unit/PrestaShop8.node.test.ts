import { PrestaShop8Description } from '../../nodes/PrestaShop8/PrestaShop8.node.description';
import { PRESTASHOP_RESOURCES } from '../../nodes/PrestaShop8/types';

// Helper to find a property in the description by name
function findProperty(name: string) {
	return PrestaShop8Description.properties.find((p: any) => p.name === name);
}

// Helper to find all properties with a given name (some are duplicated with different displayOptions)
function findProperties(name: string) {
	return PrestaShop8Description.properties.filter((p: any) => p.name === name);
}

describe('PrestaShop8 Node Description', () => {
	// ──────────────────────────────────────────────────────────
	// 1. Node Description Structure
	// ──────────────────────────────────────────────────────────
	describe('Node Description Structure', () => {
		it('should have all required n8n properties', () => {
			expect(PrestaShop8Description).toHaveProperty('displayName');
			expect(PrestaShop8Description).toHaveProperty('name');
			expect(PrestaShop8Description).toHaveProperty('group');
			expect(PrestaShop8Description).toHaveProperty('version');
			expect(PrestaShop8Description).toHaveProperty('inputs');
			expect(PrestaShop8Description).toHaveProperty('outputs');
			expect(PrestaShop8Description).toHaveProperty('credentials');
			expect(PrestaShop8Description).toHaveProperty('properties');
		});

		it('should have correct name and displayName', () => {
			expect(PrestaShop8Description.name).toBe('prestaShop8');
			expect(PrestaShop8Description.displayName).toBe('PrestaShop 8');
		});

		it('should require prestaShop8Api credentials', () => {
			const cred = PrestaShop8Description.credentials!.find(
				(c: any) => c.name === 'prestaShop8Api',
			);
			expect(cred).toBeDefined();
			expect(cred!.required).toBe(true);
		});

		it('should have a non-empty properties array', () => {
			expect(Array.isArray(PrestaShop8Description.properties)).toBe(true);
			expect(PrestaShop8Description.properties.length).toBeGreaterThan(0);
		});

		it('should declare inputs and outputs', () => {
			expect(PrestaShop8Description.inputs).toBeDefined();
			expect(PrestaShop8Description.outputs).toBeDefined();
		});

		it('should belong to the transform group', () => {
			expect(PrestaShop8Description.group).toContain('transform');
		});
	});

	// ──────────────────────────────────────────────────────────
	// 2. Resource selector
	// ──────────────────────────────────────────────────────────
	describe('Resource selector', () => {
		const resourceField = findProperty('resource') as any;

		it('should exist as an options field', () => {
			expect(resourceField).toBeDefined();
			expect(resourceField.type).toBe('options');
		});

		it('should be required with default "products"', () => {
			expect(resourceField.required).toBe(true);
			expect(resourceField.default).toBe('products');
		});

		it('should contain all PRESTASHOP_RESOURCES', () => {
			const optionValues = resourceField.options.map((o: any) => o.value);
			const resourceKeys = Object.keys(PRESTASHOP_RESOURCES);

			for (const key of resourceKeys) {
				expect(optionValues).toContain(key);
			}
			expect(optionValues.length).toBe(resourceKeys.length);
		});

		it('should have options sorted alphabetically by name', () => {
			const names = resourceField.options.map((o: any) => o.name);
			const sorted = [...names].sort((a: string, b: string) => a.localeCompare(b));
			expect(names).toEqual(sorted);
		});

		it('should have name, value, description for each option', () => {
			for (const option of resourceField.options) {
				expect(option).toHaveProperty('name');
				expect(option).toHaveProperty('value');
				expect(option).toHaveProperty('description');
				expect(typeof option.name).toBe('string');
				expect(typeof option.value).toBe('string');
				expect(typeof option.description).toBe('string');
			}
		});
	});

	// ──────────────────────────────────────────────────────────
	// 3. Operation field
	// ──────────────────────────────────────────────────────────
	describe('Operation field', () => {
		const operationField = findProperty('operation') as any;

		it('should exist as an options field', () => {
			expect(operationField).toBeDefined();
			expect(operationField.type).toBe('options');
		});

		it('should be required with default "list"', () => {
			expect(operationField.required).toBe(true);
			expect(operationField.default).toBe('list');
		});

		it('should be visible for all PRESTASHOP_RESOURCES', () => {
			const showResources = operationField.displayOptions.show.resource;
			const resourceKeys = Object.keys(PRESTASHOP_RESOURCES);

			expect(showResources).toEqual(expect.arrayContaining(resourceKeys));
			expect(showResources.length).toBe(resourceKeys.length);
		});

		it('should use loadOptionsMethod getOperations', () => {
			expect(operationField.typeOptions.loadOptionsMethod).toBe('getOperations');
		});
	});

	// ──────────────────────────────────────────────────────────
	// 4. ID field
	// ──────────────────────────────────────────────────────────
	describe('ID field', () => {
		const idField = findProperty('id') as any;

		it('should exist as a string field', () => {
			expect(idField).toBeDefined();
			expect(idField.type).toBe('string');
		});

		it('should be required', () => {
			expect(idField.required).toBe(true);
		});

		it('should be visible only for getById, update, delete', () => {
			const showOps = idField.displayOptions.show.operation;
			expect(showOps).toEqual(expect.arrayContaining(['getById', 'update', 'delete']));
			expect(showOps.length).toBe(3);
		});
	});

	// ──────────────────────────────────────────────────────────
	// 5. Display field
	// ──────────────────────────────────────────────────────────
	describe('Display field', () => {
		const displayField = findProperty('display') as any;

		it('should exist as an options field', () => {
			expect(displayField).toBeDefined();
			expect(displayField.type).toBe('options');
		});

		it('should be visible for list, search, getById', () => {
			const showOps = displayField.displayOptions.show.operation;
			expect(showOps).toEqual(expect.arrayContaining(['list', 'search', 'getById']));
			expect(showOps.length).toBe(3);
		});

		it('should have 3 options: full, minimal, custom', () => {
			const values = displayField.options.map((o: any) => o.value);
			expect(values).toEqual(expect.arrayContaining(['full', 'minimal', 'custom']));
			expect(values.length).toBe(3);
		});

		it('should default to full', () => {
			expect(displayField.default).toBe('full');
		});
	});

	// ──────────────────────────────────────────────────────────
	// 6. Custom Fields
	// ──────────────────────────────────────────────────────────
	describe('Custom Fields', () => {
		const customFieldsProp = findProperty('customFields') as any;

		it('should exist as a string field', () => {
			expect(customFieldsProp).toBeDefined();
			expect(customFieldsProp.type).toBe('string');
		});

		it('should be visible when operation is list/search/getById and display is custom', () => {
			const showOps = customFieldsProp.displayOptions.show.operation;
			const showDisplay = customFieldsProp.displayOptions.show.display;
			expect(showOps).toEqual(expect.arrayContaining(['list', 'search', 'getById']));
			expect(showDisplay).toEqual(['custom']);
		});
	});

	// ──────────────────────────────────────────────────────────
	// 7. Advanced Options
	// ──────────────────────────────────────────────────────────
	describe('Advanced Options', () => {
		const advancedField = findProperty('advancedOptions') as any;

		it('should exist as a collection', () => {
			expect(advancedField).toBeDefined();
			expect(advancedField.type).toBe('collection');
		});

		it('should be visible for list, search', () => {
			const showOps = advancedField.displayOptions.show.operation;
			expect(showOps).toEqual(expect.arrayContaining(['list', 'search']));
			expect(showOps.length).toBe(2);
		});

		it('should contain limit, sort, dateFormat', () => {
			const optionNames = advancedField.options.map((o: any) => o.name);
			expect(optionNames).toContain('limit');
			expect(optionNames).toContain('sort');
			expect(optionNames).toContain('dateFormat');
		});
	});

	// ──────────────────────────────────────────────────────────
	// 8. Required fields for CREATE
	// ──────────────────────────────────────────────────────────
	describe('Required fields for CREATE', () => {
		describe('Products', () => {
			const fieldNames = ['productName', 'productPrice', 'productCategoryId'];

			it.each(fieldNames)('%s should exist for products create', (fieldName) => {
				const field = findProperty(fieldName) as any;
				expect(field).toBeDefined();
				expect(field.displayOptions.show.operation).toEqual(['create']);
				expect(field.displayOptions.show.resource).toEqual(['products']);
				expect(field.required).toBe(true);
			});
		});

		describe('Categories', () => {
			const fieldNames = ['categoryName', 'categoryParentId'];

			it.each(fieldNames)('%s should exist for categories create', (fieldName) => {
				const field = findProperty(fieldName) as any;
				expect(field).toBeDefined();
				expect(field.displayOptions.show.operation).toEqual(['create']);
				expect(field.displayOptions.show.resource).toEqual(['categories']);
				expect(field.required).toBe(true);
			});
		});

		describe('Customers', () => {
			const fieldNames = ['customerFirstname', 'customerLastname', 'customerEmail'];

			it.each(fieldNames)('%s should exist for customers create', (fieldName) => {
				const field = findProperty(fieldName) as any;
				expect(field).toBeDefined();
				expect(field.displayOptions.show.operation).toEqual(['create']);
				expect(field.displayOptions.show.resource).toEqual(['customers']);
				expect(field.required).toBe(true);
			});
		});

		describe('Addresses', () => {
			const fieldNames = [
				'addressFirstname',
				'addressLastname',
				'addressAddress1',
				'addressCity',
				'addressCountryId',
				'addressCustomerId',
			];

			it.each(fieldNames)('%s should exist for addresses create', (fieldName) => {
				const field = findProperty(fieldName) as any;
				expect(field).toBeDefined();
				expect(field.displayOptions.show.operation).toEqual(['create']);
				expect(field.displayOptions.show.resource).toEqual(['addresses']);
				expect(field.required).toBe(true);
			});
		});

		describe('Manufacturers', () => {
			const fieldNames = ['manufacturerName', 'manufacturerActive'];

			it.each(fieldNames)('%s should exist for manufacturers create', (fieldName) => {
				const field = findProperty(fieldName) as any;
				expect(field).toBeDefined();
				expect(field.displayOptions.show.operation).toEqual(['create']);
				expect(field.displayOptions.show.resource).toEqual(['manufacturers']);
				expect(field.required).toBe(true);
			});
		});
	});

	// ──────────────────────────────────────────────────────────
	// 9. Search Filters
	// ──────────────────────────────────────────────────────────
	describe('Search Filters', () => {
		// The two filter parameters must have DISTINCT names. Sharing the name
		// 'filters' breaks n8n's NDV value binding (operator becomes unselectable).
		it('should use distinct parameter names for the two filter definitions', () => {
			expect(findProperties('filters').length).toBe(1);
			expect(findProperties('filtersImages').length).toBe(1);
		});

		it('should have images filter (filtersImages) with customFilter only', () => {
			const imagesFilter = (findProperties('filtersImages') as any[])[0];
			expect(imagesFilter).toBeDefined();
			expect(imagesFilter.displayOptions?.show?.resource).toContain('images');
			const optionNames = imagesFilter.options.map((o: any) => o.name);
			expect(optionNames).toEqual(['customFilter']);
		});

		it('should have non-images filter with standardFilter + customFilter', () => {
			const otherFilter = (findProperties('filters') as any[])[0];
			expect(otherFilter).toBeDefined();
			expect(otherFilter.displayOptions?.hide?.resource).toContain('images');
			const optionNames = otherFilter.options.map((o: any) => o.name);
			expect(optionNames).toContain('standardFilter');
			expect(optionNames).toContain('customFilter');
		});
	});

	// ──────────────────────────────────────────────────────────
	// 10. Options section
	// ──────────────────────────────────────────────────────────
	describe('Options section', () => {
		const optionsField = findProperty('options') as any;

		it('should exist as a collection', () => {
			expect(optionsField).toBeDefined();
			expect(optionsField.type).toBe('collection');
		});

		it('should contain request, response, and timeout sub-options', () => {
			const optionNames = optionsField.options.map((o: any) => o.name);
			expect(optionNames).toContain('request');
			expect(optionNames).toContain('response');
			expect(optionNames).toContain('timeout');
		});

		it('should have request sub-options: showRequestInfo, showRequestUrl', () => {
			const requestOption = optionsField.options.find((o: any) => o.name === 'request');
			expect(requestOption).toBeDefined();
			const subNames = requestOption.options.map((o: any) => o.name);
			expect(subNames).toContain('showRequestInfo');
			expect(subNames).toContain('showRequestUrl');
		});

		it('should have response sub-options: includeResponseHeaders, neverError, rawMode', () => {
			const responseOption = optionsField.options.find((o: any) => o.name === 'response');
			expect(responseOption).toBeDefined();
			const subNames = responseOption.options.map((o: any) => o.name);
			expect(subNames).toContain('includeResponseHeaders');
			expect(subNames).toContain('neverError');
			expect(subNames).toContain('rawMode');
		});
	});
});
