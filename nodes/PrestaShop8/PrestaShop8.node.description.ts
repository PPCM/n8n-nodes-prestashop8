import { INodeTypeDescription } from 'n8n-workflow';
import { PRESTASHOP_RESOURCES, FILTER_OPERATORS } from './types';

export const PrestaShop8Description: INodeTypeDescription = {
  displayName: 'PrestaShop 8',
  name: 'prestaShop8',
  group: ['transform'],
  icon: 'file:prestashop8.svg' as any,
  version: 1,
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
  // Note: Headers are set dynamically based on raw mode
  properties: [
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

    // Resource selection
    {
      displayName: 'Resource',
      name: 'resource',
      type: 'options',
      noDataExpression: true,
      options: Object.values(PRESTASHOP_RESOURCES).map(resource => ({
        name: resource.displayName,
        value: resource.name,
        description: resource.description,
      })),
      default: 'products',
      required: true,
      description: 'PrestaShop resource type to manipulate',
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

    // Raw Mode
    {
      displayName: 'Raw Mode',
      name: 'rawMode',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['list', 'getById', 'search'],
        },
      },
      description: 'Return raw PrestaShop XML/JSON format instead of simplified structure. Useful for accessing all original data fields.',
    },

    // ID for specific operations
    {
      displayName: 'ID',
      name: 'id',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['getById', 'update', 'delete'],
        },
      },
      default: '',
      required: true,
      description: 'ID of the item to retrieve, modify or delete',
    },

    // Pagination and sorting parameters
    {
      displayName: 'Advanced Options',
      name: 'advancedOptions',
      type: 'collection',
      displayOptions: {
        show: {
          operation: ['list', 'search'],
        },
      },
      default: {},
      placeholder: 'Ajouter une option',
      options: [
        {
          displayName: 'Limite',
          name: 'limit',
          type: 'string',
          default: '',
          placeholder: '20 ou 10,30',
          description: 'Number of items to return (e.g. 20) or pagination (e.g. 10,30)',
        },
        {
          displayName: 'Tri',
          name: 'sort',
          type: 'string',
          default: '',
          placeholder: '[id_DESC] ou [name_ASC]',
          description: 'Sort criteria (e.g. [id_DESC], [name_ASC], [date_add_DESC])',
        },
        {
          displayName: 'Affichage',
          name: 'display',
          type: 'options',
          options: [
            {
              name: 'Complet',
              value: 'full',
              description: 'Tous les champs disponibles',
            },
            {
              name: 'Minimal',
              value: 'minimal',
              description: 'Champs essentiels uniquement',
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
        {
          displayName: 'Custom Fields',
          name: 'customFields',
          type: 'string',
          displayOptions: {
            show: {
              display: ['custom'],
            },
          },
          default: '',
          placeholder: 'id,name,price,reference',
          description: 'List of fields to return, separated by commas',
        },
      ],
    },

    // Filtres de recherche
    {
      displayName: 'Filtres de recherche',
      name: 'filters',
      type: 'fixedCollection',
      displayOptions: {
        show: {
          operation: ['search'],
        },
      },
      default: {},
      placeholder: 'Ajouter un filtre',
      typeOptions: {
        multipleValues: true,
      },
      options: [
        {
          name: 'filter',
          displayName: 'Filtre',
          values: [
            {
              displayName: 'Champ',
              name: 'field',
              type: 'string',
              default: '',
              required: true,
              placeholder: 'name, reference, price, etc.',
              description: 'Name of field to filter',
            },
            {
              displayName: 'Operator',
              name: 'operator',
              type: 'options',
              options: FILTER_OPERATORS,
              default: '=',
              description: 'Comparison operator',
            },
            {
              displayName: 'Valeur',
              name: 'value',
              type: 'string',
              default: '',
              required: true,
              description: 'Value to search for',
            },
          ],
        },
      ],
      description: 'PrestaShop filters to apply to the search',
    },

    // Data for create/update
    {
      displayName: 'Data',
      name: 'data',
      type: 'json',
      displayOptions: {
        show: {
          operation: ['create', 'update'],
        },
      },
      default: '{}',
      required: true,
      description: 'JSON data to send to PrestaShop (will be automatically converted to XML)',
      typeOptions: {
        rows: 10,
      },
    },

    // Mode XML manuel pour le Raw Mode
    {
      displayName: 'XML Manuel',
      name: 'manualXml',
      type: 'string',
      displayOptions: {
        show: {
          operation: ['create', 'update'],
          rawMode: [true],
        },
      },
      default: '',
      description: 'PrestaShop XML to send directly (Raw Mode only)',
      typeOptions: {
        rows: 15,
      },
    },

    // Options de debug
    {
      displayName: 'Options de debug',
      name: 'debugOptions',
      type: 'collection',
      default: {},
      placeholder: 'Ajouter une option',
      options: [
        {
          displayName: 'Show Request URL',
          name: 'showUrl',
          type: 'boolean',
          default: false,
          description: 'Add request URL to the response',
        },
        {
          displayName: 'Afficher headers',
          name: 'showHeaders',
          type: 'boolean',
          default: false,
          description: 'Add HTTP headers to the response',
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
