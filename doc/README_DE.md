# n8n PrestaShop 8 Node

[![npm version](https://badge.fury.io/js/n8n-nodes-prestashop8.svg)](https://www.npmjs.com/package/n8n-nodes-prestashop8)
[![Downloads](https://img.shields.io/npm/dt/n8n-nodes-prestashop8.svg)](https://www.npmjs.com/package/n8n-nodes-prestashop8)
[![GitHub license](https://img.shields.io/github/license/PPCM/n8n-nodes-prestashop8)](https://github.com/PPCM/n8n-nodes-prestashop8/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/PPCM/n8n-nodes-prestashop8)](https://github.com/PPCM/n8n-nodes-prestashop8/issues)
[![GitHub stars](https://img.shields.io/github/stars/PPCM/n8n-nodes-prestashop8)](https://github.com/PPCM/n8n-nodes-prestashop8/stargazers)

Ein umfassender n8n Community-Node für PrestaShop 8-Integration mit automatischer XML/JSON-Konvertierung und vollständiger CRUD-Unterstützung.

**🌍 Dokumentationssprachen:**
- 🇬🇧 [**English**](../README.md)
- 🇫🇷 [**Français**](./README_FR.md)
- 🇩🇪 **Deutsch** (diese Datei)
- 🇪🇸 [**Español**](./README_ES.md)

[🚀 Schnellstart](#schnellstart) | [✨ Funktionen](#funktionen) | [📚 Dokumentation](#dokumentation) | [🎯 Beispiele](#beispiele) | [🤝 Mitwirken](#mitwirken)

---

## 🎯 Überblick

**Der erste n8n-Node**, der die PrestaShop 8-Integration wirklich vereinfacht:

- ✅ **Vollständige CRUD-Operationen** ohne eine einzige Zeile XML zu schreiben
- ✅ **Intuitive grafische Benutzeroberfläche** mit dynamischen Dropdown-Menüs
- ✅ **Automatische XML/JSON-Konvertierung** - PrestaShop XML ↔ Einfaches JSON
- ✅ **25+ unterstützte Ressourcen**: Produkte, Kunden, Bestellungen, Lager...
- ✅ **Erweiterte Filterung** mit 10 Suchoperatoren
- ✅ **Raw-Modus** für Debugging und erweiterte Anwendungsfälle

## 🚀 Schnellstart

### Installation
```bash
npm install n8n-nodes-prestashop8
```

### PrestaShop-Konfiguration
1. **Webservice aktivieren**: Einstellungen > Webservice > Aktivieren
2. **API-Schlüssel erstellen** mit CRUD-Berechtigungen
3. **URL notieren**: `https://ihr-shop.com/api`

### n8n-Konfiguration
```javascript
// PrestaShop 8 API-Anmeldedaten
{
  "baseUrl": "https://ihr-shop.com/api",
  "apiKey": "IHR_API_SCHLÜSSEL"
}
```

### Erster Workflow
```javascript
// Aktive Produkte auflisten
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

## ✨ Funktionen

### 🔄 Vollständige CRUD-Operationen
| Operation | Beschreibung | Beispiel |
|-----------|--------------|----------|
| **List** | Sammlungen abrufen | Alle Produkte |
| **Get by ID** | Einzelabruf | Produkt ID 123 |
| **Search** | Suche mit Filtern | Produkte > 20€ |
| **Create** | Neue Entitäten erstellen | Neuer Kunde |
| **Update** | Bestehende ändern | Lager aktualisieren |
| **Delete** | Entitäten entfernen | Bestellung löschen |

### 📊 Unterstützte Ressourcen

<details>
<summary><strong>👥 CRM & Kunden (6 Ressourcen)</strong></summary>

- `customers` - Shop-Kunden
- `addresses` - Versand-/Rechnungsadressen
- `groups` - Kundengruppen und Preise
- `customer_threads` - Kundenservice-Gespräche
- `customer_messages` - Einzelnachrichten
- `guests` - Nicht registrierte Besucher
</details>

<details>
<summary><strong>📦 Produktkatalog (9 Ressourcen)</strong></summary>

- `products` - Produktkatalog
- `combinations` - Produktvarianten (Größe, Farbe...)
- `stock_availables` - Lagerverwaltung
- `categories` - Kategoriebaum
- `manufacturers` - Marken und Hersteller
- `suppliers` - Lieferanten
- `tags` - Produkt-Tags
- `product_features` - Produktmerkmale
- `product_options` - Anpassungsoptionen
</details>

<details>
<summary><strong>🛒 Bestellungen & Verkäufe (8 Ressourcen)</strong></summary>

- `orders` - Shop-Bestellungen
- `order_details` - Bestellpositionen
- `order_histories` - Statusänderungsverlauf
- `order_states` - Mögliche Bestellstatus
- `order_carriers` - Versanddienstleister pro Bestellung
- `order_invoices` - Rechnungen
- `carts` - Warenkörbe
- `cart_rules` - Rabattcodes und Aktionen
</details>

### 🔍 Erweiterte Filterung

| Operator | Beschreibung | Beispiel |
|----------|--------------|----------|
| `=` | Gleich | `price = 19.99` |
| `!=` | Ungleich | `active != 0` |
| `>` / `>=` | Größer als | `stock > 10` |
| `<` / `<=` | Kleiner als | `price <= 50` |
| `LIKE` | Enthält | `name LIKE %iPhone%` |
| `NOT LIKE` | Enthält nicht | `ref NOT LIKE %OLD%` |
| `BEGINS` | Beginnt mit | `name BEGINS Apple` |
| `ENDS` | Endet mit | `ref ENDS -2024` |

### 🎛️ Erweiterte Optionen

- **Paginierung**: `limit=20` oder `limit=10,30`
- **Sortierung**: `[price_ASC]`, `[date_add_DESC]`
- **Felder**: `full`, `minimal` oder benutzerdefiniert
- **Debug**: URL, Header, Timeout

## 🎯 Anwendungsbeispiele

### E-Commerce-Automatisierung
```javascript
// Tägliche ERP → PrestaShop Lagerabgleichung
Cron → ERP API → Transform → PrestaShop 8 Node → Slack Alert
```

### Marketing-Automatisierung
```javascript
// Neue Kunden → CRM + Willkommens-E-Mail
PrestaShop Webhook → PrestaShop 8 Node → CRM → Mailchimp
```

### Business Intelligence
```javascript
// Täglicher Verkaufsbericht
Cron → PrestaShop 8 Node → KPIs berechnen → E-Mail-Bericht
```

## 📚 Dokumentation

- **[🎯 Praktische Beispiele](./EXAMPLES_DE.md)** - Detaillierte Anwendungsfälle
- **[🛠️ Installationsleitfaden](./INSTALLATION_DE.md)** - Schritt-für-Schritt-Setup
- **[📝 Changelog](./CHANGELOG.md)** - Updates und Korrekturen

## 🐛 Probleme & Support

### Häufige Probleme
- **401 Unauthorized** → API-Schlüssel und Berechtigungen überprüfen
- **404 Not Found** → Basis-URL überprüfen und Webservices aktiviert
- **Timeout** → Timeout in Debug-Optionen erhöhen

### Hilfe erhalten
- 🐞 **[GitHub Issues](https://github.com/PPCM/n8n-nodes-prestashop8/issues)** - Bugs und Fragen
- 🌐 **[n8n Community](https://community.n8n.io)** - Forum-Diskussionen
- 📖 **[Dokumentation](./INSTALLATION_DE.md)** - Detaillierte Leitfäden

## 🤝 Mitwirken

Beiträge sind willkommen! So können Sie teilnehmen:

### Schnellstart Entwicklung
```bash
git clone https://github.com/PPCM/n8n-nodes-prestashop8.git
cd n8n-nodes-prestashop8
npm install
npm run dev  # Watch-Modus
```

### Beitragsprozess
1. **Projekt forken**
2. **Feature-Branch erstellen** (`git checkout -b feature/amazing-feature`)
3. **Änderungen committen** (`git commit -m 'Add amazing feature'`)
4. **Branch pushen** (`git push origin feature/amazing-feature`)
5. **Pull Request öffnen**

### Arten von Beiträgen
- 🐞 **Fehlerkorrekturen**
- ✨ **Neue Funktionen**
- 📚 **Dokumentationsverbesserungen**
- 🧪 **Zusätzliche Tests**
- 🎨 **UI/UX-Verbesserungen**

### Richtlinien
- TypeScript-Code mit strikter Typisierung
- Unit-Tests für neue Funktionen
- Aktualisierte Dokumentation
- ESLint + Prettier respektieren

## 📊 Roadmap

### v1.1 (Q1 2024)
- [ ] Intelligente Zwischenspeicherung zur API-Optimierung
- [ ] Vorkonfigurierte Workflow-Vorlagen
- [ ] Bulk-Operationen für Stapelverarbeitung
- [ ] Integrierte PrestaShop-Webhooks

### v1.2 (Q2 2024)
- [ ] PrestaShop Cloud-Unterstützung
- [ ] Erweitertes Multi-Store
- [ ] Visuelle Feldzuordnung
- [ ] Leistungsmetriken

### v2.0 (Q3 2024)
- [ ] GraphQL-Unterstützung (falls in PrestaShop verfügbar)
- [ ] KI-gesteuerte Datentransformation
- [ ] Echtzeit-Synchronisation
- [ ] Erweiterte Analytics-Dashboard

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Siehe die [LICENSE](../LICENSE)-Datei für Details.

## 🙏 Danksagungen

- **n8n-Team** für das fantastische Automatisierungstool
- **PrestaShop-Community** für die API-Dokumentation
- **Mitwirkende** die dieses Projekt verbessern

---

**Revolutionieren Sie Ihren E-Commerce mit n8n und PrestaShop 8** 🚀

[⬆ Zurück nach oben](#n8n-prestashop-8-node)
