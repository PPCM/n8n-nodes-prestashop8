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
  parseXmlToJson,
  buildUrlWithFilters,
  validateDataForResource,
  processResponseForMode,
  processDisplayParameter,
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
        const rawMode = this.getNodeParameter('debugOptions.rawMode', i, false) as boolean;
        let responseData: any;
        let requestUrl: string;
        
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

            const data = this.getNodeParameter('data', i) as object;

            if (!rawMode) {
              
              const validation = validateDataForResource(resource, data);
              if (!validation.isValid) {
                throw new NodeOperationError(
                  this.getNode(),
                  `Invalid data: ${validation.errors.join(', ')}`
                );
              }

            }

            body = buildPrestashopXml(resource, data);

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

            const data = this.getNodeParameter('data', i) as object;
            
            if (!rawMode) {
              const validation = validateDataForResource(resource, data);
              if (!validation.isValid) {
                throw new NodeOperationError(
                  this.getNode(),
                  `Invalid data: ${validation.errors.join(', ')}`
                );
              }
            }

            body = buildPrestashopXml(resource, { ...data, id });

            const options: IHttpRequestOptions = {
              method: 'PUT' as IHttpRequestMethods,
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
        if (debugOptions.showUrl || debugOptions.showHeaders) {
          responseData = {
            data: responseData,
            ...(debugOptions.showUrl && { requestUrl }),
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: errorMessage,
              resource,
              operation,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
