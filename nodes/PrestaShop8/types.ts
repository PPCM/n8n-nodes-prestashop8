export interface IPrestaShopCredentials {
  baseUrl: string;
  apiKey: string;
}

export interface IPrestaShopFilter {
  field: string;
  operator: string;
  value: string;
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
    displayName: 'Adresses',
    description: 'Adresses clients et de livraison',
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
    description: 'Groupes de clients et tarifs',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  customer_threads: {
    name: 'customer_threads',
    displayName: 'Conversations clients',
    description: 'Fil de discussions avec les clients',
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
    description: 'Messages individuels des conversations',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },

  // Catalogue produits
  products: {
    name: 'products',
    displayName: 'Products',
    description: 'Catalogue des produits de la boutique',
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
    displayName: 'Available Stock',
    description: 'Gestion des stocks produits',
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
    description: 'Marques et fabricants',
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
    description: 'Fournisseurs des produits',
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
    description: 'Options de personnalisation',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },

  // Orders & ventes
  orders: {
    name: 'orders',
    displayName: 'Orders',
    description: 'Commandes de la boutique',
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
    description: 'Lignes des commandes',
    supportsCreate: false,
    supportsUpdate: true,
    supportsDelete: false,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  order_histories: {
    name: 'order_histories',
    displayName: 'Historique commandes',
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
  carts: {
    name: 'carts',
    displayName: 'Carts',
    description: 'Paniers d\'achat clients',
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

  // Transport & logistique
  carriers: {
    name: 'carriers',
    displayName: 'Carriers',
    description: 'Modes de livraison et transporteurs',
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
    description: 'Zones de livraison',
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
    description: 'Liste des pays',
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

  // Paiements & finances
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
    description: 'Taux de taxation',
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
    displayName: 'Pages CMS',
    description: 'Pages de contenu statique',
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
    supportsUpdate: false,
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
    description: 'Boutiques multiples',
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
  { name: 'Equal to', value: '=' },
  { name: 'Not equal to', value: '!=' },
  { name: 'Greater than', value: '>' },
  { name: 'Greater than or equal to', value: '>=' },
  { name: 'Less than', value: '<' },
  { name: 'Less than or equal to', value: '<=' },
  { name: 'Contient', value: 'LIKE' },
  { name: 'Ne contient pas', value: 'NOT LIKE' },
  { name: 'Commence par', value: 'BEGINS' },
  { name: 'Finit par', value: 'ENDS' },
];
