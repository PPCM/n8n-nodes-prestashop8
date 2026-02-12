import {
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';
import { PRESTASHOP_RESOURCES } from './types';
import { RESOURCE_SCHEMAS, getResourceFields } from './resourceSchemas';

export const loadOptionsMethods = {
	// Load operations dynamically based on resource
	async getOperations(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		const resource = this.getCurrentNodeParameter('resource') as string;
		const resourceConfig = PRESTASHOP_RESOURCES[resource];

		if (!resourceConfig) {
			return [];
		}

		const operations: INodePropertyOptions[] = [];

		if (resourceConfig.supportsList) {
			operations.push({
				name: 'List all',
				value: 'list',
				description: `Get all ${resourceConfig.displayName.toLowerCase()}`,
			});
		}

		if (resourceConfig.supportsGetById) {
			operations.push({
				name: 'Get by ID',
				value: 'getById',
				description: `Get a ${resourceConfig.displayName.toLowerCase()} by its ID`,
			});
		}

		if (resourceConfig.supportsSearch) {
			operations.push({
				name: 'Search with filters',
				value: 'search',
				description: `Search ${resourceConfig.displayName.toLowerCase()} with advanced filters`,
			});
		}

		if (resourceConfig.supportsCreate) {
			operations.push({
				name: 'Create',
				value: 'create',
				description: `Create a new ${resourceConfig.displayName.toLowerCase()}`,
			});
		}

		if (resourceConfig.supportsUpdate) {
			operations.push({
				name: 'Update',
				value: 'update',
				description: `Update an existing ${resourceConfig.displayName.toLowerCase()}`,
			});
		}

		if (resourceConfig.supportsDelete) {
			operations.push({
				name: 'Delete',
				value: 'delete',
				description: `Delete an existing ${resourceConfig.displayName.toLowerCase()}`,
			});
		}

		return operations;
	},

	// Load required fields for CREATE operation based on resource
	async getRequiredFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		try {
			const resource = this.getCurrentNodeParameter('resource') as string;

			if (!resource) {
				return [{
					name: 'Custom Field',
					value: '__custom__',
					description: 'Enter a custom field name',
				}];
			}

			const { REQUIRED_FIELDS_BY_RESOURCE } = await import('./utils');
			const requiredFields = REQUIRED_FIELDS_BY_RESOURCE[resource] || [];

			if (requiredFields.length === 0) {
				return [{
					name: 'No specific required fields',
					value: 'none',
					description: 'This resource has no specific required fields defined',
				}];
			}

			return requiredFields.map((field: string) => ({
				name: field,
				value: field,
				description: `Required field: ${field}`,
			}));
		} catch (error) {
			return [{
				name: 'Custom Field',
				value: '__custom__',
				description: 'Enter a custom field name',
			}];
		}
	},

	// Load available fields from resource schemas for autocomplete
	async getAvailableFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		try {
			const resource = this.getCurrentNodeParameter('resource') as string;

			if (!resource) {
				return [];
			}

			if (resource === 'images') {
				return [];
			}

			const fields = getResourceFields(resource);

			if (!fields || fields.length === 0) {
				return [];
			}

			const schema = RESOURCE_SCHEMAS[resource];
			const fieldOptions = fields.map(field => {
				const fieldInfo = schema[field];
				let description = `Type: ${fieldInfo.type}`;

				if (fieldInfo.required) {
					description += ' • Required';
				}
				if (fieldInfo.readOnly) {
					description += ' • Read-only';
				}
				if (fieldInfo.multilang) {
					description += ' • Multilingual (use -1, -2, etc.)';
				}
				if (fieldInfo.maxSize) {
					description += ` • Max: ${fieldInfo.maxSize} chars`;
				}

				return {
					name: field,
					value: field,
					description,
				};
			}).sort((a, b) => {
				const aRequired = schema[a.value]?.required || false;
				const bRequired = schema[b.value]?.required || false;
				if (aRequired && !bRequired) return -1;
				if (!aRequired && bRequired) return 1;
				return a.name.localeCompare(b.name);
			});

			return fieldOptions;
		} catch (error) {
			return [];
		}
	},
};
