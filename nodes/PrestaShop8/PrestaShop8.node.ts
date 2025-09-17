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
  buildCreateXml,
  buildUpdateXml,
  buildUrlWithFilters,
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

/**
 * Build common HTTP request options
 */
function buildHttpOptions(method: IHttpRequestMethods, url: string, credentials: any, rawMode: boolean, timeout: number, body?: string): IHttpRequestOptions {
  const headers: any = {};
  
  // Only add Content-Type for requests with body (POST, PATCH, PUT)
  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    headers['Content-Type'] = 'application/xml';
  }
  
  // Add Output-Format for non-raw mode
  if (!rawMode) {
    headers['Output-Format'] = 'JSON';
  }
  
  return {
    method,
    url,
    auth: {
      username: credentials.apiKey,
      password: '',
    },
    headers,
    timeout,
    ...(rawMode ? { json: false } : {}),
    ...(body && { body }),
  };
}

/**
 * Execute HTTP request with debug capture
 */
async function executeHttpRequest(
  helpers: any,
  options: IHttpRequestOptions,
  credentials: any,
  rawMode: boolean,
  operation: string,
  resource: string,
  body?: string
): Promise<{ response: any; debugInfo: any; url: string }> {
  const requestUrl = options.url as string;
  const debugInfo = captureRequestDebugInfo(options, credentials, rawMode, operation, resource, body);
  
  const response = await helpers.httpRequest(options);
  
  return {
    response,
    debugInfo,
    url: requestUrl,
  };
}

/**
 * Collect required fields from individual input parameters
 */
function collectRequiredFields(executeFunctions: IExecuteFunctions, resource: string, itemIndex: number): Array<{name: string, value: string}> {
  const fieldsToCreate: Array<{name: string, value: string}> = [];
  
  const fieldMappings: {[resource: string]: {[inputName: string]: string}} = {
    products: {
      productName: 'name-1',
      productPrice: 'price',
      productCategoryId: 'id_category_default'
    },
    categories: {
      categoryName: 'name-1',
      categoryParentId: 'id_parent'
    },
    customers: {
      customerFirstname: 'firstname',
      customerLastname: 'lastname',
      customerEmail: 'email'
    },
    addresses: {
      addressFirstname: 'firstname',
      addressLastname: 'lastname',
      addressAddress1: 'address1',
      addressCity: 'city',
      addressCountryId: 'id_country',
      addressCustomerId: 'id_customer'
    },
    manufacturers: {
      manufacturerName: 'name',
      manufacturerActive: 'active'
    }
  };
  
  const mappings = fieldMappings[resource];
  if (mappings) {
    for (const [inputName, fieldName] of Object.entries(mappings)) {
      const value = executeFunctions.getNodeParameter(inputName, itemIndex, '') as string;
      if (value) {
        fieldsToCreate.push({ name: fieldName, value });
      }
    }
  }
  
  return fieldsToCreate;
}

/**
 * Process response data into appropriate format
 */
function processResponseData(responseData: any, returnData: INodeExecutionData[], itemIndex: number): void {
  if (Array.isArray(responseData)) {
    responseData.forEach((item: any) => {
      returnData.push({
        json: item,
        pairedItem: { item: itemIndex },
      });
    });
  } else {
    returnData.push({
      json: responseData,
      pairedItem: { item: itemIndex },
    });
  }
}

/**
 * Capture complete request information for debugging
 */
