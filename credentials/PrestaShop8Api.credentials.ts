import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class PrestaShop8Api implements ICredentialType {
  name = 'prestaShop8Api';
  displayName = 'PrestaShop 8 API';
  documentationUrl = 'https://devdocs.prestashop-project.org/8/webservice/';
  properties: INodeProperties[] = [
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: '',
      placeholder: 'https://votre-boutique.com/api',
      description: 'URL de base de l\'API PrestaShop (ex: https://votre-boutique.com/api)',
      required: true,
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Clé API PrestaShop générée dans le back-office (Paramètres avancés > Service Web)',
      required: true,
    },
    {
      displayName: 'Test Connection',
      name: 'testConnection',
      type: 'boolean',
      default: false,
      description: 'Tester automatiquement la connexion lors de la sauvegarde',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      auth: {
        username: '={{$credentials.apiKey}}',
        password: '',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl}}',
      url: '/',
      method: 'GET',
      headers: {
        'Output-Format': 'JSON',
      },
    },
  };
}
