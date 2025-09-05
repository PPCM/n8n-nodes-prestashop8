# n8n PrestaShop 8 Node

[![npm version](https://badge.fury.io/js/n8n-nodes-prestashop8.svg)](https://www.npmjs.com/package/n8n-nodes-prestashop8)
[![Downloads](https://img.shields.io/npm/dt/n8n-nodes-prestashop8.svg)](https://www.npmjs.com/package/n8n-nodes-prestashop8)
[![GitHub license](https://img.shields.io/github/license/PPCM/n8n-nodes-prestashop8)](https://github.com/PPCM/n8n-nodes-prestashop8/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/PPCM/n8n-nodes-prestashop8)](https://github.com/PPCM/n8n-nodes-prestashop8/issues)
[![GitHub stars](https://img.shields.io/github/stars/PPCM/n8n-nodes-prestashop8)](https://github.com/PPCM/n8n-nodes-prestashop8/stargazers)

Un nœud n8n communautaire complet pour l'intégration PrestaShop 8 avec conversion automatique XML/JSON.

[🚀 Installation](#installation) | [✨ Fonctionnalités](#fonctionnalités) | [📚 Documentation](#documentation) | [🎯 Exemples](#exemples) | [🤝 Contribution](#contribution)

---

## 🎯 Vue d'Ensemble

**Le premier nœud n8n** qui simplifie réellement l'intégration PrestaShop 8 :

- ✅ **CRUD complet** sans écrire une ligne de XML
- ✅ **Interface graphique** intuitive avec menus dynamiques  
- ✅ **Conversion automatique** XML PrestaShop ↔ JSON simple
- ✅ **25+ ressources** : produits, clients, commandes, stocks...
- ✅ **Filtres avancés** avec 10 opérateurs de recherche
- ✅ **Mode Raw** pour debug et cas avancés

## 🚀 Installation

```bash
npm install n8n-nodes-prestashop8
```

## ⚡ Démarrage Rapide

### 1. Configuration PrestaShop
1. **Activer Webservice** : Paramètres > Service Web
2. **Créer clé API** avec permissions CRUD
3. **Noter l'URL** : `https://your-store.com/api`

### 2. Configuration n8n
```javascript
// Credentials PrestaShop 8 API
{
  "baseUrl": "https://your-store.com/api",
  "apiKey": "YOUR_API_KEY"
}
```

### 3. Premier Workflow
```javascript
// Lister les produits actifs
{
  "resource": "products",
  "operation": "search",
  "filters": {
    "filter": [
      { "field": "active", "operator": "=", "value": "1" }
    ]
  }
}
```

## ✨ Fonctionnalités

### 🔄 Opérations CRUD Complètes
| Opération | Description | Exemple |
|-----------|-------------|---------|
| **List** | Récupérer collections | Tous les produits |
| **Get by ID** | Récupération individuelle | Produit ID 123 |
| **Search** | Recherche avec filtres | Produits > 20€ |
| **Create** | Créer nouvelles entités | Nouveau client |
| **Update** | Modifier existantes | Mettre à jour stock |
| **Delete** | Supprimer entités | Supprimer commande |

### 📊 Ressources Supportées

<details>
<summary><strong>👥 CRM & Clients (6 ressources)</strong></summary>

- `customers` - Clients de la boutique
- `addresses` - Adresses de livraison/facturation  
- `groups` - Groupes de clients et tarifs
- `customer_threads` - Conversations service client
- `customer_messages` - Messages individuels
- `guests` - Visiteurs non-inscrits
</details>

<details>
<summary><strong>📦 Catalogue Produits (9 ressources)</strong></summary>

- `products` - Catalogue des produits
- `combinations` - Déclinaisons produits (taille, couleur...)
- `stock_availables` - Gestion des stocks
- `categories` - Arborescence des catégories
- `manufacturers` - Marques et fabricants
- `suppliers` - Fournisseurs
- `tags` - Étiquettes produits
- `product_features` - Caractéristiques produits
- `product_options` - Options de personnalisation
</details>

<details>
<summary><strong>🛒 Commandes & Ventes (8 ressources)</strong></summary>

- `orders` - Commandes de la boutique
- `order_details` - Lignes des commandes
- `order_histories` - Historique des changements d'état
- `order_states` - États de commandes possibles
- `order_carriers` - Transporteurs par commande
- `order_invoices` - Factures
- `carts` - Paniers d'achat
- `cart_rules` - Bons de réduction et promotions
</details>

### 🔍 Filtres Avancés

| Opérateur | Description | Exemple |
|-----------|-------------|---------|
| `=` | Égal | `price = 19.99` |
| `!=` | Différent | `active != 0` |
| `>` / `>=` | Supérieur | `stock > 10` |
| `<` / `<=` | Inférieur | `price <= 50` |
| `LIKE` | Contient | `name LIKE %iPhone%` |
| `NOT LIKE` | Ne contient pas | `ref NOT LIKE %OLD%` |
| `BEGINS` | Commence par | `name BEGINS Apple` |
| `ENDS` | Se termine par | `ref ENDS -2024` |

### 🎛️ Options Avancées

- **Pagination** : `limit=20` ou `limit=10,30`
- **Tri** : `[price_ASC]`, `[date_add_DESC]`
- **Champs** : `full`, `minimal`, ou personnalisé
- **Debug** : URL, headers, timeout

## 🎯 Exemples d'Usage

### E-commerce Automation
```javascript
// Sync quotidienne des stocks ERP → PrestaShop
Cron → ERP API → Transform → PrestaShop 8 Node → Slack Alert
```

### Marketing Automation  
```javascript
// Nouveaux clients → CRM + Email bienvenue
PrestaShop Webhook → PrestaShop 8 Node → CRM → Mailchimp
```

### Business Intelligence
```javascript
// Rapport ventes quotidien
Cron → PrestaShop 8 Node → Calculate KPIs → Email Report
```

## 📚 Documentation

- **[📖 Guide Complet](./README.md)** - Documentation complète
- **[🎯 Exemples Pratiques](./EXAMPLES.md)** - Cas d'usage détaillés  
- **[🛠️ Installation](./INSTALLATION.md)** - Setup pas à pas
- **[📝 Changelog](./CHANGELOG.md)** - Nouveautés et corrections

## 🐛 Issues & Support

### Problèmes Fréquents
- **401 Unauthorized** → Vérifier clé API et permissions
- **404 Not Found** → Contrôler URL base et Webservices activés
- **Timeout** → Augmenter timeout dans options debug

### Obtenir de l'Aide
- 🐞 **[GitHub Issues](https://github.com/PPCM/n8n-nodes-prestashop8/issues)** - Bugs et questions
- 🌐 **[n8n Community](https://community.n8n.io)** - Forum discussions
- 📖 **[Documentation](./INSTALLATION.md)** - Guides détaillés

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

### Quick Start Développement
```bash
git clone https://github.com/PPCM/n8n-nodes-prestashop8.git
cd n8n-nodes-prestashop8
npm install
npm run dev  # Mode watch
```

### Process de Contribution
1. **Fork** le projet
2. **Créer** une branche feature (`git checkout -b feature/amazing-feature`)  
3. **Commiter** les changements (`git commit -m 'Add amazing feature'`)
4. **Pousser** la branche (`git push origin feature/amazing-feature`)
5. **Ouvrir** une Pull Request

### Types de Contributions
- 🐞 **Corrections de bugs**
- ✨ **Nouvelles fonctionnalités**  
- 📚 **Améliorations documentation**
- 🧪 **Tests supplémentaires**
- 🎨 **Améliorations UI/UX**

### Guidelines
- Code TypeScript avec types stricts
- Tests unitaires pour nouvelles fonctionnalités
- Documentation à jour
- Respecter ESLint + Prettier

## 📊 Roadmap

### v1.1 (Q1 2024)
- [ ] Cache intelligent pour optimiser les appels API
- [ ] Templates de workflows préconfigurés
- [ ] Bulk operations pour traitement par lots
- [ ] Webhooks PrestaShop intégrés

### v1.2 (Q2 2024)  
- [ ] Support PrestaShop Cloud
- [ ] Multi-boutiques avancé
- [ ] Field mapping visuel
- [ ] Métriques de performance

### v2.0 (Q3 2024)
- [ ] GraphQL support (si disponible PrestaShop)
- [ ] AI-powered data transformation
- [ ] Real-time synchronization
- [ ] Advanced analytics dashboard

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

## 🙏 Remerciements

- **n8n Team** pour le fantastique outil d'automation
- **PrestaShop Community** pour la documentation API
- **Contributors** qui améliorent ce projet

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=PPCM/n8n-nodes-prestashop8&type=Date)](https://star-history.com/#PPCM/n8n-nodes-prestashop8&Date)

---

**Révolutionnez votre e-commerce avec n8n et PrestaShop 8** 🚀

[⬆ Retour en haut](#n8n-prestashop-8-node)
