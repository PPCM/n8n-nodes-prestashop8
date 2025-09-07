import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { PrestaShop8Description } from './PrestaShop8/PrestaShop8.node.description';
import { PrestaShop8 } from './PrestaShop8/PrestaShop8.node';

export class PrestaShop8Products implements INodeType {
  description: INodeTypeDescription = {
    ...PrestaShop8Description,
    displayName: 'PrestaShop 8 - Products',
    name: 'prestaShop8Products',
    subtitle: '={{$parameter["operation"] + ": Products"}}',
    defaults: {
      name: 'PrestaShop 8 - Products',
    },
    // Remove the mode parameter and set defaults
    properties: PrestaShop8Description.properties.filter(prop => prop.name !== 'mode').map(prop => {
      if (prop.name === 'resource') {
        return {
          ...prop,
          default: 'products',
          displayOptions: undefined, // Always show
        };
      }
      if (prop.name === 'operation') {
        return {
          ...prop,
          displayOptions: {
            show: {
              resource: ['products'],
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
