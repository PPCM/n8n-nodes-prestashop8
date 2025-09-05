# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Ajouté
- 🎉 **Version initiale du nœud PrestaShop 8**
- ✅ **Support CRUD complet** : Create, Read, Update, Delete, Search
- 🔄 **Conversion automatique XML/JSON** avec simplification des structures PrestaShop
- ⚡ **Mode Raw** pour accès direct aux données brutes XML/JSON
- 🔍 **Recherche avancée** avec filtres, tri, pagination
- 🔐 **Authentification sécurisée** via clé API PrestaShop
- 📱 **25+ ressources supportées** :
  - 👥 Clients & CRM : customers, addresses, groups, customer_threads, customer_messages
  - 📦 Catalogue : products, combinations, stock_availables, categories, manufacturers, suppliers, tags
  - 🛒 Commandes : orders, order_details, order_histories, order_states, carts, cart_rules
  - 🚚 Logistique : carriers, zones, countries, states
  - 🏦 Finances : currencies, taxes, tax_rules, tax_rule_groups
  - 🎨 CMS : content_management_system, images, image_types
  - ⚙️ Config : configurations, languages, shops, shop_groups
- 🎛️ **Interface utilisateur intuitive** avec menus déroulants dynamiques
- 🧪 **Options de debug** : affichage URL, headers, timeout personnalisable
- 📚 **Documentation complète** avec exemples pratiques
- 🔧 **Gestion d'erreurs** robuste avec messages explicites
- 🌐 **Support multilingue** pour les contenus PrestaShop

### Fonctionnalités Techniques
- **Conversion intelligente des types** : string → number/boolean automatique
- **Simplification des associations** PrestaShop en tableaux simples
- **Gestion des champs CDATA** XML automatique
- **Support des opérateurs de filtre** : =, !=, >, >=, <, <=, LIKE, NOT LIKE, BEGINS, ENDS
- **Pagination optimisée** pour gros volumes de données
- **Sélection de champs** personnalisée pour améliorer les performances
- **Validation des données** avant envoi à l'API
- **Transformation noms de champs** : id_manufacturer → manufacturerId

### Exemples d'Usage Inclus
- Synchronisation de catalogue produits
- Gestion automatisée des commandes
- Import/Export de données clients
- Mise à jour de stocks en temps réel
- Intégration CRM et marketing automation
- Rapports et analytics e-commerce

## Types de Changements
- `Added` pour les nouvelles fonctionnalités
- `Changed` pour les changements dans les fonctionnalités existantes  
- `Deprecated` pour les fonctionnalités bientôt supprimées
- `Removed` pour les fonctionnalités maintenant supprimées
- `Fixed` pour les corrections de bugs
- `Security` pour les corrections de vulnérabilités
