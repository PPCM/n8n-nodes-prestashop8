# Nœud n8n PrestaShop 8

Un nœud n8n personnalisé pour interagir avec PrestaShop 8 via son API Webservice REST/XML, avec conversion automatique JSON/XML et support CRUD complet.

## 🚀 Fonctionnalités

### Support CRUD Complet
- ✅ **Create** - Créer de nouvelles entités
- ✅ **Read** - Lire des données individuelles ou collections
- ✅ **Update** - Mettre à jour des entités existantes  
- ✅ **Delete** - Supprimer des entités
- ✅ **Search** - Recherche avancée avec filtres

### Conversion Automatique XML/JSON
- **Mode Simplifié** (par défaut) : Conversion automatique XML ↔ JSON avec simplification des structures PrestaShop
- **Mode Raw** : Accès direct aux données brutes XML/JSON pour le debug et la compatibilité

### Ressources Supportées

#### 👥 Clients & CRM
- `customers` - Clients de la boutique
- `addresses` - Adresses clients et de livraison
- `groups` - Groupes de clients et tarifs
- `customer_threads` - Conversations clients
- `customer_messages` - Messages individuels

#### 📦 Catalogue Produits
- `products` - Catalogue des produits
- `combinations` - Déclinaisons produits
- `stock_availables` - Gestion des stocks
- `categories` - Arborescence des catégories
- `manufacturers` - Marques et fabricants
- `suppliers` - Fournisseurs
- `tags` - Étiquettes produits
- `product_features` - Caractéristiques produits
- `product_options` - Options de personnalisation

#### 🛒 Commandes & Ventes
- `orders` - Commandes de la boutique
- `order_details` - Lignes des commandes
- `order_histories` - Changements d'état
- `order_states` - États possibles
- `carts` - Paniers d'achat
- `cart_rules` - Bons de réduction

#### 🚚 Transport & Logistique
- `carriers` - Transporteurs
- `zones` - Zones géographiques
- `countries` - Pays
- `states` - États/Régions

#### 🏦 Paiements & Finances
- `currencies` - Devises
- `taxes` - Taux de taxation

#### 🎨 CMS & Médias
- `content_management_system` - Pages CMS
- `images` - Images produits et catégories

#### ⚙️ Configuration
- `configurations` - Paramètres boutique
- `languages` - Langues supportées
- `shops` - Boutiques multiples

### Filtres de Recherche Avancés
- Filtres par champ avec opérateurs : `=`, `!=`, `>`, `>=`, `<`, `<=`, `LIKE`, etc.
- Tri personnalisé : `[id_DESC]`, `[name_ASC]`, etc.
- Pagination : `limit=20` ou `limit=10,30`
- Sélection de champs : `full`, `minimal`, ou liste personnalisée

## 🛠️ Installation

### Prérequis
- n8n installé et fonctionnel
- PrestaShop 8.x avec API Webservice activée
- Clé API PrestaShop générée

### Installation du Nœud

1. **Cloner le repository**
   ```bash
   git clone https://github.com/PPCM/n8n-prestashop8-node.git
   cd n8n-prestashop8-node
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Compiler le projet**
   ```bash
   npm run build
   ```

4. **Installer le nœud dans n8n**
   ```bash
   # Via npm (recommandé)
   npm install n8n-prestashop8-node
   
   # Ou en local pour développement
   npm link
   cd /path/to/n8n
   npm link n8n-prestashop8-node
   ```

## ⚙️ Configuration PrestaShop

### 1. Activer l'API Webservice
1. Connectez-vous au back-office PrestaShop
2. Allez dans **Paramètres avancés > Service Web**
3. Activez les services web
4. Configurez les permissions selon vos besoins

### 2. Créer une Clé API
1. Dans **Service Web**, cliquez sur **Ajouter une nouvelle clé**
2. Générez une clé API sécurisée
3. Définissez les permissions pour les ressources nécessaires
4. Notez l'URL de base de votre API : `https://votre-boutique.com/api`

## 🎯 Utilisation