function captureRequestDebugInfo(options: any, credentials: any, rawMode: boolean, operation: string, resource: string, body?: string): any {
  return {
    method: options.method,
    url: options.url,
    headers: {
      ...options.headers,
      'Authorization': `Basic ${Buffer.from(credentials.apiKey + ':').toString('base64')}`,
      'User-Agent': 'n8n-prestashop8-node/1.0.0',
    },
    authentication: {
      type: 'Basic Auth',
      username: credentials.apiKey,
      password: '[HIDDEN]',
      baseUrl: credentials.baseUrl,
    },
    operation: operation,
    resource: resource,
    mode: rawMode ? 'Raw XML' : 'JSON',
    timeout: options.timeout,
    ...(body && { body: body }),
    ...(options.json !== undefined && { jsonParsing: options.json }),
  };
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
        let requestDebugInfo: any = {};
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
            
            // Capture complete request information for debug
            requestDebugInfo = captureRequestDebugInfo(options, credentials, rawMode, operation, resource);
            requestHeaders = requestDebugInfo.headers;

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

            const timeout = this.getNodeParameter('debugOptions.timeout', i, 30000) as number;
            const options = buildHttpOptions('GET', requestUrl, credentials, rawMode, timeout);
            
            const { response, debugInfo, url } = await executeHttpRequest(
              this.helpers, options, credentials, rawMode, operation, resource
            );
            
            requestUrl = url;
            requestDebugInfo = debugInfo;
            requestHeaders = debugInfo.headers;
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

            // Collect required fields using factorized function
            const fieldsToCreate = collectRequiredFields(this, resource, i);
            
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

            const timeout = this.getNodeParameter('debugOptions.timeout', i, 30000) as number;
            const options = buildHttpOptions('POST', `${credentials.baseUrl}/${resource}`, credentials, rawMode, timeout, body);
            
            const { response, debugInfo, url } = await executeHttpRequest(
              this.helpers, options, credentials, rawMode, operation, resource, body
            );
            
            requestUrl = url;
            requestDebugInfo = debugInfo;
            requestHeaders = debugInfo.headers;
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

            const timeout = this.getNodeParameter('debugOptions.timeout', i, 30000) as number;
            const options = buildHttpOptions('PATCH', `${credentials.baseUrl}/${resource}/${id}`, credentials, rawMode, timeout, body);
            
            const { response, debugInfo, url } = await executeHttpRequest(
              this.helpers, options, credentials, rawMode, operation, resource, body
            );
            
            requestUrl = url;
            requestDebugInfo = debugInfo;
            requestHeaders = debugInfo.headers;
            responseData = rawMode ? { raw: response } : processResponseForMode(response, resource, currentMode);
            break;
          }

          case 'delete': {
            const id = this.getNodeParameter('id', i) as string;
            
            if (!id) {
              throw new NodeOperationError(this.getNode(), 'ID required for this operation');
            }

            const timeout = this.getNodeParameter('debugOptions.timeout', i, 30000) as number;
            const options = buildHttpOptions('DELETE', `${credentials.baseUrl}/${resource}/${id}`, credentials, rawMode, timeout);
            
            const { debugInfo, url } = await executeHttpRequest(
              this.helpers, options, credentials, rawMode, operation, resource
            );
            
            requestUrl = url;
            requestDebugInfo = debugInfo;
            requestHeaders = debugInfo.headers;

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
        
        // Capture request information for debug purposes if needed
        if (debugOptions.showHeaders && Object.keys(requestDebugInfo).length === 0) {
          // Fallback if no request debug info was captured
          requestDebugInfo = {
            method: 'GET',
            url: requestUrl,
            headers: {
              ...buildHeaders(rawMode),
              'Authorization': `Basic ${Buffer.from(credentials.apiKey + ':').toString('base64')}`,
              'User-Agent': 'n8n-prestashop8-node/1.0.0',
            },
            authentication: {
              type: 'Basic Auth',
              username: credentials.apiKey,
              password: '[HIDDEN]',
              baseUrl: credentials.baseUrl,
            },
            operation: operation,
            resource: resource,
            mode: rawMode ? 'Raw XML' : 'JSON',
          };
          requestHeaders = requestDebugInfo.headers;
        }
        
        if (debugOptions.showUrl || debugOptions.showHeaders) {
          responseData = {
            data: responseData,
            ...(debugOptions.showUrl && { requestUrl }),
            ...(debugOptions.showHeaders && { requestInfo: requestDebugInfo }),
          };
        }

        processResponseData(responseData, returnData, i);

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
