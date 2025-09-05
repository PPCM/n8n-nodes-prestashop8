# Exemples Pratiques - Nœud PrestaShop 8

Ce fichier contient des exemples concrets d'utilisation du nœud PrestaShop 8 dans n8n.

## 📦 Gestion des Produits

### Lister tous les produits actifs
```json
{
  "resource": "products",
  "operation": "search",
  "filters": {
    "filter": [
      {
        "field": "active",
        "operator": "=",
        "value": "1"
      }
    ]
  },
  "advancedOptions": {
    "limit": "50",
    "sort": "[date_upd_DESC]",
    "display": "full"
  }
}
```

### Rechercher produits par référence
```json
{
  "resource": "products",
  "operation": "search",
  "filters": {
    "filter": [
      {
        "field": "reference",
        "operator": "LIKE",
        "value": "REF-2024%"
      }
    ]
  }
}
```

### Créer un nouveau produit
```json
{
  "resource": "products",
  "operation": "create",
  "data": {
    "name": {
      "language": {
        "id": "1",
        "value": "Mon Nouveau Produit"
      }
    },
    "reference": "PROD-001",
    "price": "29.99",
    "active": "1",
    "categoryDefault": "2",
    "categories": [2, 3]
  }
}
```

### Mettre à jour le stock d'un produit
```json
{
  "resource": "stock_availables",
  "operation": "search",
  "filters": {
    "filter": [
      {
        "field": "id_product",
        "operator": "=",
        "value": "123"
      }
    ]
  }
}
```

Puis mettre à jour :
```json
{
  "resource": "stock_availables",
  "operation": "update",
  "id": "{{$json.id}}",
  "data": {
    "quantity": "50"
  }
}
```

## 👥 Gestion des Clients

### Rechercher client par email
```json
{
  "resource": "customers",
  "operation": "search",
  "filters": {
    "filter": [
      {
        "field": "email",
        "operator": "=",
        "value": "client@example.com"
      }
    ]
  }
}
```

### Créer un nouveau client
```json
{
  "resource": "customers",
  "operation": "create",
  "data": {
    "firstname": "Jean",
    "lastname": "Dupont",
    "email": "jean.dupont@email.com",
    "passwd": "motdepasse123",
    "active": "1",
    "newsletter": "1"
  }
}
```

### Lister les adresses d'un client
```json
{
  "resource": "addresses",
  "operation": "search",
  "filters": {
    "filter": [
      {
        "field": "id_customer",
        "operator": "=",
        "value": "123"
      }
    ]
  }
}
```

## 🛒 Gestion des Commandes

### Lister les nouvelles commandes
```json
{
  "resource": "orders",
  "operation": "search",
  "filters": {
    "filter": [
      {
        "field": "current_state",
        "operator": "=",
        "value": "1"
      },
      {
        "field": "date_add",
        "operator": ">",
        "value": "2024-01-01"
      }
    ]
  },
  "advancedOptions": {
    "sort": "[date_add_DESC]",
    "limit": "20"
  }
}
```

### Récupérer détails d'une commande
```json
{
  "resource": "orders",
  "operation": "getById",
  "id": "12345"
}
```

### Lister les produits d'une commande
```json
{
  "resource": "order_details",
  "operation": "search",
  "filters": {
    "filter": [
      {
        "field": "id_order",
        "operator": "=",
        "value": "12345"
      }
    ]
  }
}
```

### Mettre à jour le statut d'une commande
```json
{
  "resource": "order_histories",
  "operation": "create",
  "data": {
    "id_order": "12345",
    "id_order_state": "3",
    "date_add": "{{$now}}"
  }
}
```

## 📊 Statistiques et Rapports

### Produits les plus vendus (via order_details)
```json
{
  "resource": "order_details",
  "operation": "search",
  "filters": {
    "filter": [
      {
        "field": "date_add",
        "operator": ">=",
        "value": "2024-01-01"
      }
    ]
  },
  "advancedOptions": {
    "display": "id_product,product_quantity,product_name"
  }
}
```

