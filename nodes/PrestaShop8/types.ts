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

// Ressources PrestaShop supportées
export const PRESTASHOP_RESOURCES: { [key: string]: IPrestaShopResource } = {
  // Clients & CRM
  customers: {
    name: 'customers',
    displayName: 'Clients',
    description: 'Gestion des clients de la boutique',
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
    displayName: 'Groupes clients',
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
    displayName: 'Messages clients',
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
    displayName: 'Produits',
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
    displayName: 'Déclinaisons produits',
    description: 'Variantes et déclinaisons des produits',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  stock_availables: {
    name: 'stock_availables',
    displayName: 'Stock disponible',
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
    displayName: 'Catégories',
    description: 'Arborescence des catégories produits',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  manufacturers: {
    name: 'manufacturers',
    displayName: 'Fabricants',
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
    displayName: 'Fournisseurs',
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
    displayName: 'Étiquettes',
    description: 'Tags et mots-clés produits',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  product_features: {
    name: 'product_features',
    displayName: 'Caractéristiques produits',
    description: 'Fonctionnalités et attributs produits',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  product_options: {
    name: 'product_options',
    displayName: 'Options produits',
    description: 'Options de personnalisation',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },

  // Commandes & ventes
  orders: {
    name: 'orders',
    displayName: 'Commandes',
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
    displayName: 'Détails commandes',
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
    description: 'Changements d\'état des commandes',
    supportsCreate: true,
    supportsUpdate: false,
    supportsDelete: false,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  order_states: {
    name: 'order_states',
    displayName: 'États commandes',
    description: 'États possibles des commandes',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  carts: {
    name: 'carts',
    displayName: 'Paniers',
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
    displayName: 'Règles panier',
    description: 'Bons de réduction et promotions',
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
    displayName: 'Transporteurs',
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
    displayName: 'Zones géographiques',
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
    displayName: 'Pays',
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
    displayName: 'États/Régions',
    description: 'États et régions par pays',
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
    displayName: 'Devises',
    description: 'Devises acceptées',
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

  // CMS & médias
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
    description: 'Images produits et catégories',
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
    description: 'Paramètres de la boutique',
    supportsCreate: false,
    supportsUpdate: true,
    supportsDelete: false,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  languages: {
    name: 'languages',
    displayName: 'Langues',
    description: 'Langues supportées',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
  shops: {
    name: 'shops',
    displayName: 'Boutiques',
    description: 'Boutiques multiples',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    supportsList: true,
    supportsGetById: true,
    supportsSearch: true,
  },
};

// Opérateurs de filtre disponibles
export const FILTER_OPERATORS = [
  { name: 'Égal à', value: '=' },
  { name: 'Différent de', value: '!=' },
  { name: 'Supérieur à', value: '>' },
  { name: 'Supérieur ou égal à', value: '>=' },
  { name: 'Inférieur à', value: '<' },
  { name: 'Inférieur ou égal à', value: '<=' },
  { name: 'Contient', value: 'LIKE' },
  { name: 'Ne contient pas', value: 'NOT LIKE' },
  { name: 'Commence par', value: 'BEGINS' },
  { name: 'Finit par', value: 'ENDS' },
];
