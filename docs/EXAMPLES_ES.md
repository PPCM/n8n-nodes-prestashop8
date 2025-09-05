# Ejemplos Prácticos - Nodo PrestaShop 8

Este archivo contiene ejemplos concretos de uso del nodo PrestaShop 8 en n8n.

## 📦 Gestión de Productos

### Listar todos los productos activos
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

### Buscar productos por referencia
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

### Crear un nuevo producto
```json
{
  "resource": "products",
  "operation": "create",
  "data": {
    "name": {
      "language": {
        "id": "1",
        "value": "Mi Nuevo Producto"
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

### Actualizar inventario de un producto
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

Luego actualizar:
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

## 👥 Gestión de Clientes

### Buscar cliente por email
```json
{
  "resource": "customers",
  "operation": "search",
  "filters": {
    "filter": [
      {
        "field": "email",
        "operator": "=",
        "value": "cliente@ejemplo.com"
      }
    ]
  }
}
```

### Crear un nuevo cliente
```json
{
  "resource": "customers",
  "operation": "create",
  "data": {
    "firstname": "Juan",
    "lastname": "Pérez",
    "email": "juan.perez@email.com",
    "passwd": "contraseña123",
    "active": "1",
    "newsletter": "1"
  }
}
```

### Listar direcciones de un cliente
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

## 🛒 Gestión de Pedidos

### Listar nuevos pedidos
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

### Obtener detalles de un pedido
```json
{
  "resource": "orders",
  "operation": "getById",
  "id": "12345"
}
```

### Listar productos de un pedido
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

### Actualizar estado de un pedido
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

## 📊 Estadísticas y Reportes

### Productos más vendidos (vía order_details)
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

### Facturación por período
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

## 🔄 Sincronización de Datos

### Workflow de sincronización de productos
1. **Obtener productos modificados**
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

2. **Procesamiento con Function Node**
```javascript
// Transformar datos de PrestaShop
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

3. **Actualización del sistema externo**

### Sincronización bidireccional de inventarios
1. **Obtener inventarios PrestaShop**
```json
{
  "resource": "stock_availables",
  "operation": "list",
  "advancedOptions": {
    "display": "id_product,quantity"
  }
}
```

2. **Comparar con sistema WMS**

3. **Actualizar diferencias**
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

## 🎨 Personalización y Modo Raw

### Usar Modo Raw para debug
```json
{
  "resource": "products",
  "operation": "getById",
  "id": "123",
  "rawMode": true
}
```

### Enviar XML personalizado en Modo Raw
```json
{
  "resource": "products",
  "operation": "create",
  "rawMode": true,
  "manualXml": "<prestashop><product><name><language id=\"1\"><![CDATA[Producto Personalizado]]></language></name><price><![CDATA[19.99]]></price></product></prestashop>"
}
```

## 🔧 Gestión de Errores

### Workflow con manejo de errores
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

## 📱 Casos de Uso Empresariales

### E-commerce Multi-Canal
1. **Sincronizar catálogo** entre PrestaShop y marketplace
2. **Unificar gestión de inventarios**
3. **Centralizar pedidos**

### Automatización de Marketing
1. **Segmentación de clientes** por historial de compras
2. **Trigger de emails** en eventos de pedidos
3. **Sincronización CRM**

### Analytics y BI
1. **Exportar datos** a data warehouse
2. **Cálculos de KPIs** e-commerce
3. **Reportes automatizados**

## 🚀 Optimizaciones

### Paginación para grandes volúmenes
```json
{
  "resource": "orders",
  "operation": "list",
  "advancedOptions": {
    "limit": "100,100"  // Obtener 100 elementos a partir del 100º
  }
}
```

### Selección de campos para performance
```json
{
  "resource": "products",
  "operation": "list", 
  "advancedOptions": {
    "display": "id,reference,name,price"  // Solo campos necesarios
  }
}
```

### Cache con Memory Node
Utilizar el nodo Memory para evitar llamadas API repetidas en la misma sesión.

¡Estos ejemplos cubren los casos de uso más comunes. No dudes en adaptarlos según tus necesidades específicas!
