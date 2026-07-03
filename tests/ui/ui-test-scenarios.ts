/**
 * UI Integration Test Scenarios for n8n PrestaShop 8 Node
 *
 * This file documents all 33 resource test scenarios + transversal tests.
 * Each scenario describes the operations tested and expected results.
 *
 * Automated runner: run-integration-tests.py
 * Health check: check-n8n-health.py
 */

// ─── Resource Capabilities ──────────────────────────────────────────────────

export interface ResourceCapabilities {
	list: boolean;
	getById: boolean;
	search: boolean;
	create: boolean;
	update: boolean;
	delete: boolean;
}

export interface ResourceScenario {
	resource: string;
	category: string;
	capabilities: ResourceCapabilities;
	createData?: Record<string, string>;
	notes?: string;
}

// ─── All 33 Resource Scenarios ──────────────────────────────────────────────

export const RESOURCE_SCENARIOS: ResourceScenario[] = [
	// CRM & Customers
	{
		resource: 'customers',
		category: 'CRM & Customers',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
		createData: { customerFirstname: 'TestUI', customerLastname: 'Integration', customerEmail: 'testui-{ts}@test.com', 'passwd (via fieldsToCreate)': 'Test12345!' },
	},
	{
		resource: 'addresses',
		category: 'CRM & Customers',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
		createData: { addressFirstname: 'TestUI', addressLastname: 'Addr', addressAddress1: '1 Test St', addressCity: 'Paris', addressCountryId: '8', addressCustomerId: '{customerId}' },
	},
	{
		resource: 'groups',
		category: 'CRM & Customers',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
	{
		resource: 'customer_threads',
		category: 'CRM & Customers',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
	{
		resource: 'customer_messages',
		category: 'CRM & Customers',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},

	// Product Catalog
	{
		resource: 'products',
		category: 'Product Catalog',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
		createData: { productName: 'Test UI Product', productPrice: '99.99', categoryId: '2' },
	},
	{
		resource: 'combinations',
		category: 'Product Catalog',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
	{
		resource: 'stock_availables',
		category: 'Product Catalog',
		capabilities: { list: true, getById: true, search: true, create: false, update: true, delete: false },
		notes: 'No create/delete — update quantity only',
	},
	{
		resource: 'categories',
		category: 'Product Catalog',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
		createData: { categoryName: 'TestCatUI', parentId: '2', 'link_rewrite-1 (via fieldsToCreate)': 'test-cat-ui', 'active (via fieldsToCreate)': '1' },
	},
	{
		resource: 'manufacturers',
		category: 'Product Catalog',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
		createData: { manufacturerName: 'Test Manuf UI' },
	},
	{
		resource: 'suppliers',
		category: 'Product Catalog',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
	{
		resource: 'tags',
		category: 'Product Catalog',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
		notes: 'List may return empty if no tags exist in PrestaShop',
	},
	{
		resource: 'product_features',
		category: 'Product Catalog',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
	{
		resource: 'product_options',
		category: 'Product Catalog',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},

	// Orders & Sales
	{
		resource: 'orders',
		category: 'Orders & Sales',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
	{
		resource: 'order_details',
		category: 'Orders & Sales',
		capabilities: { list: true, getById: true, search: true, create: false, update: true, delete: false },
		notes: 'No create/delete in API',
	},
	{
		resource: 'order_histories',
		category: 'Orders & Sales',
		capabilities: { list: true, getById: true, search: true, create: true, update: false, delete: false },
		createData: { 'id_order (via fieldsToCreate)': '1', 'id_order_state (via fieldsToCreate)': '3' },
		notes: 'Create only — no update/delete',
	},
	{
		resource: 'order_states',
		category: 'Orders & Sales',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
	{
		resource: 'order_carriers',
		category: 'Orders & Sales',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
	{
		resource: 'carts',
		category: 'Orders & Sales',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
	{
		resource: 'cart_rules',
		category: 'Orders & Sales',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
	{
		resource: 'carriers',
		category: 'Orders & Sales',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
	{
		resource: 'zones',
		category: 'Orders & Sales',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
		createData: { 'name (via fieldsToCreate)': 'TestZoneUI', 'active (via fieldsToCreate)': '1' },
	},

	// Reference
	{
		resource: 'countries',
		category: 'Reference',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
	{
		resource: 'states',
		category: 'Reference',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},

	// Finance
	{
		resource: 'currencies',
		category: 'Finance',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
	{
		resource: 'taxes',
		category: 'Finance',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},

	// CMS & Media
	{
		resource: 'content_management_system',
		category: 'CMS & Media',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
	{
		resource: 'images',
		category: 'CMS & Media',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
		notes: 'Special resource — list returns product IDs, getById requires productId/imageId format',
	},

	// Configuration
	{
		resource: 'configurations',
		category: 'Configuration',
		capabilities: { list: true, getById: true, search: true, create: false, update: true, delete: false },
		notes: 'No create/delete — update value only',
	},
	{
		resource: 'languages',
		category: 'Configuration',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
	{
		resource: 'shops',
		category: 'Configuration',
		capabilities: { list: true, getById: true, search: true, create: true, update: true, delete: true },
	},
];

// ─── Transversal Test Scenarios ─────────────────────────────────────────────

export const TRANSVERSAL_SCENARIOS = [
	{
		name: 'Display Custom',
		description: 'Test display=custom with customFields=[id,name,price] on products. Verify only those 3 fields are returned.',
		resource: 'products',
		operation: 'list',
		params: { display: 'custom', customFields: '[id,name,price]' },
		expectedFields: ['id', 'name', 'price'],
	},
	{
		name: 'Credential verification',
		description: 'Verify PrestaShop 8 account credential exists and is properly configured.',
		expectedCredential: 'PrestaShop 8 account',
	},
	{
		name: 'Search with filter',
		description: 'Test search operation with customFilter on id field.',
		resource: 'customers',
		operation: 'search',
		params: { filters: { customFilter: [{ field: 'id', operator: '=', value: '1' }] } },
	},
];

// ─── Summary Statistics ─────────────────────────────────────────────────────

export const SUMMARY = {
	totalResources: RESOURCE_SCENARIOS.length,
	fullCrud: RESOURCE_SCENARIOS.filter(
		(r) => r.capabilities.create && r.capabilities.update && r.capabilities.delete,
	).length,
	readOnly: RESOURCE_SCENARIOS.filter(
		(r) => !r.capabilities.create && !r.capabilities.delete,
	).length,
	totalOperations: RESOURCE_SCENARIOS.reduce((acc, r) => {
		const caps = r.capabilities;
		return acc + (caps.list ? 1 : 0) + (caps.getById ? 1 : 0) + (caps.search ? 1 : 0)
			+ (caps.create ? 1 : 0) + (caps.update ? 1 : 0) + (caps.delete ? 1 : 0);
	}, 0),
};
