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
import { getFieldMappingsForResource } from './fieldMappings';
import { convertResourceTypes, convertResourceArray } from './resourceSchemas';

/**
 * Build HTTP request options with appropriate headers (consolidated)
 */
function buildHttpOptions(method: IHttpRequestMethods, url: string, credentials: IPrestaShopCredentials, rawMode: boolean, timeout: number, body?: string): IHttpRequestOptions {
  const headers: Record<string, string> = {};
  
  // Add Content-Type for requests with body (POST, PATCH, PUT)
  if (body && ['POST', 'PATCH', 'PUT'].includes(method)) {
    headers['Content-Type'] = 'application/xml';
  }
  
  // Add Output-Format header based on mode
  headers['Output-Format'] = rawMode ? 'XML' : 'JSON';
  
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
 * Execute HTTP request with debug capture and response metadata
 */
async function executeHttpRequest(
  helpers: any,
  options: IHttpRequestOptions,
  credentials: any,
  rawMode: boolean,
  operation: string,
  resource: string,
  neverError: boolean = false,
  body?: string
): Promise<{ response: any; debugInfo: any; url: string; responseHeaders?: any; statusCode?: number }> {
  const requestUrl = options.url as string;
  const debugInfo = captureRequestDebugInfo(options, credentials, rawMode, operation, resource, body);
  
  try {
    const response = await helpers.httpRequest(options);
    
    // For n8n's httpRequest, the response IS the body, headers are not directly available
    // We return the response as-is since n8n handles the HTTP layer
    return {
      response,
      debugInfo,
      url: requestUrl,
      responseHeaders: {}, // n8n doesn't expose response headers through httpRequest
      statusCode: 200, // Assume success if no error thrown
    };
  } catch (error: any) {
    if (neverError) {
      // Return structured error response for Never Error mode
      const errorResponse = {
        status: error.httpCode || error.response?.status || 500,
        message: error.response?.data || ''
      };
      
      return {
        response: errorResponse,
        debugInfo,
        url: requestUrl,
        responseHeaders: error.response?.headers || {},
        statusCode: error.httpCode || error.response?.status || 500,
      };
    }
    throw error;
  }
}

/**
 * Collect required fields from individual input parameters
 */
function collectRequiredFields(executeFunctions: IExecuteFunctions, resource: string, itemIndex: number): Array<{name: string, value: string}> {
  const fieldsToCreate: Array<{name: string, value: string}> = [];
  
  const mappings = getFieldMappingsForResource(resource);
  if (mappings) {
    for (const [inputName, fieldName] of Object.entries(mappings)) {
      const value = executeFunctions.getNodeParameter(inputName, itemIndex, '') as string | number;
      if (value !== '' && value !== null && value !== undefined) {
        // Convert to string for XML generation
        fieldsToCreate.push({ name: fieldName, value: String(value) });
      }
    }
  }
  
  return fieldsToCreate;
}

/**
 * Process response data into appropriate format with type conversion
 */
function processResponseData(responseData: any, returnData: INodeExecutionData[], itemIndex: number, resource: string, convertTypes: boolean = true): void {
  // Convert types if enabled and we have data
  let processedData = responseData;
  
  if (convertTypes && processedData) {
    if (Array.isArray(processedData)) {
      processedData = convertResourceArray(processedData, resource);
    } else {
      processedData = convertResourceTypes(processedData, resource);
    }
  }
  
  if (Array.isArray(processedData)) {
    processedData.forEach((item: any) => {
      returnData.push({
        json: item,
        pairedItem: { item: itemIndex },
      });
    });
  } else {
    returnData.push({
      json: processedData,
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

      // Load available fields from resource schemas for autocomplete
      async getAvailableFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        try {
          const resource = this.getCurrentNodeParameter('resource') as string;
          
          if (!resource) {
            return [];
          }
          
          // Special handling for images resource - return empty (uses text input, not dropdown)
          if (resource === 'images') {
            return [];
          }
          
          // Import the resource schemas
          const { RESOURCE_SCHEMAS, getResourceFields } = await import('./resourceSchemas');
          
          // Get fields for this resource
          const fields = getResourceFields(resource);
          
          if (!fields || fields.length === 0) {
            // No schema available, return empty (user can use custom field button)
            return [];
          }
          
          // Convert fields to options with metadata
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
            // Sort: required first, then alphabetically
            const aRequired = schema[a.value]?.required || false;
            const bRequired = schema[b.value]?.required || false;
            if (aRequired && !bRequired) return -1;
            if (!aRequired && bRequired) return 1;
            return a.name.localeCompare(b.name);
          });

          // Return field options directly (no need for custom option anymore, it's a separate button)
          return fieldOptions;
        } catch (error) {
          // Schema not available, return empty to allow free text input
          return [];
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
        const rawMode = this.getNodeParameter('options.response.rawMode', i, false) as boolean;
        
        // Use resource for response processing  
        const currentMode = resource;

        switch (operation) {
          case 'list': {
            const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as any;
            const display = this.getNodeParameter('display', i, 'full') as string;
            const customFields = this.getNodeParameter('customFields', i, '') as string;
            
            const displayValue = processDisplayParameter(display, resource, customFields);
            
            const urlParams: any = {
              limit: advancedOptions.limit,
              sort: advancedOptions.sort,
            };
            
            // Add date=1 parameter if Date Format option is enabled
            if (advancedOptions.dateFormat) {
              urlParams.date = 1;
            }
            
            // Only add display parameter if not null (minimal mode returns null)
            if (displayValue !== null) {
              urlParams.display = displayValue;
            }
            
            requestUrl = buildUrlWithFilters(`${credentials.baseUrl}/${resource}`, urlParams, rawMode);

            const timeout = this.getNodeParameter('options.timeout', i, 30000) as number;
            const neverError = this.getNodeParameter('options.response.neverError', i, false) as boolean;
            const includeResponseHeaders = this.getNodeParameter('options.response.includeResponseHeaders', i, false) as boolean;

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
                  headers: buildHttpOptions('GET', requestUrl, credentials, rawMode, timeout || 30000).headers,
                  timeout: timeout || 30000,
                  transformResponse: [(data: any) => data], // Keep raw response
                  validateStatus: neverError ? () => true : undefined // Accept all status codes if neverError is true
                });
                
                requestDebugInfo = captureRequestDebugInfo({
                  method: 'GET',
                  url: requestUrl,
                  headers: buildHttpOptions('GET', requestUrl, credentials, rawMode, timeout || 30000).headers,
                  timeout: timeout
                }, credentials, rawMode, operation, resource);
                requestHeaders = requestDebugInfo.headers;

                // Check if this is an error response with Never Error mode
                if (neverError && (axiosResponse.status < 200 || axiosResponse.status >= 300)) {
                  responseData = {
                    status: axiosResponse.status,
                    message: axiosResponse.data || ''
                  };
                } else {
                  let processedResponse = { raw: axiosResponse.data };
                  
                  // Add response headers and status if requested
                  if (includeResponseHeaders) {
                    responseData = {
                      body: processedResponse,
                      headers: axiosResponse.headers,
                      statusCode: axiosResponse.status,
                      statusMessage: axiosResponse.status >= 200 && axiosResponse.status < 300 ? 'OK' : 'Error'
                    };
                  } else {
                    responseData = processedResponse;
                  }
                }
              } catch (error: any) {
                if (neverError) {
                  responseData = {
                    status: error.response?.status || 500,
                    message: error.response?.data || ''
                  };
                } else {
                  throw error;
                }
              }
            } else {
              const options = buildHttpOptions('GET', requestUrl, credentials, rawMode, timeout);
              
              const { response, debugInfo, url, responseHeaders, statusCode } = await executeHttpRequest(
                this.helpers, options, credentials, rawMode, operation, resource, neverError
              );
              
              requestUrl = url;
              requestDebugInfo = debugInfo;
              requestHeaders = debugInfo.headers;
              
              let processedResponse = processResponseForMode(response, resource, currentMode);
              
              // Add response headers and status if requested
              if (includeResponseHeaders) {
                responseData = {
                  body: processedResponse,
                  headers: responseHeaders,
                  statusCode: statusCode,
                  statusMessage: statusCode && statusCode >= 200 && statusCode < 300 ? 'OK' : 'Error'
                };
              } else {
                responseData = processedResponse;
              }
            }
            break;
          }

          case 'getById': {
            const id = this.getNodeParameter('id', i) as string;
            const display = this.getNodeParameter('display', i, 'full') as string;
            const customFields = this.getNodeParameter('customFields', i, '') as string;
            
            if (!id) {
              throw new NodeOperationError(this.getNode(), 'ID required for this operation');
            }

            const displayValue = processDisplayParameter(display, resource, customFields);
            
            const urlParams: any = {};
            
            // Only add display parameter if not null (minimal mode returns null)
            if (displayValue !== null) {
              urlParams.display = displayValue;
            }

            requestUrl = buildUrlWithFilters(`${credentials.baseUrl}/${resource}/${id}`, urlParams, rawMode);

            const timeout = this.getNodeParameter('options.timeout', i, 30000) as number;
            const neverError = this.getNodeParameter('options.response.neverError', i, false) as boolean;
            const includeResponseHeaders = this.getNodeParameter('options.response.includeResponseHeaders', i, false) as boolean;
            const options = buildHttpOptions('GET', requestUrl, credentials, rawMode, timeout);
            
            const { response, debugInfo, url, responseHeaders, statusCode } = await executeHttpRequest(
              this.helpers, options, credentials, rawMode, operation, resource, neverError
            );
            
            requestUrl = url;
            requestDebugInfo = debugInfo;
            requestHeaders = debugInfo.headers;
            
            let processedResponse = rawMode ? { raw: response } : processResponseForMode(response, resource, currentMode);
            
            // Add response headers and status if requested
            if (includeResponseHeaders) {
              responseData = {
                body: processedResponse,
                headers: responseHeaders,
                statusCode: statusCode,
                statusMessage: statusCode && statusCode >= 200 && statusCode < 300 ? 'OK' : 'Error'
              };
            } else {
              responseData = processedResponse;
            }
            break;
          }

          case 'create': {
            let body: string;

            // Collect required fields using factorized function
            const fieldsToCreate = collectRequiredFields(this, resource, i);
            
            // Add additional fields based on resource type
            if (resource === 'images') {
              // For images: only custom fields
              const customFields = this.getNodeParameter('fieldsToCreate.customField', i, []) as Array<{name: string, value: string}>;
              fieldsToCreate.push(...customFields);
            } else {
              // For other resources: separate standard and custom fields
              const standardFields = this.getNodeParameter('fieldsToCreate.standardField', i, []) as Array<{name: string, value: string}>;
              fieldsToCreate.push(...standardFields);
              
              const customFields = this.getNodeParameter('fieldsToCreate.customField', i, []) as Array<{name: string, value: string}>;
              fieldsToCreate.push(...customFields);
            }
            
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

            const timeout = this.getNodeParameter('options.timeout', i, 30000) as number;
            const neverError = this.getNodeParameter('options.response.neverError', i, false) as boolean;
            const includeResponseHeaders = this.getNodeParameter('options.response.includeResponseHeaders', i, false) as boolean;
            const options = buildHttpOptions('POST', `${credentials.baseUrl}/${resource}`, credentials, rawMode, timeout, body);
            
            const { response, debugInfo, url, responseHeaders, statusCode } = await executeHttpRequest(
              this.helpers, options, credentials, rawMode, operation, resource, neverError, body
            );
            
            requestUrl = url;
            requestDebugInfo = debugInfo;
            requestHeaders = debugInfo.headers;
            
            let processedResponse = rawMode ? { raw: response } : processResponseForMode(response, resource, currentMode);
            
            // Add response headers and status if requested
            if (includeResponseHeaders) {
              responseData = {
                body: processedResponse,
                headers: responseHeaders,
                statusCode: statusCode,
                statusMessage: statusCode && statusCode >= 200 && statusCode < 300 ? 'OK' : 'Error'
              };
            } else {
              responseData = processedResponse;
            }
            break;
          }

          case 'update': {
            const id = this.getNodeParameter('id', i) as string;
            
            if (!id) {
              throw new NodeOperationError(this.getNode(), 'ID required for this operation');
            }

            let body: string;

            // Get fields to update based on resource type
            let fieldsToUpdate: Array<{name: string, value: string}> = [];
            
            if (resource === 'images') {
              // For images: only custom fields
              fieldsToUpdate = this.getNodeParameter('fieldsToUpdate.customField', i, []) as Array<{name: string, value: string}>;
            } else {
              // For other resources: separate standard and custom fields
              const standardFields = this.getNodeParameter('fieldsToUpdate.standardField', i, []) as Array<{name: string, value: string}>;
              const customFields = this.getNodeParameter('fieldsToUpdate.customField', i, []) as Array<{name: string, value: string}>;
              
              // Combine both field types
              fieldsToUpdate = [...standardFields, ...customFields];
            }
            
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
                    'Each field must have a name'
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

            const timeout = this.getNodeParameter('options.timeout', i, 30000) as number;
            const neverError = this.getNodeParameter('options.response.neverError', i, false) as boolean;
            const includeResponseHeaders = this.getNodeParameter('options.response.includeResponseHeaders', i, false) as boolean;
            const options = buildHttpOptions('PATCH', `${credentials.baseUrl}/${resource}/${id}`, credentials, rawMode, timeout, body);
            
            const { response, debugInfo, url, responseHeaders, statusCode } = await executeHttpRequest(
              this.helpers, options, credentials, rawMode, operation, resource, neverError, body
            );
            
            requestUrl = url;
            requestDebugInfo = debugInfo;
            requestHeaders = debugInfo.headers;
            
            let processedResponse = rawMode ? { raw: response } : processResponseForMode(response, resource, currentMode);
            
            // Add response headers and status if requested
            if (includeResponseHeaders) {
              responseData = {
                body: processedResponse,
                headers: responseHeaders,
                statusCode: statusCode,
                statusMessage: statusCode && statusCode >= 200 && statusCode < 300 ? 'OK' : 'Error'
              };
            } else {
              responseData = processedResponse;
            }
            break;
          }

          case 'search': {
            const filtersParam = this.getNodeParameter('filters', i, {}) as any;
            const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as any;
            const display = this.getNodeParameter('display', i, 'full') as string;
            const customFields = this.getNodeParameter('customFields', i, '') as string;
            
            // Debug: Log the filters parameter structure
            const showRequestInfo = this.getNodeParameter('options.request.showRequestInfo', i, false) as boolean;
            if (showRequestInfo) {
              console.log('DEBUG - filtersParam:', JSON.stringify(filtersParam, null, 2));
            }
            
            const filters: IPrestaShopFilter[] = filtersParam.filter || [];
            
            if (!filters.length) {
              throw new NodeOperationError(this.getNode(), 'At least one filter is required for search');
            }

            // Build filter parameters for URL
            const filterParams: Record<string, any> = {};
            for (const filter of filters) {
              if (showRequestInfo) {
                console.log('DEBUG - Processing filter:', JSON.stringify(filter, null, 2));
              }
              
              // Handle CUSTOM filter operator
              if (filter.operator === 'CUSTOM') {
                if (filter.customFilter && filter.customFilter.trim()) {
                  // Add custom filter directly to URL without any interpretation
                  // User writes exactly what they want: date=1, filter[name]=test, etc.
                  const customFilter = filter.customFilter.trim();
                  
                  // Parse the custom filter to extract key=value pairs for URL construction
                  const parts = customFilter.split('&');
                  for (const part of parts) {
                    const [key, value] = part.split('=', 2);
                    if (key && value !== undefined) {
                      filterParams[key.trim()] = value.trim();
                    }
                  }
                }
                continue;
              }
              
              const key = `filter[${filter.field}]`;
              
              // Convert filter value to string and trim
              const filterValue = filter.value !== null && filter.value !== undefined ? String(filter.value).trim() : '';
              
              // Handle different operators with correct PrestaShop formats
              switch (filter.operator) {
                case '=':
                  if (filterValue) {
                    // Check if value contains comma for interval (e.g., "10,20" → "[10,20]")
                    if (filterValue.includes(',') && !filterValue.startsWith('[')) {
                      filterParams[key] = `[${filterValue}]`;
                    } else {
                      filterParams[key] = `[${filterValue}]`;
                    }
                  }
                  break;
                case '!=':
                  if (filterValue) {
                    // Check if value contains comma for interval (e.g., "10,20" → "![10,20]")
                    if (filterValue.includes(',') && !filterValue.startsWith('[')) {
                      filterParams[key] = `![${filterValue}]`;
                    } else {
                      filterParams[key] = `![${filterValue}]`;
                    }
                  }
                  break;
                case '>':
                  if (filterValue) {
                    filterParams[key] = `>[${filterValue}]`;
                  }
                  break;
                case '>=':
                  if (filterValue) {
                    filterParams[key] = `>=[${filterValue}]`;
                  }
                  break;
                case '<':
                  if (filterValue) {
                    filterParams[key] = `<[${filterValue}]`;
                  }
                  break;
                case '<=':
                  if (filterValue) {
                    filterParams[key] = `<=[${filterValue}]`;
                  }
                  break;
                case 'CONTAINS':
                  if (filterValue) {
                    filterParams[key] = `%[${filterValue}]%`;
                  }
                  break;
                case 'BEGINS':
                  if (filterValue) {
                    filterParams[key] = `[${filterValue}]%`;
                  }
                  break;
                case 'ENDS':
                  if (filterValue) {
                    filterParams[key] = `%[${filterValue}]`;
                  }
                  break;
                case 'IS_EMPTY':
                  filterParams[key] = `[]`;
                  break;
                case 'IS_NOT_EMPTY':
                  filterParams[key] = `![]`;
                  break;
                default:
                  if (filterValue) {
                    filterParams[key] = `[${filterValue}]`;
                  }
              }
            }

            // Handle display parameter
            const displayValue = processDisplayParameter(
              display,
              resource,
              customFields
            );

            const urlParams: any = {
              ...filterParams,
              limit: advancedOptions.limit,
              sort: advancedOptions.sort,
            };
            
            // Add date=1 parameter if Date Format option is enabled
            if (advancedOptions.dateFormat) {
              urlParams.date = 1;
            }
            
            // Only add display parameter if not null (minimal mode returns null)
            if (displayValue !== null) {
              urlParams.display = displayValue;
            }

            if (showRequestInfo) {
              console.log('DEBUG - Final filterParams:', JSON.stringify(filterParams, null, 2));
              console.log('DEBUG - Final urlParams:', JSON.stringify(urlParams, null, 2));
            }

            requestUrl = buildUrlWithFilters(`${credentials.baseUrl}/${resource}`, urlParams, rawMode);
            
            if (showRequestInfo) {
              console.log('DEBUG - Final URL:', requestUrl);
            }

            const timeout = this.getNodeParameter('options.timeout', i, 30000) as number;
            const neverError = this.getNodeParameter('options.response.neverError', i, false) as boolean;
            const includeResponseHeaders = this.getNodeParameter('options.response.includeResponseHeaders', i, false) as boolean;

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
                  headers: buildHttpOptions('GET', requestUrl, credentials, rawMode, timeout || 30000).headers,
                  timeout: timeout || 30000,
                  transformResponse: [(data: any) => data], // Keep raw response
                  validateStatus: neverError ? () => true : undefined // Accept all status codes if neverError is true
                });
                
                requestDebugInfo = captureRequestDebugInfo({
                  method: 'GET',
                  url: requestUrl,
                  headers: buildHttpOptions('GET', requestUrl, credentials, rawMode, timeout || 30000).headers,
                  timeout: timeout
                }, credentials, rawMode, operation, resource);
                requestHeaders = requestDebugInfo.headers;

                // Check if this is an error response with Never Error mode
                if (neverError && (axiosResponse.status < 200 || axiosResponse.status >= 300)) {
                  responseData = {
                    status: axiosResponse.status,
                    message: axiosResponse.data || ''
                  };
                } else {
                  let processedResponse = { raw: axiosResponse.data };
                  
                  // Add response headers and status if requested
                  if (includeResponseHeaders) {
                    responseData = {
                      body: processedResponse,
                      headers: axiosResponse.headers,
                      statusCode: axiosResponse.status,
                      statusMessage: axiosResponse.status >= 200 && axiosResponse.status < 300 ? 'OK' : 'Error'
                    };
                  } else {
                    responseData = processedResponse;
                  }
                }
              } catch (error: any) {
                if (neverError) {
                  responseData = {
                    status: error.response?.status || 500,
                    message: error.response?.data || ''
                  };
                } else {
                  throw error;
                }
              }
            } else {
              const options = buildHttpOptions('GET', requestUrl, credentials, rawMode, timeout);
              
              const { response, debugInfo, url, responseHeaders, statusCode } = await executeHttpRequest(
                this.helpers, options, credentials, rawMode, operation, resource, neverError
              );
              
              requestUrl = url;
              requestDebugInfo = debugInfo;
              requestHeaders = debugInfo.headers;
              
              let processedResponse = processResponseForMode(response, resource, currentMode);
              
              // Add response headers and status if requested
              if (includeResponseHeaders) {
                responseData = {
                  body: processedResponse,
                  headers: responseHeaders,
                  statusCode: statusCode,
                  statusMessage: statusCode && statusCode >= 200 && statusCode < 300 ? 'OK' : 'Error'
                };
              } else {
                responseData = processedResponse;
              }
            }
            break;
          }

          case 'delete': {
            const id = this.getNodeParameter('id', i) as string;
            
            if (!id) {
              throw new NodeOperationError(this.getNode(), 'ID required for this operation');
            }

            const timeout = this.getNodeParameter('options.timeout', i, 30000) as number;
            const neverError = this.getNodeParameter('options.response.neverError', i, false) as boolean;
            const includeResponseHeaders = this.getNodeParameter('options.response.includeResponseHeaders', i, false) as boolean;
            const options = buildHttpOptions('DELETE', `${credentials.baseUrl}/${resource}/${id}`, credentials, rawMode, timeout);
            
            const { debugInfo, url, responseHeaders, statusCode } = await executeHttpRequest(
              this.helpers, options, credentials, rawMode, operation, resource, neverError
            );
            
            requestUrl = url;
            requestDebugInfo = debugInfo;
            requestHeaders = debugInfo.headers;

            let deleteResponse = {
              success: true,
              message: `${resource} with ID ${id} deleted successfully`,
              deletedId: id,
            };

            // Add response headers and status if requested
            if (includeResponseHeaders) {
              responseData = {
                body: deleteResponse,
                headers: responseHeaders,
                statusCode: statusCode,
                statusMessage: statusCode && statusCode >= 200 && statusCode < 300 ? 'OK' : 'Error'
              };
            } else {
              responseData = deleteResponse;
            }
            break;
          }

          default:
            throw new NodeOperationError(this.getNode(), `Operation "${operation}" not supported`);
        }

        // Add debug metadata if requested
        const showRequestUrl = this.getNodeParameter('options.request.showRequestUrl', i, false) as boolean;
        const showRequestInfo = this.getNodeParameter('options.request.showRequestInfo', i, false) as boolean;
        
        // Capture request information for debug purposes if needed
        if (showRequestInfo && Object.keys(requestDebugInfo).length === 0) {
          // Fallback if no request debug info was captured
          requestDebugInfo = {
            method: 'GET',
            url: requestUrl,
            headers: {},
            auth: 'Basic (hidden)',
            timeout: 30000,
            timestamp: new Date().toISOString(),
          };
        }

        // Add headers to output if requested
        if (showRequestInfo) {
          requestHeaders = requestDebugInfo.headers;
        }
        
        if (showRequestUrl || showRequestInfo) {
          responseData = {
            data: responseData,
            ...(showRequestUrl && { requestUrl }),
            ...(showRequestInfo && { requestInfo: requestDebugInfo }),
          };
        }

        processResponseData(responseData, returnData, i, resource);

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
