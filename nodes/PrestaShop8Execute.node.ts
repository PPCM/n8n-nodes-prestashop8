import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { PrestaShop8Description } from './PrestaShop8/PrestaShop8.node.description';
import { PrestaShop8 } from './PrestaShop8/PrestaShop8.node';

export class PrestaShop8Execute implements INodeType {
  description: INodeTypeDescription = {
    ...PrestaShop8Description,
    displayName: 'PrestaShop 8 - Execute',
    name: 'prestaShop8Execute',
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Execute advanced PrestaShop operations with full control',
    defaults: {
      name: 'PrestaShop 8 - Execute',
    },
    // Keep all parameters including mode for advanced users
    properties: PrestaShop8Description.properties.map(prop => {
      if (prop.name === 'mode') {
        return {
          ...prop,
          default: 'custom', // Default to custom mode for Execute variant
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
