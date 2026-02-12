import { INodeTypeDescription } from 'n8n-workflow';
import { PRESTASHOP_RESOURCES, FILTER_OPERATORS } from './types';

// ─── Step 11: displayOptions helpers ─────────────────────────────────────────

/** Show field only for given operations */
function showForOperations(ops: string[]) {
	return { displayOptions: { show: { operation: ops } } };
}

/** Show field for specific resource + operation combo */
function showForResourceOp(resource: string, operation: string) {
	return { displayOptions: { show: { resource: [resource], operation: [operation] } } };
}

// ─── Step 9: Filter field helpers ────────────────────────────────────────────

/** Build the Operator field (identical across all filter types) */
function buildOperatorField(): any {
	return {
		displayName: 'Operator',
		name: 'operator',
		type: 'options',
		options: FILTER_OPERATORS,
		default: '=',
		noDataExpression: true,
		description: 'Comparison operator for filtering. Custom allows you to write your own filter expression.',
	};
}

/** Build the Value field (identical across all filter types) */
function buildValueField(description?: string): any {
	return {
		displayName: 'Value',
		name: 'value',
		type: 'string',
		default: '',
		placeholder: 'search value or interval',
		description: description || 'Value to search for. For Equal/Not Equal: use "10,20" for intervals (becomes [10,20]).',
		displayOptions: {
			hide: {
				operator: ['IS_EMPTY', 'IS_NOT_EMPTY', 'CUSTOM'],
			},
		},
	};
}

/** Build the Custom Filter Expression field */
function buildCustomFilterExpressionField(): any {
	return {
		displayName: 'Custom Filter Expression',
		name: 'customFilterExpression',
		type: 'string',
		default: '',
		placeholder: 'filter[name]=[Product]%',
		description: 'Complete filter expression in PrestaShop format. Example: filter[name]=[Product]%, filter[price]=>[100], etc.',
		displayOptions: {
			show: {
				operator: ['CUSTOM'],
			},
		},
	};
}

/** Build a custom filter section (text input for field name) */
function buildCustomFilterSection(fieldDescription?: string): any {
	return {
		name: 'customFilter',
		displayName: 'Custom Filter',
		values: [
			{
				displayName: 'Field',
				name: 'field',
				type: 'string',
				default: '',
				placeholder: 'name, reference, price, etc.',
				description: fieldDescription || 'Enter your custom field name.',
				displayOptions: {
					hide: {
						operator: ['CUSTOM'],
					},
				},
			},
			buildOperatorField(),
			buildValueField('Value to search for. Examples: "Product Name", "1" (active), "29.99" (price). For Equal/Not Equal: use "10,20" for intervals (becomes [10,20]).'),
			buildCustomFilterExpressionField(),
		],
	};
}

// ─── Step 10: Field collection helpers ───────────────────────────────────────

/** Build a custom field name/value pair (text input for name) */
function buildCustomFieldValues(nameDescription: string): any {
	return {
		displayName: 'Custom Field',
		name: 'customField',
		values: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'my_custom_field',
				description: nameDescription,
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'Field value',
				description: 'Value to set. Will be properly escaped for XML.',
			},
		],
	};
}

/** Build a standard field name/value pair (dropdown from schema) */
function buildStandardFieldValues(): any {
	return {
		displayName: 'Standard Field',
		name: 'standardField',
		values: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getAvailableFields',
				},
				default: '',
				required: true,
				description: 'Select a field from the PrestaShop schema.',
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'Field value',
				description: 'Value to set. Will be properly escaped for XML.',
			},
		],
	};
}

/** Build a fixedCollection for fields (images: custom only, others: standard + custom) */
function buildFieldCollection(
	displayName: string,
	name: string,
	operation: string,
	forImages: boolean,
	description: string,
): any {
	return {
		displayName,
		name,
		type: 'fixedCollection',
		displayOptions: forImages
			? { show: { operation: [operation], resource: ['images'] } }
			: { show: { operation: [operation] }, hide: { resource: ['images'] } },
		default: {},
		placeholder: 'Add field',
		typeOptions: {
			multipleValues: true,
			sortable: true,
		},
		options: forImages
			? [buildCustomFieldValues(operation === 'create' ? 'Name of the field to set.' : 'Name of the field to update.')]
			: [buildStandardFieldValues(), buildCustomFieldValues(operation === 'create' ? 'Enter your custom field name.' : 'Enter your custom field name.')],
		description,
	};
}

// ─── Main description ────────────────────────────────────────────────────────