### Configuration des Credentials
1. Dans n8n, ajoutez de nouveaux credentials "PrestaShop 8 API"
2. Saisissez :
   - **Base URL** : `https://votre-boutique.com/api`
   - **API Key** : votre clé API générée

### Opérations Disponibles

#### Lister Tous les Éléments
```json
{
  "resource": "products",
  "operation": "list",
  "advancedOptions": {
    "limit": "20",
    "sort": "[id_DESC]",
    "display": "full"
  }
}
```

#### Récupérer par ID
```json
{
  "resource": "products",
  "operation": "getById",
  "id": "123"
}
```

#### Recherche avec Filtres
```json
{
  "resource": "products",
  "operation": "search",
  "filters": {
    "filter": [
      {
        "field": "reference",
        "operator": "LIKE",
        "value": "ABC%"
      },
      {
        "field": "price",
        "operator": ">=",
        "value": "10"
      }
    ]
  }
}
```

#### Créer un Élément
```json
{
  "resource": "customers",
  "operation": "create",
  "data": {
    "firstname": "John",
    "lastname": "Doe",
    "email": "john.doe@example.com",
    "passwd": "securepassword"
  }
}
```

#### Mettre à Jour
```json
{
  "resource": "products",
  "operation": "update",
  "id": "123",
  "data": {
    "name": "Nouveau nom de produit",
    "price": "29.99"
  }
}
```

#### Supprimer
```json
{
  "resource": "products",
  "operation": "delete",
  "id": "123"
}
```

## 🔄 Conversion XML/JSON

### Mode Simplifié (Défaut)
Le nœud convertit automatiquement les données PrestaShop :

**XML PrestaShop** ↔ **JSON Simplifié**

Exemple de conversion :
```xml
<!-- XML PrestaShop -->
<prestashop>
  <product>
    <id><![CDATA[1]]></id>
    <id_manufacturer><![CDATA[2]]></id_manufacturer>
    <price><![CDATA[99.99]]></price>
    <associations>
      <categories>
        <category><id><![CDATA[3]]></id></category>
        <category><id><![CDATA[5]]></id></category>
      </categories>
    </associations>
  </product>
</prestashop>
```

```json
// JSON Simplifié par n8n
{
  "id": 1,
  "manufacturerId": 2,
  "price": 99.99,
  "categories": [3, 5]
}
```

### Mode Raw
Activez "Mode Raw" pour :
- Accéder aux données brutes PrestaShop
- Debug des réponses API
- Envoyer du XML manuel personnalisé

## 🐛 Debug et Dépannage

### Options de Debug
- **Afficher URL de requête** : voir l'URL générée
- **Afficher headers** : voir les headers HTTP
- **Timeout personnalisé** : ajuster le timeout des requêtes

### Erreurs Courantes

**401 Unauthorized**
- Vérifiez votre clé API
- Contrôlez les permissions dans PrestaShop

**404 Not Found**
- Vérifiez l'URL de base
- Assurez-vous que l'API Webservice est activée

**400 Bad Request**
- Validez vos données JSON
- Vérifiez les champs obligatoires pour la ressource

## 📝 Exemples d'Usage

### Synchroniser un Catalogue
1. **Lister les produits** avec filtres de date
2. **Comparer** avec votre base locale
3. **Créer/Mettre à jour** les différences

### Gestion des Commandes
1. **Rechercher** nouvelles commandes
2. **Récupérer détails** client et produits
3. **Mettre à jour** statut après traitement

### Import/Export de Données
1. **Exporter** données PrestaShop via "list"
2. **Transformer** avec d'autres nœuds n8n  
3. **Importer** dans autres systèmes

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Fork le projet sur [GitHub](https://github.com/PPCM/n8n-prestashop8-node)
2. Créez une branche feature (`git checkout -b feature/amazing-feature`)
3. Commitez vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request sur [GitHub](https://github.com/PPCM/n8n-prestashop8-node/pulls)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🔗 Liens Utiles

- [Documentation n8n](https://docs.n8n.io/)
- [API PrestaShop 8](https://devdocs.prestashop-project.org/8/webservice/)
- [Documentation Webservice PrestaShop](https://devdocs.prestashop-project.org/1.7/development/webservice/)
