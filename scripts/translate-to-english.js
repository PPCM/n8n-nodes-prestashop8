#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Dictionnaire de traductions
const translations = {
  // Comments in types.ts
  "// Ressources PrestaShop supportées": "// Supported PrestaShop resources",
  "// Clients & CRM": "// Customers & CRM",
  "// Produits": "// Products",
  "// Commandes": "// Orders",
  "// Logistique": "// Logistics",
  "// Finances": "// Finance",
  "// CMS & Contenu": "// CMS & Content",
  "// Configuration": "// Configuration",
  
  // Resource displayNames
  "'Clients'": "'Customers'",
  "'Adresses clients'": "'Customer Addresses'",
  "'Groupes clients'": "'Customer Groups'",
  "'Messages clients'": "'Customer Messages'",
  "'Fils de discussion'": "'Customer Threads'",
  "'Produits'": "'Products'",
  "'Déclinaisons produits'": "'Product Combinations'",
  "'Stock disponible'": "'Available Stock'",
  "'Catégories'": "'Categories'",
  "'Fabricants'": "'Manufacturers'",
  "'Fournisseurs'": "'Suppliers'",
  "'Étiquettes'": "'Tags'",
  "'Caractéristiques produits'": "'Product Features'",
  "'Options produits'": "'Product Options'",
  "'Commandes'": "'Orders'",
  "'Détails commandes'": "'Order Details'",
  "'Historiques commandes'": "'Order Histories'",
  "'États commandes'": "'Order States'",
  "'Paniers'": "'Carts'",
  "'Règles panier'": "'Cart Rules'",
  "'Transporteurs commandes'": "'Order Carriers'",
  "'Factures'": "'Invoices'",
  "'Transporteurs'": "'Carriers'",
  "'Zones géographiques'": "'Geographic Zones'",
  "'Pays'": "'Countries'",
  "'États/Régions'": "'States/Regions'",
  "'Devises'": "'Currencies'",
  "'Taxes'": "'Taxes'",
  "'Règles de taxes'": "'Tax Rules'",
  "'Groupes de règles taxes'": "'Tax Rule Groups'",
  "'Système de gestion contenu'": "'Content Management System'",
  "'Images'": "'Images'",
  "'Types d\'images'": "'Image Types'",
  "'Traductions'": "'Translations'",
  "'Configurations'": "'Configurations'",
  "'Langues'": "'Languages'",
  "'Boutiques'": "'Shops'",
  "'Groupes de boutiques'": "'Shop Groups'",
  "'Magasins'": "'Stores'",
  
  // Resource descriptions
  "'Gestion des clients de la boutique'": "'Store customer management'",
  "'Adresses de livraison et facturation des clients'": "'Customer delivery and billing addresses'",
  "'Groupes de clients avec tarifs spécifiques'": "'Customer groups with specific pricing'",
  "'Messages et communications avec les clients'": "'Messages and communications with customers'",
  "'Fils de discussion du service client'": "'Customer service discussion threads'",
  "'Catalogue de produits de la boutique'": "'Store product catalog'",
  "'Variantes et déclinaisons des produits'": "'Product variants and combinations'",
  "'Gestion des stocks par produit et déclinaison'": "'Stock management by product and combination'",
  "'Organisation des produits en catégories'": "'Product organization in categories'",
  "'Marques et fabricants des produits'": "'Product brands and manufacturers'",
  "'Fournisseurs et approvisionnement'": "'Suppliers and sourcing'",
  "'Étiquettes et mots-clés produits'": "'Product tags and keywords'",
  "'Caractéristiques techniques des produits'": "'Product technical features'",
  "'Options de personnalisation produits'": "'Product customization options'",
  "'Commandes passées par les clients'": "'Orders placed by customers'",
  "'Détails et lignes des commandes'": "'Order details and line items'",
  "'Historique des modifications de commandes'": "'Order modification history'",
  "'États et statuts des commandes'": "'Order states and statuses'",
  "'Paniers d\'achat en cours et abandonnés'": "'Active and abandoned shopping carts'",
  "'Règles de réduction et promotions'": "'Discount rules and promotions'",
  "'Transporteurs associés aux commandes'": "'Carriers associated with orders'",
  "'Factures générées pour les commandes'": "'Invoices generated for orders'",
  "'Sociétés de transport et livraison'": "'Shipping and delivery companies'",
  "'Zones géographiques pour la livraison'": "'Geographic zones for delivery'",
  "'Pays de livraison disponibles'": "'Available delivery countries'",
  "'États et régions pour l\'adressage'": "'States and regions for addressing'",
  "'Devises acceptées dans la boutique'": "'Currencies accepted in the store'",
  "'Configuration des taxes'": "'Tax configuration'",
  "'Règles d\'application des taxes'": "'Tax application rules'",
  "'Groupes de règles fiscales'": "'Tax rule groups'",
  "'Pages et contenu statique du site'": "'Site pages and static content'",
  "'Images utilisées sur le site'": "'Images used on the site'",
  "'Types et formats d\'images'": "'Image types and formats'",
  "'Textes et traductions multilingues'": "'Multilingual texts and translations'",
  "'Paramètres de configuration générale'": "'General configuration settings'",
  "'Langues disponibles sur le site'": "'Languages available on the site'",
  "'Configuration des boutiques multiples'": "'Multi-store configuration'",
  "'Groupes de boutiques pour la gestion multisite'": "'Store groups for multisite management'",
  "'Magasins physiques et points de retrait'": "'Physical stores and pickup points'",
  
  // Remaining descriptions and comments
  "'Arborescence des catégories produits'": "'Product category hierarchy'",
  "'Tags et mots-clés produits'": "'Product tags and keywords'",
  "'Fonctionnalités et attributs produits'": "'Product features and attributes'",
  "'Changements d\\'état des commandes'": "'Order status changes'",
  "'États possibles des commandes'": "'Possible order states'",
  "'Bons de réduction et promotions'": "'Discount vouchers and promotions'",
  "'États et régions par pays'": "'States and regions by country'",
  "'Devises acceptées'": "'Accepted currencies'",
  "// CMS & médias": "// CMS & Media",
  "'Images produits et catégories'": "'Product and category images'",
  "'Paramètres de la boutique'": "'Store settings'",
  "'Langues supportées'": "'Supported languages'",
  
  // Filter operators
  "// Opérateurs de filtre disponibles": "// Available filter operators",
  "{ name: 'Égal à', value: '=' }": "{ name: 'Equal to', value: '=' }",
  "{ name: 'Différent de', value: '!=' }": "{ name: 'Not equal to', value: '!=' }",
  "{ name: 'Supérieur à', value: '>' }": "{ name: 'Greater than', value: '>' }",
  "{ name: 'Supérieur ou égal à', value: '>=' }": "{ name: 'Greater than or equal to', value: '>=' }",
  "{ name: 'Inférieur à', value: '<' }": "{ name: 'Less than', value: '<' }",
  "{ name: 'Inférieur ou égal à', value: '<=' }": "{ name: 'Less than or equal to', value: '<=' }",
  
  // Node operation labels
  "'Personnalisé'": "'Custom'",
  "// Données pour création/mise à jour": "// Data for create/update",
  "// Charge les opérations dynamiquement selon la ressource": "// Load operations dynamically based on resource",
  "'Récupérer par ID'": "'Get by ID'",
  "'Créer'": "'Create'",
  "'Mettre à jour'": "'Update'",
  
  // Dynamic descriptions in node operations
  "`Récupérer tous les \${resourceConfig.displayName.toLowerCase()}`": "`Get all \${resourceConfig.displayName.toLowerCase()}`",
  "`Récupérer un \${resourceConfig.displayName.toLowerCase()} par son ID`": "`Get a \${resourceConfig.displayName.toLowerCase()} by its ID`",
  "`Rechercher des \${resourceConfig.displayName.toLowerCase()} avec des filtres avancés`": "`Search \${resourceConfig.displayName.toLowerCase()} with advanced filters`",
  "`Créer un nouveau \${resourceConfig.displayName.toLowerCase()}`": "`Create a new \${resourceConfig.displayName.toLowerCase()}`",
  "`Mettre à jour un \${resourceConfig.displayName.toLowerCase()} existant`": "`Update an existing \${resourceConfig.displayName.toLowerCase()}`",
  
  // Error messages
  "'ID requis pour cette opération'": "'ID required for this operation'",
  "`Données invalides: \${validation.errors.join(', ')}`": "`Invalid data: \${validation.errors.join(', ')}`",
  "`\${resource} avec l'ID \${id} supprimé avec succès`": "`\${resource} with ID \${id} deleted successfully`",
  "`Opération \"\${operation}\" non supportée`": "`Operation \"\${operation}\" not supported`",
  "// Ajouter des métadonnées de debug si demandées": "// Add debug metadata if requested",
  
  // Utils comments
  "* Simplifie la réponse XML/JSON de PrestaShop en JSON simplifié": "* Simplifies PrestaShop XML/JSON response to simplified JSON",
  "// Si c'est déjà simplifié, retourner tel quel": "// If already simplified, return as is",
  "// Si c'est un tableau, traiter chaque élément": "// If it's an array, process each element",
  "* Simplifie un élément individuel": "* Simplifies an individual element",
  "// Cas d'une association avec un seul élément": "// Case of an association with a single element",
  ".replace(/^id_/, '') // Supprimer le préfixe id_": ".replace(/^id_/, '') // Remove id_ prefix",
  "* Convertit les valeurs string en types appropriés": "* Converts string values to appropriate types",
  "// Convertir les booléens": "// Convert booleans",
  "* Construit du XML PrestaShop à partir de JSON simplifié": "* Builds PrestaShop XML from simplified JSON",
  "* Convertit JSON simplifié vers le format PrestaShop": "* Converts simplified JSON to PrestaShop format",
  "// Détecter les associations (tableaux d'IDs)": "// Detect associations (arrays of IDs)",
  "// Ajouter les associations si présentes": "// Add associations if present",
  
  // More utils comments and validation messages
  "* Convertit camelCase vers snake_case avec préfixes PrestaShop": "* Converts camelCase to snake_case with PrestaShop prefixes",
  "// Mapper certains champs spéciaux": "// Map certain special fields",
  "// Conversion générique camelCase vers snake_case": "// Generic camelCase to snake_case conversion",
  "* Construit l'URL avec les paramètres de filtre": "* Builds URL with filter parameters",
  "// Appliquer l'opérateur si ce n'est pas '='": "// Apply operator if it's not '='",
  "// Ajouter les autres paramètres": "// Add other parameters",
  "* Valide les données avant envoi": "* Validates data before sending",
  "'Les données doivent être un objet valide'": "'Data must be a valid object'",
  "// Validations spécifiques par ressource": "// Resource-specific validations",
  "'Un email est requis pour créer un client'": "'An email is required to create a customer'",
  "'Un nom est requis pour créer un produit'": "'A name is required to create a product'",
  "'Un ID client est requis pour créer une commande'": "'A customer ID is required to create an order'",
  
  // Additional comments in node.ts
  "// En mode Raw, utilisons axios directement pour éviter le parsing automatique de n8n": "// In Raw mode, use axios directly to avoid n8n automatic parsing",
  "// Garde la réponse brute": "// Keep raw response",
  // Comments
  "// Documentation intégrée": "// Integrated documentation",
  "// Sélection de la ressource": "// Resource selection", 
  "// Sélection de l'opération": "// Operation selection",
  "// ID pour les opérations spécifiques": "// ID for specific operations",
  "// Paramètres de pagination et tri": "// Pagination and sorting parameters",
  "// Mode Raw": "// Raw Mode",
  
  // Display names
  "'Ressource'": "'Resource'",
  "'Opération'": "'Operation'",
  "'Options avancées'": "'Advanced Options'",
  "'Données'": "'Data'",
  "'Champs personnalisés'": "'Custom Fields'",
  "'Opérateur'": "'Operator'",
  "'Afficher URL de requête'": "'Show Request URL'",
  
  // Descriptions
  "'Nœud n8n pour PrestaShop 8 avec conversion XML/JSON automatique et support CRUD complet'": "'n8n node for PrestaShop 8 with automatic XML/JSON conversion and full CRUD support'",
  "'Type de ressource PrestaShop à manipuler'": "'PrestaShop resource type to manipulate'",
  "'Opération à effectuer sur la ressource'": "'Operation to perform on the resource'",
  "'Si activé, retourne les données brutes PrestaShop (XML/JSON natif) sans conversion automatique'": "'If enabled, returns raw PrestaShop data (native XML/JSON) without automatic conversion'",
  "'ID de l\\'élément à récupérer, modifier ou supprimer'": "'ID of the item to retrieve, modify or delete'",
  "'Nombre d\\'éléments à retourner (ex: 20) ou pagination (ex: 10,30)'": "'Number of items to return (e.g. 20) or pagination (e.g. 10,30)'",
  "'Critère de tri (ex: [id_DESC], [name_ASC], [date_add_DESC])'": "'Sort criteria (e.g. [id_DESC], [name_ASC], [date_add_DESC])'",
  "'Liste de champs spécifique'": "'Specific field list'",
  "'Niveau de détail des données retournées'": "'Level of detail of returned data'",
  "'Liste des champs à retourner, séparés par des virgules'": "'List of fields to return, separated by commas'",
  "'Nom du champ à filtrer'": "'Name of field to filter'",
  "'Opérateur de comparaison'": "'Comparison operator'",
  "'Valeur à rechercher'": "'Value to search for'",
  "'Filtres PrestaShop à appliquer à la recherche'": "'PrestaShop filters to apply to the search'",
  "'Données JSON à envoyer à PrestaShop (sera automatiquement converti en XML)'": "'JSON data to send to PrestaShop (will be automatically converted to XML)'",
  "'XML PrestaShop à envoyer directement (Mode Raw uniquement)'": "'PrestaShop XML to send directly (Raw Mode only)'",
  "'Ajouter l\\'URL de requête dans la réponse'": "'Add request URL to the response'",
  "'Ajouter les headers HTTP dans la réponse'": "'Add HTTP headers to the response'",
  "'Timeout de la requête en millisecondes'": "'Request timeout in milliseconds'",
  
  // Documentation options
  "'🚀 Guide de démarrage rapide'": "'🚀 Quick Start Guide'",
  "'Configuration et premiers pas avec PrestaShop 8'": "'Configuration and first steps with PrestaShop 8'",
  "'🔑 Authentification API'": "'🔑 API Authentication'",
  "'Configuration de la clé API PrestaShop'": "'PrestaShop API key configuration'",
  "'🔄 Conversion XML/JSON'": "'🔄 XML/JSON Conversion'",
  "'Comment fonctionne la simplification automatique'": "'How automatic simplification works'",
  "'🔍 Recherche et filtres'": "'🔍 Search and Filters'",
  "'Utilisation des filtres PrestaShop avancés'": "'Using advanced PrestaShop filters'",
  "'⚡ Mode Raw'": "'⚡ Raw Mode'",
  "'Utilisation du mode données brutes'": "'Using raw data mode'",
  "'📝 Exemples pratiques'": "'📝 Practical Examples'",
  "'Cas d\\'usage courants et exemples de code'": "'Common use cases and code examples'",
  
  // Placeholders
  "'https://votre-boutique.com/api'": "'https://your-store.com/api'",
  "'URL de base de l\\'API PrestaShop (ex: https://votre-boutique.com/api)'": "'PrestaShop API base URL (e.g., https://your-store.com/api)'",
  "'Clé API PrestaShop générée dans le back-office (Paramètres avancés > Service Web)'": "'PrestaShop API key generated in back office (Advanced Parameters > Web Service)'",
  "'Tester automatiquement la connexion lors de la sauvegarde'": "'Automatically test the connection when saving credentials'"
};

function translateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply translations
    for (const [french, english] of Object.entries(translations)) {
      const regex = new RegExp(french.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(french)) {
        content = content.replace(regex, english);
        modified = true;
        console.log(`✅ Translated: ${french} -> ${english}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`📝 Updated file: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Find and translate TypeScript files
const tsFiles = [
  'credentials/PrestaShop8Api.credentials.ts',
  'nodes/PrestaShop8/PrestaShop8.node.description.ts',
  'nodes/PrestaShop8/PrestaShop8.node.ts',
  'nodes/PrestaShop8/types.ts',
  'nodes/PrestaShop8/utils.ts'
];

console.log('🔄 Starting translation to English...\n');

let totalModified = 0;

tsFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`\n📂 Processing: ${file}`);
    if (translateFile(fullPath)) {
      totalModified++;
    } else {
      console.log(`✅ No French text found in ${file}`);
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log(`\n🎉 Translation complete! ${totalModified} files modified.`);
console.log('\n🔧 Next steps:');
console.log('1. npm run build');
console.log('2. Test the node in n8n');
console.log('3. Verify all UI text is in English');
