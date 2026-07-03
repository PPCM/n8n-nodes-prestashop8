import { PrestaShop8 } from '../../nodes/PrestaShop8/PrestaShop8.node';

// Build a minimal mock for ILoadOptionsFunctions
function createMockLoadOptionsFunctions(resource: string) {
	return {
		getCurrentNodeParameter: jest.fn((paramName: string) => {
			if (paramName === 'resource') return resource;
			return undefined;
		}),
	};
}

describe('loadOptions.getOperations', () => {
	let node: PrestaShop8;
	let getOperations: Function;

	beforeEach(() => {
		node = new PrestaShop8();
		getOperations = node.methods.loadOptions.getOperations;
	});

	it('should return 6 operations for full CRUD resource (products)', async () => {
		const mock = createMockLoadOptionsFunctions('products');
		const result = await getOperations.call(mock);

		expect(result.length).toBe(6);
		const values = result.map((op: any) => op.value);
		expect(values).toEqual(['list', 'getById', 'search', 'create', 'update', 'delete']);
	});

	it('should return 4 operations for stock_availables (no create/delete)', async () => {
		const mock = createMockLoadOptionsFunctions('stock_availables');
		const result = await getOperations.call(mock);

		expect(result.length).toBe(4);
		const values = result.map((op: any) => op.value);
		expect(values).toContain('list');
		expect(values).toContain('getById');
		expect(values).toContain('search');
		expect(values).toContain('update');
		expect(values).not.toContain('create');
		expect(values).not.toContain('delete');
	});

	it('should return 4 operations for order_histories (no update/delete)', async () => {
		const mock = createMockLoadOptionsFunctions('order_histories');
		const result = await getOperations.call(mock);

		expect(result.length).toBe(4);
		const values = result.map((op: any) => op.value);
		expect(values).toContain('list');
		expect(values).toContain('getById');
		expect(values).toContain('search');
		expect(values).toContain('create');
		expect(values).not.toContain('update');
		expect(values).not.toContain('delete');
	});

	it('should return 4 operations for configurations (no create/delete)', async () => {
		const mock = createMockLoadOptionsFunctions('configurations');
		const result = await getOperations.call(mock);

		expect(result.length).toBe(4);
		const values = result.map((op: any) => op.value);
		expect(values).toContain('list');
		expect(values).toContain('getById');
		expect(values).toContain('search');
		expect(values).toContain('update');
		expect(values).not.toContain('create');
		expect(values).not.toContain('delete');
	});

	it('should return empty array for unknown resource', async () => {
		const mock = createMockLoadOptionsFunctions('nonexistent_resource');
		const result = await getOperations.call(mock);

		expect(result).toEqual([]);
	});

	it('should have name, value, description for each operation', async () => {
		const mock = createMockLoadOptionsFunctions('products');
		const result = await getOperations.call(mock);

		for (const op of result) {
			expect(op).toHaveProperty('name');
			expect(op).toHaveProperty('value');
			expect(op).toHaveProperty('description');
			expect(typeof op.name).toBe('string');
			expect(typeof op.value).toBe('string');
			expect(typeof op.description).toBe('string');
		}
	});
});
