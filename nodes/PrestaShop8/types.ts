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
    description: 'Store customer management (customers)',
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
    description: 'Customer and delivery addresses (addresses)',
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
    description: 'Customer groups and pricing (groups)',
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
    description: 'Customer conversation threads (customer_threads)',
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
    description: 'Individual conversation messages (customer_messages)',
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
    description: 'Store product catalog (products)',
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
    description: 'Product variants and combinations (combinations)',
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
  stock_movements: {
    name: 'stock_movements',
    displayName: 'Stock Movements',
    description: 'Product stock movement history (stock_movements)',
    supportsCreate: false,
    supportsUpdate: false,
    supportsDelete: false,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  categories: {
    name: 'categories',
    displayName: 'Categories',
    description: 'Product category hierarchy (categories)',
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
    description: 'Brands and manufacturers (manufacturers)',
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
    description: 'Product suppliers (suppliers)',
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
    description: 'Product tags and keywords (tags)',
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
    description: 'Product features and attributes (product_features)',
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
    description: 'Product customization options (product_options)',
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
    description: 'Store orders (orders)',
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
    description: 'Order line items (order_details)',
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
    description: 'Order status changes (order_histories)',
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
    description: 'Possible order states (order_states)',
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
    description: 'Order carrier assignments (order_carriers)',
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
    description: 'Customer shopping carts (carts)',
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
    description: 'Discount vouchers and promotions (cart_rules)',
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
    description: 'Shipping methods and carriers (carriers)',
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
    description: 'Delivery zones (zones)',
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
    description: 'Country list (countries)',
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
    description: 'States and regions by country (states)',
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
    description: 'Accepted currencies (currencies)',
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
    description: 'Tax rates (taxes)',
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
    description: 'Static content pages (content_management_system)',
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
    description: 'Product and category images (images)',
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
    description: 'Store settings (configurations)',
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
    description: 'Supported languages (languages)',
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
    description: 'Multi-store management (shops)',
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
