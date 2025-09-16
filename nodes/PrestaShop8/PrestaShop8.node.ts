import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IHttpRequestMethods,
  IHttpRequestOptions,
  NodeOperationError,
  ILoadOptionsFunctions,
  INodePropertyOptions,
} from 'n8n-workflow';

import { PrestaShop8Description } from './PrestaShop8.node.description';
import {
  PRESTASHOP_RESOURCES,
  IPrestaShopCredentials,
  IPrestaShopFilter,
} from './types';
import {
  simplifyPrestashopResponse,
  buildPrestashopXml,
  buildCreateXml,
  buildUpdateXml,
  parseXmlToJson,
  buildUrlWithFilters,
  validateDataForResource,
  validateFieldsForCreate,
  processResponseForMode,
  processDisplayParameter,
  processSortParameter,
  extractPrestashopError,
} from './utils';

// Helper function to build headers based on raw mode (backward compatibility)
function buildHeaders(rawMode: boolean): any {
  const headers: any = {};
  if (rawMode) {
    // En mode Raw, demandons explicitement le XML
    headers['Output-Format'] = 'XML';
  } else {
    headers['Output-Format'] = 'JSON';
  }
  return headers;
}

// Helper function to build request options based on raw mode
function buildRequestOptions(rawMode: boolean, baseOptions: any): any {
  const options = { ...baseOptions };
  
  // In raw mode, we want the XML response as-is (string)
  if (rawMode) {
    options.json = false; // Don't parse XML to JSON automatically
  } else {
    // In normal mode, we want JSON parsing
    options.headers = options.headers || {};
    options.headers['Output-Format'] = 'JSON';
  }
  
  return options;
}

