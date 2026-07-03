import {
	convertFromCamelCase,
	getFieldMappingsForResource,
	CREATE_FIELD_MAPPINGS,
	CAMELCASE_TO_PRESTASHOP_MAPPINGS,
} from '../../nodes/PrestaShop8/fieldMappings';

// ─── convertFromCamelCase ───────────────────────────────────────────────────

describe('convertFromCamelCase', () => {
	it('should use specific mappings for known fields', () => {
		expect(convertFromCamelCase('manufacturerId')).toBe('id_manufacturer');
		expect(convertFromCamelCase('categoryId')).toBe('id_category');
		expect(convertFromCamelCase('supplierId')).toBe('id_supplier');
		expect(convertFromCamelCase('customerId')).toBe('id_customer');
		expect(convertFromCamelCase('countryId')).toBe('id_country');
		expect(convertFromCamelCase('stateId')).toBe('id_state');
		expect(convertFromCamelCase('zoneId')).toBe('id_zone');
		expect(convertFromCamelCase('currencyId')).toBe('id_currency');
		expect(convertFromCamelCase('languageId')).toBe('id_language');
		expect(convertFromCamelCase('groupId')).toBe('id_group');
	});

	it('should convert generic camelCase to snake_case', () => {
		expect(convertFromCamelCase('firstName')).toBe('first_name');
		expect(convertFromCamelCase('lastName')).toBe('last_name');
		expect(convertFromCamelCase('idCategoryDefault')).toBe('id_category_default');
	});

	it('should keep simple lowercase names unchanged', () => {
		expect(convertFromCamelCase('name')).toBe('name');
		expect(convertFromCamelCase('price')).toBe('price');
		expect(convertFromCamelCase('active')).toBe('active');
	});

	it('should not add leading underscore for uppercase-starting fields', () => {
		expect(convertFromCamelCase('Active')).toBe('active');
	});
});

// ─── getFieldMappingsForResource ────────────────────────────────────────────

describe('getFieldMappingsForResource', () => {
	it('should return mappings for products', () => {
		const mappings = getFieldMappingsForResource('products');
		expect(mappings).not.toBeNull();
		expect(mappings!.productName).toBe('name-1');
		expect(mappings!.productPrice).toBe('price');
		expect(mappings!.productCategoryId).toBe('id_category_default');
	});

	it('should return mappings for categories', () => {
		const mappings = getFieldMappingsForResource('categories');
		expect(mappings).not.toBeNull();
		expect(mappings!.categoryName).toBe('name-1');
		expect(mappings!.categoryParentId).toBe('id_parent');
	});

	it('should return mappings for customers', () => {
		const mappings = getFieldMappingsForResource('customers');
		expect(mappings).not.toBeNull();
		expect(mappings!.customerEmail).toBe('email');
	});

	it('should return null for unknown resource', () => {
		expect(getFieldMappingsForResource('unknown')).toBeNull();
		expect(getFieldMappingsForResource('')).toBeNull();
	});
});

// ─── Constants ──────────────────────────────────────────────────────────────

describe('CREATE_FIELD_MAPPINGS', () => {
	it('should have mappings for key resources', () => {
		expect(CREATE_FIELD_MAPPINGS).toHaveProperty('products');
		expect(CREATE_FIELD_MAPPINGS).toHaveProperty('categories');
		expect(CREATE_FIELD_MAPPINGS).toHaveProperty('customers');
		expect(CREATE_FIELD_MAPPINGS).toHaveProperty('addresses');
		expect(CREATE_FIELD_MAPPINGS).toHaveProperty('manufacturers');
	});

	it('should map user-friendly names to PrestaShop field names', () => {
		expect(CREATE_FIELD_MAPPINGS.addresses.addressCity).toBe('city');
		expect(CREATE_FIELD_MAPPINGS.manufacturers.manufacturerName).toBe('name');
	});
});

describe('CAMELCASE_TO_PRESTASHOP_MAPPINGS', () => {
	it('should contain id-related mappings', () => {
		expect(Object.keys(CAMELCASE_TO_PRESTASHOP_MAPPINGS).length).toBeGreaterThanOrEqual(10);
	});

	it('should map to id_ prefixed PrestaShop names', () => {
		for (const [, value] of Object.entries(CAMELCASE_TO_PRESTASHOP_MAPPINGS)) {
			expect(value).toMatch(/^id_/);
		}
	});
});