export const PrestaShop8Description: INodeTypeDescription = {
	displayName: 'PrestaShop 8',
	name: 'prestaShop8',
	group: ['transform'],
	icon: 'file:../../PrestaShop8/prestashop8.svg' as any,
	version: [1, 2] as any,
	subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
	description: 'n8n node for PrestaShop 8 with automatic XML/JSON conversion and full CRUD support',
	defaults: {
		name: 'PrestaShop 8',
	},
	inputs: ['main' as any],
	outputs: ['main' as any],
	credentials: [
		{
			name: 'prestaShop8Api',
			required: true,
		},
	],
	properties: [
		// Resource selection
		{
			displayName: 'Resource',
			name: 'resource',
			type: 'options',
			noDataExpression: true,
			options: Object.values(PRESTASHOP_RESOURCES)
				.map(resource => ({
					name: resource.displayName,
					value: resource.name,
					description: resource.description,
				}))
				.sort((a, b) => a.name.localeCompare(b.name)),
			default: 'products',
			required: true,
			description: 'PrestaShop resource type to work with',
		},

		// Integrated documentation
		{
			displayName: '📚 Documentation',
			name: 'documentation',
			type: 'notice',
			default: '',
			displayOptions: {
				show: {
					'/': [
						{
							_cnd: {
								eq: 'doc',
							},
						},
					],
				},
			},
			typeOptions: {
				theme: 'info',
			},
			options: [
				{
					name: '🚀 Quick Start Guide',
					value: 'quickstart',
					description: 'Configuration and first steps with PrestaShop 8',
				},
				{
					name: '🔑 API Authentication',
					value: 'auth',
					description: 'PrestaShop API key configuration',
				},
				{
					name: '🔄 XML/JSON Conversion',
					value: 'conversion',
					description: 'How automatic simplification works',
				},
				{
					name: '🔍 Search and Filters',
					value: 'filters',
					description: 'Using advanced PrestaShop filters',
				},
				{
					name: '⚡ Raw Mode',
					value: 'rawmode',
					description: 'Using raw data mode',
				},
				{
					name: '📝 Practical Examples',
					value: 'examples',
					description: 'Common use cases and code examples',
				},
			],
		},

		// Operation selection
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: {
				show: {
					resource: Object.keys(PRESTASHOP_RESOURCES),
				},
			},
			typeOptions: {
				loadOptionsMethod: 'getOperations',
			},
			default: 'list',
			required: true,
			description: 'Operation to perform on the resource',
		},

		// ID for specific operations
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			...showForOperations(['getById', 'update', 'delete']),
			default: '',
			required: true,
			description: 'ID of the item to retrieve, modify or delete',
		},

		// Pagination and sorting parameters
		{
			displayName: 'Advanced Options',
			name: 'advancedOptions',
			type: 'collection',
			...showForOperations(['list', 'search']),
			default: {},
			placeholder: 'Add Option',
			options: [
				{
					displayName: 'Limit',
					name: 'limit',
					type: 'string',
					default: '',
					placeholder: '20 ou 10,30',
					description: 'Number of items to return (e.g. 20) or pagination (e.g. 10,30)',
				},
				{
					displayName: 'Sort',
					name: 'sort',
					type: 'string',
					default: '',
					placeholder: '[id_DESC] ou [name_ASC]',
					description: 'Sort criteria (e.g. [id_DESC], [name_ASC], [date_add_DESC])',
				},
				{
					displayName: 'Date Format',
					name: 'dateFormat',
					type: 'boolean',
					default: false,
					description: 'Enable date processing in filters (adds date=1 parameter)',
				},
			],
		},

		// Display options
		{
			displayName: 'Display',
			name: 'display',
			type: 'options',
			...showForOperations(['list', 'search', 'getById']),
			options: [
				{
					name: 'Full',
					value: 'full',
					description: 'All available fields',
				},
				{
					name: 'Minimal',
					value: 'minimal',
					description: 'Essential fields only',
				},
				{
					name: 'Custom',
					value: 'custom',
					description: 'Specific field list',
				},
			],
			default: 'full',
			description: 'Level of detail of returned data',
		},

		// Custom Fields (appears when Display = Custom)
		{
			displayName: 'Custom Fields',
			name: 'customFields',
			type: 'string',
			displayOptions: {
				show: {
					operation: ['list', 'search', 'getById'],
					display: ['custom'],
				},
			},
			default: '',
			placeholder: '[id,name,price,reference]',
			description: 'PrestaShop field list format: [field1,field2,field3] or comma-separated: field1,field2,field3',
		},

		// Search Filters - Images resource (custom filter only)
		{
			displayName: 'Search Filters',
			name: 'filters',
			type: 'fixedCollection',
			...showForResourceOp('images', 'search'),
			default: {},
			placeholder: 'Add Filter',
			typeOptions: {
				multipleValues: true,
			},
			options: [
				buildCustomFilterSection('Name of field to filter.'),
			],
			description: 'PrestaShop filters to apply to the search. Enter field names directly.',
		},

		// Search Filters - Other resources (with 2 filter types)
		{
			displayName: 'Search Filters',
			name: 'filters',
			type: 'fixedCollection',
			displayOptions: {
				show: {
					operation: ['search'],
				},
				hide: {
					resource: ['images'],
				},
			},
			default: {},
			placeholder: 'Add Filter',
			typeOptions: {
				multipleValues: true,
			},
			options: [
				{
					name: 'standardFilter',
					displayName: 'Standard Filter',
					values: [
						{
							displayName: 'Field',
							name: 'field',
							type: 'options',
							typeOptions: {
								loadOptionsMethod: 'getAvailableFields',
							},
							default: '',
							description: 'Select a field from the PrestaShop schema.',
							displayOptions: {
								hide: {
									operator: ['CUSTOM'],
								},
							},
						},
						buildOperatorField(),
						buildValueField('Value to search for. Examples: "Product Name", "1" (active), "29.99" (price). For Equal/Not Equal: use "10,20" for intervals (becomes [10,20]).'),
						buildCustomFilterExpressionField(),
					],
				},
				buildCustomFilterSection(),
			],
			description: 'PrestaShop filters to apply to the search. Choose "Standard Filter" to select from schema or "Custom Filter" to enter your own field name.',
		},

		// === REQUIRED FIELDS FOR PRODUCTS ===
		{
			displayName: 'Product Name',
			name: 'productName',
			type: 'string',
			...showForResourceOp('products', 'create'),
			default: '',
			required: true,
			placeholder: 'My Product Name',
			description: 'The product name. Will be automatically set for language ID 1. For additional languages, use the Additional Fields section with "name-2", "name-3", etc.',
		},
		{
			displayName: 'Product Price',
			name: 'productPrice',
			type: 'string',
			...showForResourceOp('products', 'create'),
			default: '',
			required: true,
			placeholder: '29.99',
			description: 'The product price (without currency symbol). Use decimal format like "29.99".',
		},
		{
			displayName: 'Default Category ID',
			name: 'productCategoryId',
			type: 'string',
			...showForResourceOp('products', 'create'),
			default: '',
			required: true,
			placeholder: '2',
			description: 'The ID of the default category for this product. Usually "2" for the Home category.',
		},

		// === REQUIRED FIELDS FOR CATEGORIES ===
		{
			displayName: 'Category Name',
			name: 'categoryName',
			type: 'string',
			...showForResourceOp('categories', 'create'),
			default: '',
			required: true,
			placeholder: 'Electronics',
			description: 'The category name. Will be automatically set for language ID 1. For additional languages, use the Additional Fields section with "name-2", "name-3", etc.',
		},
		{
			displayName: 'Parent Category ID',
			name: 'categoryParentId',
			type: 'string',
			...showForResourceOp('categories', 'create'),
			default: '1',
			required: true,
			placeholder: '1',
			description: 'The ID of the parent category. Use "1" for root level categories, or the ID of an existing category.',
		},

		// === REQUIRED FIELDS FOR CUSTOMERS ===
		{
			displayName: 'Customer First Name',
			name: 'customerFirstname',
			type: 'string',
			...showForResourceOp('customers', 'create'),
			default: '',
			required: true,
			placeholder: 'John',
			description: 'The customer\'s first name.',
		},
		{
			displayName: 'Customer Last Name',
			name: 'customerLastname',
			type: 'string',
			...showForResourceOp('customers', 'create'),
			default: '',
			required: true,
			placeholder: 'Doe',
			description: 'The customer\'s last name.',
		},
		{
			displayName: 'Customer Email',
			name: 'customerEmail',
			type: 'string',
			...showForResourceOp('customers', 'create'),
			default: '',
			required: true,
			placeholder: 'john.doe@example.com',
			description: 'The customer\'s email address. Must be unique.',
		},

		// === REQUIRED FIELDS FOR ADDRESSES ===
		{
			displayName: 'Address First Name',
			name: 'addressFirstname',
			type: 'string',
			...showForResourceOp('addresses', 'create'),
			default: '',
			required: true,
			placeholder: 'John',
			description: 'First name for this address.',
		},
		{
			displayName: 'Address Last Name',
			name: 'addressLastname',
			type: 'string',
			...showForResourceOp('addresses', 'create'),
			default: '',
			required: true,
			placeholder: 'Doe',
			description: 'Last name for this address.',
		},
		{
			displayName: 'Address Line 1',
			name: 'addressAddress1',
			type: 'string',
			...showForResourceOp('addresses', 'create'),
			default: '',
			required: true,
			placeholder: '123 Main Street',
			description: 'Main address line (street, number).',
		},
		{
			displayName: 'City',
			name: 'addressCity',
			type: 'string',
			...showForResourceOp('addresses', 'create'),
			default: '',
			required: true,
			placeholder: 'New York',
			description: 'City name for this address.',
		},
		{
			displayName: 'Country ID',
			name: 'addressCountryId',
			type: 'string',
			...showForResourceOp('addresses', 'create'),
			default: '',
			required: true,
			placeholder: '21',
			description: 'ID of the country. Usually "21" for USA, "8" for France.',
		},
		{
			displayName: 'Customer ID',
			name: 'addressCustomerId',
			type: 'string',
			...showForResourceOp('addresses', 'create'),
			default: '',
			required: true,
			placeholder: '1',
			description: 'ID of the customer this address belongs to.',
		},

		// === REQUIRED FIELDS FOR MANUFACTURERS ===
		{
			displayName: 'Manufacturer Name',
			name: 'manufacturerName',
			type: 'string',
			...showForResourceOp('manufacturers', 'create'),
			default: '',
			required: true,
			placeholder: 'Apple',
			description: 'Name of the manufacturer or brand.',
		},
		{
			displayName: 'Manufacturer Active',
			name: 'manufacturerActive',
			type: 'options',
			...showForResourceOp('manufacturers', 'create'),
			options: [
				{
					name: 'Active',
					value: '1',
				},
				{
					name: 'Inactive',
					value: '0',
				},
			],
			default: '1',
			required: true,
			description: 'Whether the manufacturer is active (visible) or not.',
		},

		// Additional Fields notice for CREATE
		{
			displayName: 'Additional Fields',
			name: 'additionalFieldsSection',
			type: 'notice',
			...showForOperations(['create']),
			default: '',
			typeOptions: {
				theme: 'info',
			},
		},

		// Additional Fields for Create (images vs others)
		buildFieldCollection('Additional Fields', 'fieldsToCreate', 'create', true,
			'Additional optional fields for images. Enter field names directly.'),
		buildFieldCollection('Additional Fields', 'fieldsToCreate', 'create', false,
			'Additional optional fields for the resource. Choose "Standard Field" to select from schema or "Custom Field" to enter your own.'),

		// Fields to Update (images vs others)
		buildFieldCollection('Fields to Update', 'fieldsToUpdate', 'update', true,
			'Fields to update for images. Enter field names directly.'),
		buildFieldCollection('Fields to Update', 'fieldsToUpdate', 'update', false,
			'Fields to update in the resource. Choose "Standard Field" to select from schema or "Custom Field" to enter your own. For multilingual fields, use format: fieldname-langid (e.g., name-1, name-2).'),

		// Options
		{
			displayName: 'Options',
			name: 'options',
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			options: [
				{
					displayName: 'Request',
					name: 'request',
					type: 'collection',
					placeholder: 'Add Request Option',
					default: {},
					options: [
						{
							displayName: 'Show Request Info',
							name: 'showRequestInfo',
							type: 'boolean',
							default: false,
							description: 'Add complete HTTP request information to the response (method, URL, headers, authentication, body, etc.) - useful for debugging API communication',
						},
						{
							displayName: 'Show Request URL',
							name: 'showRequestUrl',
							type: 'boolean',
							default: false,
							description: 'Add the complete request URL to the response - useful for debugging API calls',
						},
					],
				},
				{
					displayName: 'Response',
					name: 'response',
					type: 'collection',
					placeholder: 'Add Response Option',
					default: {},
					options: [
						{
							displayName: 'Include Response Headers and Status',
							name: 'includeResponseHeaders',
							type: 'boolean',
							default: false,
							description: 'Whether to return the full response (headers and response status code) data instead of only the body',
						},
						{
							displayName: 'Never Error',
							name: 'neverError',
							type: 'boolean',
							default: false,
							description: 'Whether to succeeds also when status code is not 2xx',
						},
						{
							displayName: 'Raw Mode',
							name: 'rawMode',
							type: 'boolean',
							default: false,
							description: 'Return raw PrestaShop XML/JSON response without n8n processing - useful for debugging or custom XML handling',
						},
					],
				},
				{
					displayName: 'Timeout (ms)',
					name: 'timeout',
					type: 'number',
					default: 30000,
					description: 'Request timeout in milliseconds',
				},
			],
		},
	],
};
