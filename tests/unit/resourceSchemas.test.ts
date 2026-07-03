import {
	getResourceSchema,
	getResourceFields,
	getRequiredFields,
	getWritableFields,
	convertFieldValue,
	convertResourceArray,
	FieldSchema,
} from '../../nodes/PrestaShop8/resourceSchemas';

// ─── getResourceSchema ───────────────────────────────────────────────────────

describe('getResourceSchema', () => {
	it('should return a schema for known resources', () => {
		const schema = getResourceSchema('products');
		expect(schema).not.toBeNull();
		expect(typeof schema).toBe('object');
	});

	it('should return null for unknown resource', () => {
		expect(getResourceSchema('nonexistent')).toBeNull();
		expect(getResourceSchema('')).toBeNull();
	});

	it('should include field metadata (type, required, readOnly)', () => {
		const schema = getResourceSchema('products')!;
		const firstField = Object.values(schema)[0];
		expect(firstField).toHaveProperty('type');
		expect(firstField).toHaveProperty('required');
		expect(firstField).toHaveProperty('readOnly');
		expect(firstField).toHaveProperty('multilang');
	});
});

// ─── getResourceFields ───────────────────────────────────────────────────────

describe('getResourceFields', () => {
	it('should return field names for known resource', () => {
		const fields = getResourceFields('products');
		expect(Array.isArray(fields)).toBe(true);
		expect(fields.length).toBeGreaterThan(0);
		expect(fields.every(f => typeof f === 'string')).toBe(true);
	});

	it('should return empty array for unknown resource', () => {
		expect(getResourceFields('nonexistent')).toEqual([]);
	});

	it('should return same reference on repeated calls (cache hit)', () => {
		const first = getResourceFields('customers');
		const second = getResourceFields('customers');
		expect(first).toBe(second);
	});

	it('should return fields matching the schema keys', () => {
		const schema = getResourceSchema('products')!;
		const fields = getResourceFields('products');
		expect(fields).toEqual(expect.arrayContaining(Object.keys(schema)));
		expect(fields.length).toBe(Object.keys(schema).length);
	});
});

// ─── getRequiredFields ───────────────────────────────────────────────────────

describe('getRequiredFields', () => {
	it('should return empty array for unknown resource', () => {
		expect(getRequiredFields('nonexistent')).toEqual([]);
	});

	it('should return only fields marked required in schema', () => {
		const schema = getResourceSchema('products')!;
		const required = getRequiredFields('products');
		for (const field of required) {
			expect(schema[field].required).toBe(true);
		}
	});

	it('should not include non-required fields', () => {
		const schema = getResourceSchema('products')!;
		const required = getRequiredFields('products');
		const nonRequired = Object.entries(schema)
			.filter(([, info]) => !info.required)
			.map(([field]) => field);
		for (const field of nonRequired) {
			expect(required).not.toContain(field);
		}
	});
});

// ─── getWritableFields ───────────────────────────────────────────────────────

describe('getWritableFields', () => {
	it('should return empty array for unknown resource', () => {
		expect(getWritableFields('nonexistent')).toEqual([]);
	});

	it('should exclude readOnly fields', () => {
		const schema = getResourceSchema('products')!;
		const writable = getWritableFields('products');
		for (const field of writable) {
			expect(schema[field].readOnly).toBe(false);
		}
	});

	it('should not include readOnly fields', () => {
		const schema = getResourceSchema('products')!;
		const writable = getWritableFields('products');
		const readOnlyFields = Object.entries(schema)
			.filter(([, info]) => info.readOnly)
			.map(([field]) => field);
		for (const field of readOnlyFields) {
			expect(writable).not.toContain(field);
		}
	});

	it('should return fewer or equal fields than total schema fields', () => {
		const total = getResourceFields('products').length;
		const writable = getWritableFields('products').length;
		expect(writable).toBeLessThanOrEqual(total);
	});
});

// ─── convertFieldValue ───────────────────────────────────────────────────────

describe('convertFieldValue', () => {
	const numberField: FieldSchema = { type: 'number', format: 'isUnsignedId', required: false, readOnly: false, multilang: false, maxSize: null };
	const boolField: FieldSchema = { type: 'boolean', format: 'isBool', required: false, readOnly: false, multilang: false, maxSize: null };
	const stringField: FieldSchema = { type: 'string', format: 'isString', required: false, readOnly: false, multilang: false, maxSize: null };

	describe('null/undefined/empty pass-through', () => {
		it('should return null as-is', () => {
			expect(convertFieldValue(null, numberField)).toBeNull();
		});

		it('should return undefined as-is', () => {
			expect(convertFieldValue(undefined, boolField)).toBeUndefined();
		});

		it('should return empty string as-is', () => {
			expect(convertFieldValue('', numberField)).toBe('');
		});
	});

	describe('number conversion', () => {
		it('should convert numeric string to number', () => {
			expect(convertFieldValue('42', numberField)).toBe(42);
			expect(typeof convertFieldValue('42', numberField)).toBe('number');
		});

		it('should convert float string to number', () => {
			expect(convertFieldValue('3.14', numberField)).toBeCloseTo(3.14);
		});

		it('should keep numeric value as number', () => {
			expect(convertFieldValue(10, numberField)).toBe(10);
		});

		it('should return non-numeric string unchanged', () => {
			expect(convertFieldValue('abc', numberField)).toBe('abc');
		});
	});

	describe('boolean conversion', () => {
		it('should convert string "1" to true', () => {
			expect(convertFieldValue('1', boolField)).toBe(true);
		});

		it('should convert string "0" to false', () => {
			expect(convertFieldValue('0', boolField)).toBe(false);
		});

		it('should convert number 1 to true', () => {
			expect(convertFieldValue(1, boolField)).toBe(true);
		});

		it('should convert number 0 to false', () => {
			expect(convertFieldValue(0, boolField)).toBe(false);
		});

		it('should pass through boolean true', () => {
			expect(convertFieldValue(true, boolField)).toBe(true);
		});

		it('should pass through boolean false', () => {
			expect(convertFieldValue(false, boolField)).toBe(false);
		});

		it('should convert truthy string to true', () => {
			expect(convertFieldValue('yes', boolField)).toBe(true);
		});
	});

	describe('string conversion', () => {
		it('should convert number to string', () => {
			expect(convertFieldValue(42, stringField)).toBe('42');
			expect(typeof convertFieldValue(42, stringField)).toBe('string');
		});

		it('should keep string as string', () => {
			expect(convertFieldValue('hello', stringField)).toBe('hello');
		});
	});
});

// ─── convertResourceArray ────────────────────────────────────────────────────

describe('convertResourceArray', () => {
	it('should convert all items in array', () => {
		const data = [
			{ id: '1', price: '10.00' },
			{ id: '2', price: '20.00' },
		];
		const result = convertResourceArray(data, 'products');
		expect(result[0].id).toBe(1);
		expect(result[1].id).toBe(2);
		expect(typeof result[0].id).toBe('number');
	});

	it('should return non-array input unchanged', () => {
		const notAnArray = { id: '1' } as any;
		expect(convertResourceArray(notAnArray, 'products')).toEqual(notAnArray);
	});

	it('should handle empty array', () => {
		expect(convertResourceArray([], 'products')).toEqual([]);
	});

	it('should handle unknown resource (no schema) without throwing', () => {
		const data = [{ id: '1', name: 'X' }];
		const result = convertResourceArray(data, 'nonexistent');
		expect(result).toEqual(data);
	});
});
