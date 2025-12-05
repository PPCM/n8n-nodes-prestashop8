export interface IPrestaShopCredentials {
  baseUrl: string;
  apiKey: string;
}

export interface IPrestaShopFilter {
  field: string;
  operator: string;
  value: string;
  customFilterExpression?: string;
}

export interface IPrestaShopRequestOptions {
  resource: string;
  operation: string;
  id?: string | number;
  limit?: string;
  sort?: string;
  display?: string;
  filters?: IPrestaShopFilter[];
  data?: any;
  rawMode?: boolean;
}

export interface IPrestaShopResource {
  name: string;
  displayName: string;
  description: string;
  supportsCreate: boolean;
  supportsUpdate: boolean;
  supportsDelete: boolean;
  supportsList: boolean;
  supportsGetById: boolean;
  supportsSearch: boolean;
}

// Supported PrestaShop resources
export const PRESTASHOP_RESOURCES: { [key: string]: IPrestaShopResource } = {
  // Customers & CRM
  customers: {
    name: 'customers',
    displayName: 'Customers',
    description: 'Store customer management',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  addresses: {
    name: 'addresses',
    displayName: 'Addresses',
    description: 'Customer and delivery addresses',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  groups: {
    name: 'groups',
    displayName: 'Customer Groups',
    description: 'Customer groups and pricing',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  customer_threads: {
    name: 'customer_threads',
    displayName: 'Customer Threads',
    description: 'Customer conversation threads',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  customer_messages: {
    name: 'customer_messages',
    displayName: 'Customer Messages',
    description: 'Individual conversation messages',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },

  // Product catalog
  products: {
    name: 'products',
    displayName: 'Products',
    description: 'Store product catalog',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  combinations: {
    name: 'combinations',
    displayName: 'Product Combinations',
    description: 'Product variants and combinations',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  stock_availables: {
    name: 'stock_availables',
    displayName: 'Stock Available',
    description: 'Product stock management (stock_availables)',
    supportsCreate: false,
    supportsUpdate: true,
    supportsDelete: false,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  categories: {
    name: 'categories',
    displayName: 'Categories',
    description: 'Product category hierarchy',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  manufacturers: {
    name: 'manufacturers',
    displayName: 'Manufacturers',
    description: 'Brands and manufacturers',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  suppliers: {
    name: 'suppliers',
    displayName: 'Suppliers',
    description: 'Product suppliers',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  tags: {
    name: 'tags',
    displayName: 'Tags',
    description: 'Product tags and keywords',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  product_features: {
    name: 'product_features',
    displayName: 'Product Features',
    description: 'Product features and attributes',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  product_options: {
    name: 'product_options',
    displayName: 'Product Options',
    description: 'Product customization options',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },

  // Orders & Sales
  orders: {
    name: 'orders',
    displayName: 'Orders',
    description: 'Store orders',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  order_details: {
    name: 'order_details',
    displayName: 'Order Details',
    description: 'Order line items',
    supportsCreate: false,
    supportsUpdate: true,
    supportsDelete: false,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  order_histories: {
    name: 'order_histories',
    displayName: 'Order Histories',
    description: 'Order status changes',
    supportsCreate: true,
    supportsUpdate: false,
    supportsDelete: false,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  order_states: {
    name: 'order_states',
    displayName: 'Order States',
    description: 'Possible order states',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  order_carriers: {
    name: 'order_carriers',
    displayName: 'Order Carriers',
    description: 'Order carrier assignments',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  carts: {
    name: 'carts',
    displayName: 'Carts',
    description: 'Customer shopping carts',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  cart_rules: {
    name: 'cart_rules',
    displayName: 'Cart Rules',
    description: 'Discount vouchers and promotions',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },

  // Shipping & Logistics
  carriers: {
    name: 'carriers',
    displayName: 'Carriers',
    description: 'Shipping methods and carriers',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  zones: {
    name: 'zones',
    displayName: 'Geographic Zones',
    description: 'Delivery zones',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  countries: {
    name: 'countries',
    displayName: 'Countries',
    description: 'Country list',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  states: {
    name: 'states',
    displayName: 'States/Regions',
    description: 'States and regions by country',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },

  // Payments & Finance
  currencies: {
    name: 'currencies',
    displayName: 'Currencies',
    description: 'Accepted currencies',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  taxes: {
    name: 'taxes',
    displayName: 'Taxes',
    description: 'Tax rates',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },

  // CMS & Media
  content_management_system: {
    name: 'content_management_system',
    displayName: 'CMS Pages',
    description: 'Static content pages',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  images: {
    name: 'images',
    displayName: 'Images',
    description: 'Product and category images',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },

  // Configuration
  configurations: {
    name: 'configurations',
    displayName: 'Configuration',
    description: 'Store settings',
    supportsCreate: false,
    supportsUpdate: true,
    supportsDelete: false,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  languages: {
    name: 'languages',
    displayName: 'Languages',
    description: 'Supported languages',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  shops: {
    name: 'shops',
    displayName: 'Shops',
    description: 'Multi-store management',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
};

// Available filter operators
export const FILTER_OPERATORS = [
  { name: '= Equal to', value: '=' },
  { name: '≠ Not equal to', value: '!=' },
  { name: '> Greater than', value: '>' },
  { name: '≥ Greater than or equal to', value: '>=' },
  { name: '< Less than', value: '<' },
  { name: '≤ Less than or equal to', value: '<=' },
  { name: '∋ Contains', value: 'CONTAINS' },
  { name: '↦ Starts with', value: 'BEGINS' },
  { name: '↤ Ends with', value: 'ENDS' },
  { name: '∅ Is Empty', value: 'IS_EMPTY' },
  { name: '∄ Is not Empty', value: 'IS_NOT_EMPTY' },
  { name: '⚙️ Custom Filter', value: 'CUSTOM' },
];
