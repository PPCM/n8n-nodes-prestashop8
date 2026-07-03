import { PrestaShop8 } from '../../nodes/PrestaShop8/PrestaShop8.node';

function createMock(resource: string) {
	return {
		getCurrentNodeParameter: jest.fn((paramName: string) => {
			if (paramName === 'resource') return resource;
			return undefined;
		}),
	};
}

// ─── getAvailableFields ──────────────────────────────────────────────────────

describe('loadOptions.getAvailableFields', () => {
	let getAvailableFields: Function;

	beforeEach(() => {
		const node = new PrestaShop8();
		getAvailableFields = node.methods.loadOptions.getAvailableFields;
	});

	it('should return empty array for images resource', async () => {
		const mock = createMock('images');
		const result = await getAvailableFields.call(mock);
		expect(result).toEqual([]);
	});

	it('should return empty array for empty resource', async () => {
		const mock = createMock('');
		const result = await getAvailableFields.call(mock);
		expect(result).toEqual([]);
	});

	it('should return field options for products', async () => {
		const mock = createMock('products');
		const result = await getAvailableFields.call(mock);
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
	});

	it('should have name, value, description for each option', async () => {
		const mock = createMock('products');
		const result = await getAvailableFields.call(mock);
		for (const item of result) {
			expect(item).toHaveProperty('name');
			expect(item).toHaveProperty('value');
			expect(item).toHaveProperty('description');
		}
	});

	it('should sort required fields before non-required', async () => {
		const mock = createMock('products');
		const result = await getAvailableFields.call(mock);
		// Find first required and first non-required
		let seenNonRequired = false;
		let orderViolation = false;
		for (const item of result) {
			const isRequired = item.description.includes('Required');
			if (!isRequired) seenNonRequired = true;
			if (isRequired && seenNonRequired) {
				orderViolation = true;
				break;
			}
		}
		expect(orderViolation).toBe(false);
	});

	it('should return empty array for unknown resource', async () => {
		const mock = createMock('nonexistent_xyz');
		const result = await getAvailableFields.call(mock);
		expect(result).toEqual([]);
	});
});
