import { INodeTypeDescription } from 'n8n-workflow';
import { PRESTASHOP_RESOURCES, FILTER_OPERATORS } from './types';

export const PrestaShop8Description: INodeTypeDescription = {
  displayName: 'PrestaShop 8',
  name: 'prestaShop8',
  group: ['transform'],
  version: 1,
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Nœud n8n pour PrestaShop 8 avec conversion XML/JSON automatique et support CRUD complet',
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
  requestDefaults: {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/xml',
    },
  },
  properties: [
    // Documentation intégrée
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
          name: '🚀 Guide de démarrage rapide',
          value: 'quickstart',
          description: 'Configuration et premiers pas avec PrestaShop 8',
        },
        {
          name: '🔑 Authentification API',
          value: 'auth',
          description: 'Configuration de la clé API PrestaShop',
        },
        {
          name: '🔄 Conversion XML/JSON',
          value: 'conversion',
          description: 'Comment fonctionne la simplification automatique',
        },
        {
          name: '🔍 Recherche et filtres',
          value: 'filters',
          description: 'Utilisation des filtres PrestaShop avancés',
        },
        {
          name: '⚡ Mode Raw',
          value: 'rawmode',
          description: 'Utilisation du mode données brutes',
        },
        {
          name: '📝 Exemples pratiques',
          value: 'examples',
          description: 'Cas d\'usage courants et exemples de code',
        },
      ],
    },

    // Sélection de la ressource
    {
      displayName: 'Ressource',
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
      description: 'Type de ressource PrestaShop à manipuler',
    },

    // Sélection de l'opération
    {
      displayName: 'Opération',
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
      description: 'Opération à effectuer sur la ressource',
    },

    // Mode Raw
    {
      displayName: 'Mode Raw',
      name: 'rawMode',
      type: 'boolean',
      default: false,
      description: 'Si activé, retourne les données brutes PrestaShop (XML/JSON natif) sans conversion automatique',
    },

    // ID pour les opérations spécifiques
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
      description: 'ID de l\'élément à récupérer, modifier ou supprimer',
    },

    // Paramètres de pagination et tri
    {
      displayName: 'Options avancées',
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
          description: 'Nombre d\'éléments à retourner (ex: 20) ou pagination (ex: 10,30)',
        },
        {
          displayName: 'Tri',
          name: 'sort',
          type: 'string',
          default: '',
          placeholder: '[id_DESC] ou [name_ASC]',
          description: 'Critère de tri (ex: [id_DESC], [name_ASC], [date_add_DESC])',
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
              name: 'Personnalisé',
              value: 'custom',
              description: 'Liste de champs spécifique',
            },
          ],
          default: 'full',
          description: 'Niveau de détail des données retournées',
        },
        {
          displayName: 'Champs personnalisés',
          name: 'customFields',
          type: 'string',
          displayOptions: {
            show: {
              display: ['custom'],
            },
          },
          default: '',
          placeholder: 'id,name,price,reference',
          description: 'Liste des champs à retourner, séparés par des virgules',
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
              description: 'Nom du champ à filtrer',
            },
            {
              displayName: 'Opérateur',
              name: 'operator',
              type: 'options',
              options: FILTER_OPERATORS,
              default: '=',
              description: 'Opérateur de comparaison',
            },
            {
              displayName: 'Valeur',
              name: 'value',
              type: 'string',
              default: '',
              required: true,
              description: 'Valeur à rechercher',
            },
          ],
        },
      ],
      description: 'Filtres PrestaShop à appliquer à la recherche',
    },

    // Données pour création/mise à jour
    {
      displayName: 'Données',
      name: 'data',
      type: 'json',
      displayOptions: {
        show: {
          operation: ['create', 'update'],
        },
      },
      default: '{}',
      required: true,
      description: 'Données JSON à envoyer à PrestaShop (sera automatiquement converti en XML)',
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
      description: 'XML PrestaShop à envoyer directement (Mode Raw uniquement)',
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
          displayName: 'Afficher URL de requête',
          name: 'showUrl',
          type: 'boolean',
          default: false,
          description: 'Ajouter l\'URL de requête dans la réponse',
        },
        {
          displayName: 'Afficher headers',
          name: 'showHeaders',
          type: 'boolean',
          default: false,
          description: 'Ajouter les headers HTTP dans la réponse',
        },
        {
          displayName: 'Timeout (ms)',
          name: 'timeout',
          type: 'number',
          default: 30000,
          description: 'Timeout de la requête en millisecondes',
        },
      ],
    },
  ],
};
