import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { PrestaShop8Description } from './PrestaShop8/PrestaShop8.node.description';
import { PrestaShop8 } from './PrestaShop8/PrestaShop8.node';

export class PrestaShop8Orders implements INodeType {
  description: INodeTypeDescription = {
    ...PrestaShop8Description,
    displayName: 'PrestaShop 8 - Orders',
    name: 'prestaShop8Orders',
    subtitle: '={{$parameter["operation"] + ": Orders"}}',
    defaults: {
      name: 'PrestaShop 8 - Orders',
    },
    // Remove the mode parameter and set defaults
    properties: PrestaShop8Description.properties.filter(prop => prop.name !== 'mode').map(prop => {
      if (prop.name === 'resource') {
        return {
          ...prop,
          default: 'orders',
          displayOptions: undefined, // Always show
        };
      }
      if (prop.name === 'operation') {
        return {
          ...prop,
          displayOptions: {
            show: {
              resource: ['orders'],
            },
          },
        };
      }
      return prop;
    }),
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Use the same execution logic as the main PrestaShop8 node
    const prestaShop8Node = new PrestaShop8();
    return prestaShop8Node.execute.call(this);
  }
}
