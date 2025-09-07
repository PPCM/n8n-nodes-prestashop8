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
} from './utils';

// Helper function to build headers based on raw mode
function buildHeaders(rawMode: boolean): any {
  const headers: any = {};
  if (!rawMode) {
    headers['Output-Format'] = 'JSON';
  }
  return headers;
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
            name: 'Lister tous',
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
            name: 'Rechercher avec filtres',
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
            name: 'Supprimer',
            value: 'delete',
            description: `Supprimer un ${resourceConfig.displayName.toLowerCase()}`,
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

    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        const rawMode = this.getNodeParameter('rawMode', i, false) as boolean;
        let responseData: any;
        let requestUrl: string;

        switch (operation) {
          case 'list': {
            const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as any;
            
            requestUrl = buildUrlWithFilters(`${credentials.baseUrl}/${resource}`, {
              limit: advancedOptions.limit,
              sort: advancedOptions.sort,
              display: advancedOptions.display === 'custom' ? advancedOptions.customFields : advancedOptions.display,
            });

            const options: IHttpRequestOptions = {
              method: 'GET' as IHttpRequestMethods,
              url: requestUrl,
              auth: {
                username: credentials.apiKey,
                password: '',
              },
              headers: buildHeaders(rawMode),
              timeout: this.getNodeParameter('debugOptions.timeout', i, 30000) as number,
            };

            const response = await this.helpers.httpRequest(options);
            responseData = rawMode ? response : simplifyPrestashopResponse(response, resource);
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
            });

            const options: IHttpRequestOptions = {
              method: 'GET' as IHttpRequestMethods,
              url: requestUrl,
              auth: {
                username: credentials.apiKey,
                password: '',
              },
              headers: buildHeaders(rawMode),
              timeout: this.getNodeParameter('debugOptions.timeout', i, 30000) as number,
            };

            const response = await this.helpers.httpRequest(options);
            responseData = rawMode ? response : simplifyPrestashopResponse(response, resource);
            break;
          }

          case 'search': {
            const filtersParam = this.getNodeParameter('filters', i, {}) as any;
            const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as any;
            
            const filters: IPrestaShopFilter[] = filtersParam.filter || [];

            requestUrl = buildUrlWithFilters(`${credentials.baseUrl}/${resource}`, {
              filters,
              limit: advancedOptions.limit,
              sort: advancedOptions.sort,
              display: advancedOptions.display === 'custom' ? advancedOptions.customFields : advancedOptions.display,
            });

            const options: IHttpRequestOptions = {
              method: 'GET' as IHttpRequestMethods,
              url: requestUrl,
              auth: {
                username: credentials.apiKey,
                password: '',
              },
              headers: buildHeaders(rawMode),
              timeout: this.getNodeParameter('debugOptions.timeout', i, 30000) as number,
            };

            const response = await this.helpers.httpRequest(options);
            responseData = rawMode ? response : simplifyPrestashopResponse(response, resource);
            break;
          }

          case 'create': {
            let body: string;

            if (rawMode) {
              const manualXml = this.getNodeParameter('manualXml', i, '') as string;
              if (manualXml) {
                body = manualXml;
              } else {
                const data = this.getNodeParameter('data', i) as object;
                body = buildPrestashopXml(resource, data);
              }
            } else {
              const data = this.getNodeParameter('data', i) as object;
              
              const validation = validateDataForResource(resource, data);
              if (!validation.isValid) {
                throw new NodeOperationError(
                  this.getNode(),
                  `Invalid data: ${validation.errors.join(', ')}`
                );
              }

              body = buildPrestashopXml(resource, data);
            }

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
            };

            requestUrl = options.url as string;
            const response = await this.helpers.httpRequest(options);
            responseData = rawMode ? response : simplifyPrestashopResponse(response, resource);
            break;
          }

          case 'update': {
            const id = this.getNodeParameter('id', i) as string;
            
            if (!id) {
              throw new NodeOperationError(this.getNode(), 'ID required for this operation');
            }

            let body: string;

            if (rawMode) {
              const manualXml = this.getNodeParameter('manualXml', i, '') as string;
              if (manualXml) {
                body = manualXml;
              } else {
                const data = this.getNodeParameter('data', i) as object;
                body = buildPrestashopXml(resource, { ...data, id });
              }
            } else {
              const data = this.getNodeParameter('data', i) as object;
              
              const validation = validateDataForResource(resource, data);
              if (!validation.isValid) {
                throw new NodeOperationError(
                  this.getNode(),
                  `Invalid data: ${validation.errors.join(', ')}`
                );
              }

              body = buildPrestashopXml(resource, { ...data, id });
            }

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
            };

            requestUrl = options.url as string;
            const response = await this.helpers.httpRequest(options);
            responseData = rawMode ? response : simplifyPrestashopResponse(response, resource);
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
