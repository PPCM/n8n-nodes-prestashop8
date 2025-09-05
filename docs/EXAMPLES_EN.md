# Practical Examples - PrestaShop 8 Node

This file contains concrete usage examples of the PrestaShop 8 node in n8n.

## 📦 Product Management

### List all active products
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

### Search products by reference
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

### Create a new product
```json
{
  "resource": "products",
  "operation": "create",
  "data": {
    "name": {
      "language": {
        "id": "1",
        "value": "My New Product"
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

### Update product stock
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

Then update:
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

## 👥 Customer Management

### Search customer by email
```json
{
  "resource": "customers",
  "operation": "search",
  "filters": {
    "filter": [
      {
        "field": "email",
        "operator": "=",
        "value": "customer@example.com"
      }
    ]
  }
}
```

### Create a new customer
```json
{
  "resource": "customers",
  "operation": "create",
  "data": {
    "firstname": "John",
    "lastname": "Doe",
    "email": "john.doe@email.com",
    "passwd": "password123",
    "active": "1",
    "newsletter": "1"
  }
}
```

### List customer addresses
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

## 🛒 Order Management

### List new orders
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

### Get order details
```json
{
  "resource": "orders",
  "operation": "getById",
  "id": "12345"
}
```

### List order products
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

### Update order status
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

## 📊 Statistics and Reports

### Best-selling products (via order_details)
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

### Revenue by period
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

## 🔄 Data Synchronization

### Product synchronization workflow
1. **Get modified products**
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

2. **Processing with Function Node**
```javascript
// Transform PrestaShop data
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

3. **Update external system**

### Bidirectional stock synchronization
1. **Get PrestaShop stocks**
```json
{
  "resource": "stock_availables",
  "operation": "list",
  "advancedOptions": {
    "display": "id_product,quantity"
  }
}
```

2. **Compare with WMS system**

3. **Update differences**
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

## 🎨 Customization and Raw Mode

### Use Raw Mode for debugging
```json
{
  "resource": "products",
  "operation": "getById",
  "id": "123",
  "rawMode": true
}
```

### Send custom XML in Raw Mode
```json
{
  "resource": "products",
  "operation": "create",
  "rawMode": true,
  "manualXml": "<prestashop><product><name><language id=\"1\"><![CDATA[Custom Product]]></language></name><price><![CDATA[19.99]]></price></product></prestashop>"
}
```

## 🔧 Error Management

### Workflow with error handling
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

## 📱 Business Use Cases

### Multi-Channel E-commerce
1. **Synchronize catalog** between PrestaShop and marketplace
2. **Unify inventory management**
3. **Centralize orders**

### Marketing Automation
1. **Customer segmentation** by purchase history
2. **Email triggers** on order events
3. **CRM synchronization**

### Analytics and BI
1. **Export data** to data warehouse
2. **KPI calculations** for e-commerce
3. **Automated reports**

## 🚀 Optimizations

### Pagination for large volumes
```json
{
  "resource": "orders",
  "operation": "list",
  "advancedOptions": {
    "limit": "100,100"  // Get 100 elements starting from the 100th
  }
}
```

### Field selection for performance
```json
{
  "resource": "products",
  "operation": "list", 
  "advancedOptions": {
    "display": "id,reference,name,price"  // Only necessary fields
  }
}
```

### Caching with Memory Node
Use the Memory Node to avoid repeated API calls in the same session.

These examples cover the most common use cases. Feel free to adapt them to your specific needs!
