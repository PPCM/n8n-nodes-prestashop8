import { IExecuteFunctions, INodeExecutionData, INodeType } from 'n8n-workflow';

import { PrestaShop8CustomersDescription } from './PrestaShop8.variants';
import { PrestaShop8 } from './PrestaShop8.node';

export class PrestaShop8Customers implements INodeType {
  description = PrestaShop8CustomersDescription;

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Use the same execution logic as the main PrestaShop8 node
    const prestaShop8Node = new PrestaShop8();
    return prestaShop8Node.execute.call(this);
  }
}
