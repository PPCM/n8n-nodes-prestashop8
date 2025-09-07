import { INodeTypeDescription } from 'n8n-workflow';
import { PrestaShop8Description } from './PrestaShop8.node.description';

// Helper function to create variant with shared properties
function createVariant(
  displayName: string,
  name: string,
  resource: string
): INodeTypeDescription {
  return {
    ...PrestaShop8Description,
    displayName,
    name,
    subtitle: `={{$parameter["operation"] + ": ${resource}"}}`,
    defaults: {
      name: displayName,
    },
  };
}

// Create the most commonly used variants
export const PrestaShop8ProductsDescription = createVariant(
  'PrestaShop 8 - Products',
  'prestaShop8Products', 
  'products'
);

export const PrestaShop8OrdersDescription = createVariant(
  'PrestaShop 8 - Orders',
  'prestaShop8Orders',
  'orders'
);

export const PrestaShop8CustomersDescription = createVariant(
  'PrestaShop 8 - Customers', 
  'prestaShop8Customers',
  'customers'
);

export const PrestaShop8CategoriesDescription = createVariant(
  'PrestaShop 8 - Categories',
  'prestaShop8Categories',
  'categories' 
);

export const PrestaShop8StockDescription = createVariant(
  'PrestaShop 8 - Stock',
  'prestaShop8Stock',
  'stock_availables'
);

// All variants for export
export const PRESTASHOP8_VARIANTS = [
  PrestaShop8ProductsDescription,
  PrestaShop8OrdersDescription, 
  PrestaShop8CustomersDescription,
  PrestaShop8CategoriesDescription,
  PrestaShop8StockDescription,
];
