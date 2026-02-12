import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

import { PrestaShop8Description } from './PrestaShop8.node.description';
import { IPrestaShopCredentials, IPrestaShopFilter } from './types';
import {
  buildCreateXml,
  buildUpdateXml,
  buildUrlWithFilters,
  validateFieldsForCreate,
  processResponseForMode,
  processDisplayParameter,
  extractPrestashopError,
} from './utils';
import { getFieldMappingsForResource } from './fieldMappings';
import { convertResourceTypes, convertResourceArray } from './resourceSchemas';
import {
  FILTER_OPERATOR_FORMATS,
  getOperationOptions,
  buildHttpOptions,
  executeHttpRequest,
  executeRawModeRequest,
  wrapResponse,
} from './helpers/http';
import { loadOptionsMethods } from './loadOptions';

/**
 * Helper to get fields based on resource type (images uses customField only, others use standard + custom)
 */
function getFieldsByResourceType(
  executeFunctions: IExecuteFunctions,
  resource: string,
  fieldCollectionName: string,
  itemIndex: number
): Array<{name: string, value: string}> {
  if (resource === 'images') {
    // For images: only custom fields
    return executeFunctions.getNodeParameter(`${fieldCollectionName}.customField`, itemIndex, []) as Array<{name: string, value: string}>;
  } else {
    // For other resources: combine standard and custom fields
    const standardFields = executeFunctions.getNodeParameter(`${fieldCollectionName}.standardField`, itemIndex, []) as Array<{name: string, value: string}>;
    const customFields = executeFunctions.getNodeParameter(`${fieldCollectionName}.customField`, itemIndex, []) as Array<{name: string, value: string}>;
    return [...standardFields, ...customFields];
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

export class PrestaShop8 implements INodeType {
  description: INodeTypeDescription = PrestaShop8Description;

  methods = { loadOptions: loadOptionsMethods };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('prestaShop8Api') as IPrestaShopCredentials;

    // Normalize base URL: ensure it ends with /api and has no trailing slash
    let baseUrl = credentials.baseUrl.trim();
    // Remove trailing slash if present
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    // Add /api if not present
    if (!baseUrl.endsWith('/api')) {
      baseUrl = baseUrl + '/api';
    }
    // Update credentials with normalized URL
    credentials.baseUrl = baseUrl;

    // Récupérer directement la ressource et l'opération
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let responseData: any;
        let requestUrl: string = '';
        let requestHeaders: any = {};
        let requestDebugInfo: any = {};
        const opts = getOperationOptions(this, i);
        const { rawMode, timeout, neverError, includeResponseHeaders, showRequestInfo, showRequestUrl } = opts;

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

            if (rawMode) {
              const rawResult = await executeRawModeRequest(requestUrl, credentials, timeout, neverError, includeResponseHeaders, operation, resource);
              responseData = rawResult.responseData;
              requestDebugInfo = rawResult.requestDebugInfo;
              requestHeaders = rawResult.requestHeaders;
            } else {
              const options = buildHttpOptions('GET', requestUrl, credentials, rawMode, timeout);
              const { response, debugInfo, url, responseHeaders, statusCode } = await executeHttpRequest(
                this.helpers, options, credentials, rawMode, operation, resource, neverError
              );

              requestUrl = url;
              requestDebugInfo = debugInfo;
              requestHeaders = debugInfo.headers;

              const processedResponse = processResponseForMode(response, resource);
              responseData = wrapResponse(processedResponse, includeResponseHeaders, responseHeaders, statusCode);
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

            const options = buildHttpOptions('GET', requestUrl, credentials, rawMode, timeout);
            
            const { response, debugInfo, url, responseHeaders, statusCode } = await executeHttpRequest(
              this.helpers, options, credentials, rawMode, operation, resource, neverError
            );
            
            requestUrl = url;
            requestDebugInfo = debugInfo;
            requestHeaders = debugInfo.headers;
            
            const processedResponse = rawMode ? { raw: response } : processResponseForMode(response, resource);
            responseData = wrapResponse(processedResponse, includeResponseHeaders, responseHeaders, statusCode);
            break;
          }

          case 'create': {
            let body: string;

            // Collect required fields using factorized function
            const fieldsToCreate = collectRequiredFields(this, resource, i);
            
            // Add additional fields based on resource type (using helper function)
            const additionalFields = getFieldsByResourceType(this, resource, 'fieldsToCreate', i);
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

            const options = buildHttpOptions('POST', `${credentials.baseUrl}/${resource}`, credentials, rawMode, timeout, body);
            
            const { response, debugInfo, url, responseHeaders, statusCode } = await executeHttpRequest(
              this.helpers, options, credentials, rawMode, operation, resource, neverError, body
            );
            
            requestUrl = url;
            requestDebugInfo = debugInfo;
            requestHeaders = debugInfo.headers;
            
            const processedResponse = rawMode ? { raw: response } : processResponseForMode(response, resource);
            responseData = wrapResponse(processedResponse, includeResponseHeaders, responseHeaders, statusCode);
            break;
          }

          case 'update': {
            const id = this.getNodeParameter('id', i) as string;
            
            if (!id) {
              throw new NodeOperationError(this.getNode(), 'ID required for this operation');
            }

            let body: string;

            // Get fields to update based on resource type (using helper function)
            const fieldsToUpdate = getFieldsByResourceType(this, resource, 'fieldsToUpdate', i);
            
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

            const options = buildHttpOptions('PATCH', `${credentials.baseUrl}/${resource}/${id}`, credentials, rawMode, timeout, body);
            
            const { response, debugInfo, url, responseHeaders, statusCode } = await executeHttpRequest(
              this.helpers, options, credentials, rawMode, operation, resource, neverError, body
            );
            
            requestUrl = url;
            requestDebugInfo = debugInfo;
            requestHeaders = debugInfo.headers;
            
            const processedResponse = rawMode ? { raw: response } : processResponseForMode(response, resource);
            responseData = wrapResponse(processedResponse, includeResponseHeaders, responseHeaders, statusCode);
            break;
          }

          case 'search': {
            const filtersParam = this.getNodeParameter('filters', i, {}) as any;
            const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as any;
            const display = this.getNodeParameter('display', i, 'full') as string;
            const customFields = this.getNodeParameter('customFields', i, '') as string;

            // Get filters based on resource type
            const filters: IPrestaShopFilter[] = resource === 'images'
              ? (filtersParam.customFilter || [])
              : [...(filtersParam.standardFilter || []), ...(filtersParam.customFilter || [])];
            
            if (!filters.length) {
              throw new NodeOperationError(this.getNode(), 'At least one filter is required for search');
            }

            // Build filter parameters for URL
            const filterParams: Record<string, any> = {};
            for (const filter of filters) {
              // Handle CUSTOM filter operator
              if (filter.operator === 'CUSTOM') {
                if (filter.customFilterExpression && filter.customFilterExpression.trim()) {
                  // Add custom filter directly to URL without any interpretation
                  // User writes exactly what they want: date=1, filter[name]=test, etc.
                  const customFilter = filter.customFilterExpression.trim();
                  
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
              const filterValue = filter.value !== null && filter.value !== undefined ? String(filter.value).trim() : '';

              const format = FILTER_OPERATOR_FORMATS[filter.operator];
              if (format) {
                if (!format.requiresValue || filterValue) {
                  filterParams[key] = format.template.replace('{v}', filterValue);
                }
              } else if (filterValue) {
                filterParams[key] = `[${filterValue}]`;
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

            requestUrl = buildUrlWithFilters(`${credentials.baseUrl}/${resource}`, urlParams, rawMode);

            if (rawMode) {
              const rawResult = await executeRawModeRequest(requestUrl, credentials, timeout, neverError, includeResponseHeaders, operation, resource);
              responseData = rawResult.responseData;
              requestDebugInfo = rawResult.requestDebugInfo;
              requestHeaders = rawResult.requestHeaders;
            } else {
              const options = buildHttpOptions('GET', requestUrl, credentials, rawMode, timeout);
              const { response, debugInfo, url, responseHeaders, statusCode } = await executeHttpRequest(
                this.helpers, options, credentials, rawMode, operation, resource, neverError
              );

              requestUrl = url;
              requestDebugInfo = debugInfo;
              requestHeaders = debugInfo.headers;

              const processedResponse = processResponseForMode(response, resource);
              responseData = wrapResponse(processedResponse, includeResponseHeaders, responseHeaders, statusCode);
            }
            break;
          }

          case 'delete': {
            const id = this.getNodeParameter('id', i) as string;
            
            if (!id) {
              throw new NodeOperationError(this.getNode(), 'ID required for this operation');
            }

            const options = buildHttpOptions('DELETE', `${credentials.baseUrl}/${resource}/${id}`, credentials, rawMode, timeout);
            
            const { debugInfo, url, responseHeaders, statusCode } = await executeHttpRequest(
              this.helpers, options, credentials, rawMode, operation, resource, neverError
            );
            
            requestUrl = url;
            requestDebugInfo = debugInfo;
            requestHeaders = debugInfo.headers;

            const deleteResponse = {
              success: true,
              message: `${resource} with ID ${id} deleted successfully`,
              deletedId: id,
            };
            responseData = wrapResponse(deleteResponse, includeResponseHeaders, responseHeaders, statusCode);
            break;
          }

          default:
            throw new NodeOperationError(this.getNode(), `Operation "${operation}" not supported`);
        }

        // Add debug metadata if requested
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
