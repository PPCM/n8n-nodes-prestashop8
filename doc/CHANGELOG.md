# Changelog

**🌍 Available in:** [English](#english) | [Français](#français) | [Deutsch](#deutsch) | [Español](#español)

---

## English

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### [1.0.0] - 2024-01-XX

#### Added
- 🎉 **Initial release of PrestaShop 8 node**
- ✅ **Complete CRUD support**: Create, Read, Update, Delete, Search
- 🔄 **Automatic XML/JSON conversion** with PrestaShop structure simplification
- ⚡ **Raw mode** for direct access to raw XML/JSON data
- 🔍 **Advanced search** with filters, sorting, pagination
- 🔐 **Secure authentication** via PrestaShop API key
- 📱 **25+ supported resources**
- 🏛️ **Intuitive user interface** with dynamic dropdown menus
- 🧪 **Debug options**: URL display, headers, customizable timeout
- 📚 **Complete documentation** with practical examples
- 🌍 **Multilingual documentation**: English, French, German, Spanish

---

## Français

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### [1.0.0] - 2024-01-XX

#### Ajouté
- 🎉 **Version initiale du nœud PrestaShop 8**
- ✅ **Support CRUD complet** : Create, Read, Update, Delete, Search
- 🔄 **Conversion automatique XML/JSON** avec simplification des structures PrestaShop
- ⚡ **Mode Raw** pour accès direct aux données brutes XML/JSON
- 🔍 **Recherche avancée** avec filtres, tri, pagination
- 🔐 **Authentification sécurisée** via clé API PrestaShop
- 📱 **25+ ressources supportées**
- 🏛️ **Interface utilisateur intuitive** avec menus déroulants dynamiques
- 🧪 **Options de debug** : affichage URL, headers, timeout personnalisable
- 📚 **Documentation complète** avec exemples pratiques
- 🌍 **Documentation multilingue** : Anglais, Français, Allemand, Espagnol

---

## Deutsch

Alle bemerkenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt der [Semantischen Versionierung](https://semver.org/lang/de/).

### [1.0.0] - 2024-01-XX

#### Hinzugefügt
- 🎉 **Erstveröffentlichung des PrestaShop 8 Nodes**
- ✅ **Vollständige CRUD-Unterstützung**: Create, Read, Update, Delete, Search
- 🔄 **Automatische XML/JSON-Konvertierung** mit Vereinfachung der PrestaShop-Strukturen
- ⚡ **Raw-Modus** für direkten Zugang zu rohen XML/JSON-Daten
- 🔍 **Erweiterte Suche** mit Filtern, Sortierung, Paginierung
- 🔐 **Sichere Authentifizierung** über PrestaShop-API-Schlüssel
- 📱 **25+ unterstützte Ressourcen**
- 🏛️ **Intuitive Benutzeroberfläche** mit dynamischen Dropdown-Menüs
- 🧪 **Debug-Optionen**: URL-Anzeige, Headers, anpassbare Timeouts
- 📚 **Vollständige Dokumentation** mit praktischen Beispielen
- 🌍 **Mehrsprachige Dokumentation**: Englisch, Französisch, Deutsch, Spanisch

---

## Español

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere al [Versionado Semántico](https://semver.org/lang/es/).

### [1.0.0] - 2024-01-XX

#### Agregado
- 🎉 **Lanzamiento inicial del nodo PrestaShop 8**
- ✅ **Soporte CRUD completo**: Create, Read, Update, Delete, Search
- 🔄 **Conversión automática XML/JSON** con simplificación de estructuras PrestaShop
- ⚡ **Modo Raw** para acceso directo a datos XML/JSON en bruto
- 🔍 **Búsqueda avanzada** con filtros, ordenamiento, paginación
- 🔐 **Autenticación segura** vía clave API de PrestaShop
- 📱 **25+ recursos soportados**
- 🏛️ **Interfaz de usuario intuitiva** con menús desplegables dinámicos
- 🧪 **Opciones de debug**: visualización URL, headers, timeout personalizable
- 📚 **Documentación completa** con ejemplos prácticos
- 🌍 **Documentación multilingüe**: Inglés, Francés, Alemán, Español

---

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