// Helper function to parse data parameter
function parseDataParameter(executeFunctions: IExecuteFunctions, itemIndex: number): object {
  let data = executeFunctions.getNodeParameter('data', itemIndex);
  
  // Parse JSON string if necessary
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (error) {
      throw new NodeOperationError(
        executeFunctions.getNode(),
        `Invalid JSON in data field: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  return data as object;
}

export class PrestaShop8 implements INodeType {
  description: INodeTypeDescription = PrestaShop8Description;

  methods = {
    loadOptions: {
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
          
          // Don't check operation here as it might not be set yet
          if (!resource) {
            return [{
              name: 'Custom Field',
              value: '__custom__',
              description: 'Enter a custom field name',
            }];
          }
          
          // Import the required fields mapping
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
          // Fallback in case of any error
          return [{
            name: 'Custom Field',
            value: '__custom__',
            description: 'Enter a custom field name',
          }];
        }
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('prestaShop8Api') as IPrestaShopCredentials;

    // Récupérer directement la ressource et l'opération
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let responseData: any;
        let requestUrl: string = '';
        let requestHeaders: any = {};
        const rawMode = this.getNodeParameter('debugOptions.rawMode', i, false) as boolean;
        
        // Use resource for response processing  
        const currentMode = resource;

        switch (operation) {
          case 'list': {
            const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as any;
            const display = this.getNodeParameter('display', i, 'full') as string;
            const customFields = this.getNodeParameter('customFields', i, '') as string;
            
            // Handle display parameter - minimal = no display param (IDs only)
            const displayValue = processDisplayParameter(
              display,
              resource,
              customFields
            );
            
            requestUrl = buildUrlWithFilters(`${credentials.baseUrl}/${resource}`, {
              limit: advancedOptions.limit,
              sort: advancedOptions.sort,
              display: displayValue,
            }, rawMode);

            const options: IHttpRequestOptions = {
              method: 'GET' as IHttpRequestMethods,
              url: requestUrl,
              auth: {
                username: credentials.apiKey,
                password: '',
              },
              headers: buildHeaders(rawMode),
              timeout: this.getNodeParameter('debugOptions.timeout', i, 30000) as number,
              ...(rawMode ? { json: false } : {}),
            };
            
            // Capture headers for debug
            requestHeaders = {
              ...options.headers,
              'Authorization': `Basic ${Buffer.from(credentials.apiKey + ':').toString('base64')}`,
            };

            let response: any;
            
            if (rawMode) {
              // In Raw mode, use axios directly to avoid n8n automatic parsing
              const axios = require('axios');
              
              try {
                const axiosResponse = await axios({
                  method: 'GET',
                  url: requestUrl,
                  auth: {
                    username: credentials.apiKey,
                    password: ''
                  },
                  headers: options.headers,
                  timeout: options.timeout || 30000,
                  transformResponse: [(data: any) => data] // Keep raw response
                });
                
                response = axiosResponse.data;
              } catch (error: any) {
                if (error.response) {
                  response = error.response.data;
                } else {
                  throw error;
                }
              }
            } else {
              response = await this.helpers.httpRequest(options);
            }
            
            responseData = rawMode ? { raw: response } : processResponseForMode(response, resource, currentMode);
            break;
          }

          case 'getById': {
            const id = this.getNodeParameter('id', i) as string;
            const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as any;
            
            if (!id) {
              throw new NodeOperationError(this.getNode(), 'ID required for this operation');
            }

            requestUrl = buildUrlWithFilters(`${credentials.baseUrl}/${resource}/${id}`, {
              display: advancedOptions.display === 'custom' ? advancedOptions.customFields : advancedOptions.display,
            }, rawMode);

            const options: IHttpRequestOptions = {
              method: 'GET' as IHttpRequestMethods,
              url: requestUrl,
              auth: {
                username: credentials.apiKey,
                password: '',
              },
              headers: buildHeaders(rawMode),
              timeout: this.getNodeParameter('debugOptions.timeout', i, 30000) as number,
              ...(rawMode ? { json: false } : {}),
            };

            const response = await this.helpers.httpRequest(options);
            responseData = rawMode ? { raw: response } : processResponseForMode(response, resource, currentMode);
            break;
          }

          case 'search': {
            const filtersParam = this.getNodeParameter('filters', i, {}) as any;
            const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as any;
            const display = this.getNodeParameter('display', i, 'full') as string;
            const customFields = this.getNodeParameter('customFields', i, '') as string;
            
            const filters: IPrestaShopFilter[] = filtersParam.filter || [];

            // Handle display parameter - minimal = no display param (IDs only)
            const displayValue = processDisplayParameter(
              display,
              resource,
              customFields
            );

            requestUrl = buildUrlWithFilters(`${credentials.baseUrl}/${resource}`, {
              filters,
              limit: advancedOptions.limit,
              sort: advancedOptions.sort,
              display: displayValue,
            }, rawMode);

            const options: IHttpRequestOptions = {
              method: 'GET' as IHttpRequestMethods,
              url: requestUrl,
              auth: {
                username: credentials.apiKey,
                password: '',
              },
              headers: buildHeaders(rawMode),
              timeout: this.getNodeParameter('debugOptions.timeout', i, 30000) as number,
              ...(rawMode ? { json: false } : {}),
            };

            const response = await this.helpers.httpRequest(options);
            responseData = rawMode ? { raw: response } : processResponseForMode(response, resource, currentMode);
            break;
          }

          case 'create': {
            let body: string;

            // Get fields to create - collect required fields + additional fields
            const fieldsToCreate: Array<{name: string, value: string}> = [];
            
            // Collect required fields based on resource
            switch (resource) {
              case 'products':
                const productName = this.getNodeParameter('productName', i, '') as string;
                const productPrice = this.getNodeParameter('productPrice', i, '') as string;
                const productCategoryId = this.getNodeParameter('productCategoryId', i, '') as string;
                // Auto-convert name to multilingual format for language ID 1
                if (productName) {
                  fieldsToCreate.push({ name: 'name-1', value: productName });
                }
                if (productPrice) fieldsToCreate.push({ name: 'price', value: productPrice });
                if (productCategoryId) fieldsToCreate.push({ name: 'id_category_default', value: productCategoryId });
                break;
                
              case 'categories':
                const categoryName = this.getNodeParameter('categoryName', i, '') as string;
                const categoryParentId = this.getNodeParameter('categoryParentId', i, '') as string;
                // Auto-convert name to multilingual format for language ID 1
                if (categoryName) fieldsToCreate.push({ name: 'name-1', value: categoryName });
                if (categoryParentId) fieldsToCreate.push({ name: 'id_parent', value: categoryParentId });
                break;
                
              case 'customers':
                const customerFirstname = this.getNodeParameter('customerFirstname', i, '') as string;
                const customerLastname = this.getNodeParameter('customerLastname', i, '') as string;
                const customerEmail = this.getNodeParameter('customerEmail', i, '') as string;
                if (customerFirstname) fieldsToCreate.push({ name: 'firstname', value: customerFirstname });
                if (customerLastname) fieldsToCreate.push({ name: 'lastname', value: customerLastname });
                if (customerEmail) fieldsToCreate.push({ name: 'email', value: customerEmail });
                break;
                
              case 'addresses':
                const addressFirstname = this.getNodeParameter('addressFirstname', i, '') as string;
                const addressLastname = this.getNodeParameter('addressLastname', i, '') as string;
                const addressAddress1 = this.getNodeParameter('addressAddress1', i, '') as string;
                const addressCity = this.getNodeParameter('addressCity', i, '') as string;
                const addressCountryId = this.getNodeParameter('addressCountryId', i, '') as string;
                const addressCustomerId = this.getNodeParameter('addressCustomerId', i, '') as string;
                if (addressFirstname) fieldsToCreate.push({ name: 'firstname', value: addressFirstname });
                if (addressLastname) fieldsToCreate.push({ name: 'lastname', value: addressLastname });
                if (addressAddress1) fieldsToCreate.push({ name: 'address1', value: addressAddress1 });
                if (addressCity) fieldsToCreate.push({ name: 'city', value: addressCity });
                if (addressCountryId) fieldsToCreate.push({ name: 'id_country', value: addressCountryId });
                if (addressCustomerId) fieldsToCreate.push({ name: 'id_customer', value: addressCustomerId });
                break;
                
              case 'manufacturers':
                const manufacturerName = this.getNodeParameter('manufacturerName', i, '') as string;
                const manufacturerActive = this.getNodeParameter('manufacturerActive', i, '') as string;
                if (manufacturerName) fieldsToCreate.push({ name: 'name', value: manufacturerName });
                if (manufacturerActive) fieldsToCreate.push({ name: 'active', value: manufacturerActive });
                break;
            }
            
            // Add additional fields if any
            const additionalFields = this.getNodeParameter('fieldsToCreate.field', i, []) as Array<{name: string, value: string}>;
            fieldsToCreate.push(...additionalFields);
            
            if (!rawMode) {
              // Validate that at least one field is provided
              if (!fieldsToCreate || fieldsToCreate.length === 0) {
                throw new NodeOperationError(
                  this.getNode(),
                  'At least one field must be provided for create'
                );
              }
              
              // Validate that all fields have name and value
              for (const field of fieldsToCreate) {
                if (!field.name || !field.name.trim()) {
                  throw new NodeOperationError(
                    this.getNode(),
                    'All fields must have a name'
                  );
                }
                if (field.value === undefined || field.value === null) {
                  throw new NodeOperationError(
                    this.getNode(),
                    `Field "${field.name}" must have a value`
                  );
                }
              }
              
              // Validate required fields for this resource
              const validation = validateFieldsForCreate(resource, fieldsToCreate);
              if (!validation.isValid) {
                throw new NodeOperationError(
                  this.getNode(),
                  validation.errors.join('. ')
                );
              }
            }

            // Build XML using new format
            body = buildCreateXml(resource, fieldsToCreate);

            const options: IHttpRequestOptions = {
              method: 'POST' as IHttpRequestMethods,
              url: `${credentials.baseUrl}/${resource}`,
              body,
              auth: {
                username: credentials.apiKey,
                password: '',
              },
              headers: {
                'Content-Type': 'application/xml',
                ...(rawMode ? {} : { 'Output-Format': 'JSON' }),
              },
              timeout: this.getNodeParameter('debugOptions.timeout', i, 30000) as number,
              ...(rawMode ? { json: false } : {}),
            };

            requestUrl = options.url as string;
            const response = await this.helpers.httpRequest(options);
            responseData = rawMode ? { raw: response } : processResponseForMode(response, resource, currentMode);
            break;
          }

          case 'update': {
            const id = this.getNodeParameter('id', i) as string;
            
            if (!id) {
              throw new NodeOperationError(this.getNode(), 'ID required for this operation');
            }

            let body: string;

            // Get fields to update (key-value pairs)
            const fieldsToUpdate = this.getNodeParameter('fieldsToUpdate.field', i, []) as Array<{name: string, value: string}>;
            
            if (!rawMode) {
              // Validate that at least one field is provided
              if (!fieldsToUpdate || fieldsToUpdate.length === 0) {
                throw new NodeOperationError(
                  this.getNode(),
                  'At least one field must be provided for update'
                );
              }
              
              // Validate that all fields have name and value
              for (const field of fieldsToUpdate) {
                if (!field.name || !field.name.trim()) {
                  throw new NodeOperationError(
                    this.getNode(),
                    'All fields must have a name'
                  );
                }
                if (field.value === undefined || field.value === null) {
                  throw new NodeOperationError(
                    this.getNode(),
                    `Field "${field.name}" must have a value`
                  );
                }
              }
            }

            // Build XML using new format
            body = buildUpdateXml(resource, id, fieldsToUpdate);

            const options: IHttpRequestOptions = {
              method: 'PATCH' as IHttpRequestMethods,
              url: `${credentials.baseUrl}/${resource}/${id}`,
              body,
              auth: {
                username: credentials.apiKey,
                password: '',
              },
              headers: {
                'Content-Type': 'application/xml',
                ...(rawMode ? {} : { 'Output-Format': 'JSON' }),
              },
              timeout: this.getNodeParameter('debugOptions.timeout', i, 30000) as number,
              ...(rawMode ? { json: false } : {}),
            };

            requestUrl = options.url as string;
            const response = await this.helpers.httpRequest(options);
            responseData = rawMode ? { raw: response } : processResponseForMode(response, resource, currentMode);
            break;
          }

          case 'delete': {
            const id = this.getNodeParameter('id', i) as string;
            
            if (!id) {
              throw new NodeOperationError(this.getNode(), 'ID required for this operation');
            }

            const options: IHttpRequestOptions = {
              method: 'DELETE' as IHttpRequestMethods,
              url: `${credentials.baseUrl}/${resource}/${id}`,
              auth: {
                username: credentials.apiKey,
                password: '',
              },
              headers: buildHeaders(rawMode),
              timeout: this.getNodeParameter('debugOptions.timeout', i, 30000) as number,
              ...(rawMode ? { json: false } : {}),
            };

            requestUrl = options.url as string;
            await this.helpers.httpRequest(options);

            responseData = {
              success: true,
              message: `${resource} with ID ${id} deleted successfully`,
              deletedId: id,
            };
            break;
          }

          default:
            throw new NodeOperationError(this.getNode(), `Operation "${operation}" not supported`);
        }

        // Add debug metadata if requested
        const debugOptions = this.getNodeParameter('debugOptions', i, {}) as any;
        
        // Capture headers for debug purposes if needed
        if (debugOptions.showHeaders && Object.keys(requestHeaders).length === 0) {
          requestHeaders = {
            ...buildHeaders(rawMode),
            'Authorization': `Basic ${Buffer.from(credentials.apiKey + ':').toString('base64')}`,
            'User-Agent': 'n8n-prestashop8-node/1.0.0',
          };
        }
        
        if (debugOptions.showUrl || debugOptions.showHeaders) {
          responseData = {
            data: responseData,
            ...(debugOptions.showUrl && { requestUrl }),
            ...(debugOptions.showHeaders && { requestHeaders }),
          };
        }

        if (Array.isArray(responseData)) {
          responseData.forEach((item: any) => {
            returnData.push({
              json: item,
              pairedItem: { item: i },
            });
          });
        } else {
          returnData.push({
            json: responseData,
            pairedItem: { item: i },
          });
        }

      } catch (error) {
        // Extract meaningful PrestaShop error message
        const prestashopError = extractPrestashopError(error);
        
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: prestashopError,
              resource,
              operation,
              originalError: error instanceof Error ? error.message : 'Unknown error',
            },
            pairedItem: { item: i },
          });
          continue;
        }
        
        // Throw a new error with the PrestaShop message
        throw new NodeOperationError(this.getNode(), prestashopError);
      }
    }

    return [returnData];
  }
}
