# Praktische Beispiele - PrestaShop 8 Node

Diese Datei enthält konkrete Anwendungsbeispiele für den PrestaShop 8 Node in n8n.

## 📦 Produktverwaltung

### Alle aktiven Produkte auflisten
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

### Produkte nach Referenz suchen
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

### Neues Produkt erstellen
```json
{
  "resource": "products",
  "operation": "create",
  "data": {
    "name": {
      "language": {
        "id": "1",
        "value": "Mein neues Produkt"
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

### Produktlager aktualisieren
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

Dann aktualisieren:
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

## 👥 Kundenverwaltung

### Kunde nach E-Mail suchen
```json
{
  "resource": "customers",
  "operation": "search",
  "filters": {
    "filter": [
      {
        "field": "email",
        "operator": "=",
        "value": "kunde@beispiel.com"
      }
    ]
  }
}
```

### Neuen Kunden erstellen
```json
{
  "resource": "customers",
  "operation": "create",
  "data": {
    "firstname": "Hans",
    "lastname": "Müller",
    "email": "hans.mueller@email.com",
    "passwd": "passwort123",
    "active": "1",
    "newsletter": "1"
  }
}
```

### Kundenadressen auflisten
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

## 🛒 Bestellverwaltung

### Neue Bestellungen auflisten
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

### Bestelldetails abrufen
```json
{
  "resource": "orders",
  "operation": "getById",
  "id": "12345"
}
```

### Produkte einer Bestellung auflisten
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

### Bestellstatus aktualisieren
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

## 📊 Statistiken und Berichte

### Meistverkaufte Produkte (über order_details)
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

### Umsatz nach Zeitraum
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

## 🔄 Datensynchronisation

### Workflow zur Produktsynchronisation
1. **Geänderte Produkte abrufen**
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

2. **Verarbeitung mit Function Node**
```javascript
// PrestaShop-Daten transformieren
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

3. **Update des externen Systems**

### Bidirektionale Lagersynchronisation
1. **PrestaShop-Lager abrufen**
```json
{
  "resource": "stock_availables",
  "operation": "list",
  "advancedOptions": {
    "display": "id_product,quantity"
  }
}
```

2. **Vergleich mit WMS-System**

3. **Unterschiede aktualisieren**
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

## 🎨 Anpassung und Raw-Modus

### Raw-Modus für Debugging verwenden
```json
{
  "resource": "products",
  "operation": "getById",
  "id": "123",
  "rawMode": true
}
```

### Benutzerdefiniertes XML im Raw-Modus senden
```json
{
  "resource": "products",
  "operation": "create",
  "rawMode": true,
  "manualXml": "<prestashop><product><name><language id=\"1\"><![CDATA[Custom Produkt]]></language></name><price><![CDATA[19.99]]></price></product></prestashop>"
}
```

## 🔧 Fehlerverwaltung

### Workflow mit Fehlerbehandlung
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

## 📱 Geschäftsanwendungsfälle

### Multi-Channel E-Commerce
1. **Katalog synchronisieren** zwischen PrestaShop und Marktplatz
2. **Lagerverwaltung vereinheitlichen**
3. **Bestellungen zentralisieren**

### Marketing-Automatisierung
1. **Kundensegmentierung** nach Kaufhistorie
2. **E-Mail-Trigger** bei Bestellereignissen
3. **CRM-Synchronisation**

### Analytics und BI
1. **Datenexport** zu Data Warehouse
2. **KPI-Berechnungen** für E-Commerce
3. **Automatisierte Berichte**

## 🚀 Optimierungen

### Paginierung für große Datenmengen
```json
{
  "resource": "orders",
  "operation": "list",
  "advancedOptions": {
    "limit": "100,100"  // 100 Elemente ab dem 100sten abrufen
  }
}
```

### Feldauswahl für bessere Performance
```json
{
  "resource": "products",
  "operation": "list", 
  "advancedOptions": {
    "display": "id,reference,name,price"  // Nur notwendige Felder
  }
}
```

### Zwischenspeicherung mit Memory Node
Verwenden Sie den Memory Node, um wiederholte API-Aufrufe in derselben Sitzung zu vermeiden.

Diese Beispiele decken die häufigsten Anwendungsfälle ab. Zögern Sie nicht, sie an Ihre spezifischen Bedürfnisse anzupassen!