### Chiffre d'affaires par période
```json
{
  "resource": "orders",
  "operation": "search",
  "filters": {
    "filter": [
      {
        "field": "date_add",
        "operator": ">=",
        "value": "2024-01-01"
      },
      {
        "field": "current_state",
        "operator": "=",
        "value": "5"
      }
    ]
  },
  "advancedOptions": {
    "display": "total_paid,date_add"
  }
}
```

## 🔄 Synchronisation de Données

### Workflow de synchronisation produits
1. **Récupérer produits modifiés**
```json
{
  "resource": "products",
  "operation": "search",
  "filters": {
    "filter": [
      {
        "field": "date_upd",
        "operator": ">",
        "value": "{{$json.lastSyncDate}}"
      }
    ]
  }
}
```

2. **Traitement avec Function Node**
```javascript
// Transformer les données PrestaShop
for (const item of $input.all()) {
  item.json = {
    id: item.json.id,
    name: item.json.name,
    price: parseFloat(item.json.price),
    reference: item.json.reference,
    lastUpdate: item.json.dateUpd
  };
}

return $input.all();
```

3. **Mise à jour système externe**

### Synchronisation bidirectionnelle stocks
1. **Récupérer stocks PrestaShop**
```json
{
  "resource": "stock_availables",
  "operation": "list",
  "advancedOptions": {
    "display": "id_product,quantity"
  }
}
```

2. **Comparer avec système WMS**

3. **Mettre à jour différences**
```json
{
  "resource": "stock_availables",
  "operation": "update",
  "id": "{{$json.stockId}}",
  "data": {
    "quantity": "{{$json.newQuantity}}"
  }
}
```

## 🎨 Personnalisation et Mode Raw

### Utiliser le Mode Raw pour debug
```json
{
  "resource": "products",
  "operation": "getById",
  "id": "123",
  "rawMode": true
}
```

### Envoyer XML personnalisé en Mode Raw
```json
{
  "resource": "products",
  "operation": "create",
  "rawMode": true,
  "manualXml": "<prestashop><product><name><language id=\"1\"><![CDATA[Produit Custom]]></language></name><price><![CDATA[19.99]]></price></product></prestashop>"
}
```

## 🔧 Gestion des Erreurs

### Workflow avec gestion d'erreur
```json
{
  "nodes": [
    {
      "name": "PrestaShop Request",
      "type": "PrestaShop8",
      "continueOnFail": true,
      "parameters": {
        "resource": "products",
        "operation": "getById",
        "id": "{{$json.productId}}"
      }
    },
    {
      "name": "Error Handler",
      "type": "If",
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "{{$json.error}}",
              "operation": "isNotEmpty"
            }
          ]
        }
      }
    }
  ]
}
```

## 📱 Cas d'Usage Métier

### E-commerce Multi-Canal
1. **Synchroniser catalogue** entre PrestaShop et marketplace
2. **Unifier gestion stocks** 
3. **Centraliser commandes**

### Automatisation Marketing
1. **Segmentation clients** par historique achat
2. **Déclenchement emails** sur événements commande
3. **Synchronisation CRM**

### Analytics et BI
1. **Export données** vers data warehouse
2. **Calculs KPIs** e-commerce
3. **Rapports automatisés**

## 🚀 Optimisations

### Pagination pour gros volumes
```json
{
  "resource": "orders",
  "operation": "list",
  "advancedOptions": {
    "limit": "100,100"  // Récupérer 100 éléments à partir du 100ème
  }
}
```

### Sélection de champs pour performance
```json
{
  "resource": "products",
  "operation": "list", 
  "advancedOptions": {
    "display": "id,reference,name,price"  // Seulement les champs nécessaires
  }
}
```

### Mise en cache avec Memory Node
Utiliser le nœud Memory pour éviter les appels API répétés sur la même session.

Ces exemples couvrent les cas d'usage les plus courants. N'hésitez pas à les adapter selon vos besoins spécifiques !
