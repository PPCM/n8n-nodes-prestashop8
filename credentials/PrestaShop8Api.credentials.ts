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
      placeholder: 'https://your-store.com/api',
      description: 'PrestaShop API base URL (e.g., https://your-store.com/api)',
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
      description: 'PrestaShop API key generated in back office (Advanced Parameters > Web Service)',
      required: true,
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
      // Normalize the base URL like the node does (strip trailing slash,
      // ensure the /api suffix) so the test matches runtime behavior
      url: '={{ ($credentials.baseUrl.trim().replace(new RegExp("/+$"), "") + "/api").replace(new RegExp("/api/api$"), "/api") }}/products?display=[id]&limit=1',
      method: 'GET',
    },
  };
}
