# 🛒 PrestaShop 8 Node for n8n

[![npm version](https://badge.fury.io/js/n8n-nodes-prestashop8.svg)](https://badge.fury.io/js/n8n-nodes-prestashop8)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Professional n8n community node for **PrestaShop 8** with advanced features and **Postgres-style variants**.

## ✨ **Features**

🎯 **7 Specialized Nodes** (like Postgres)
- **PrestaShop 8** (main node with mode selector)
- **PrestaShop 8 - Products** (product catalog)
- **PrestaShop 8 - Orders** (customer orders)
- **PrestaShop 8 - Customers** (user accounts)
- **PrestaShop 8 - Categories** (product organization)
- **PrestaShop 8 - Stock** (inventory management)
- **PrestaShop 8 - Execute** (advanced operations)

🔧 **Technical Excellence**
- **Raw Mode XML** - Native PrestaShop XML responses
- **JSON Mode** - Simplified, clean JSON data
- **30+ Resources** - Complete PrestaShop API coverage
- **Full CRUD** - Create, Read, Update, Delete operations
- **Advanced Filtering** - Search with complex criteria
- **Professional UI** - 100% English interface

## 🚀 **Quick Installation**

```bash
npm install n8n-nodes-prestashop8
```

Then restart your n8n instance.

## 🎪 **Node Variants**

Search "PrestaShop" in n8n to see all variants:

| Node | Purpose | Pre-configured |
|------|---------|----------------|
| PrestaShop 8 | General operations | Mode selector |
| PrestaShop 8 - Products | Product management | products + list |
| PrestaShop 8 - Orders | Order processing | orders + list |
| PrestaShop 8 - Customers | Customer management | customers + list |
| PrestaShop 8 - Categories | Category organization | categories + list |
| PrestaShop 8 - Stock | Inventory control | stock + list |
| PrestaShop 8 - Execute | Advanced operations | Full flexibility |

## ⚙️ **Configuration**

### 1. **PrestaShop Setup**
1. Go to **Advanced Parameters** → **Webservice**
2. Enable **"Enable PrestaShop's webservice"**
3. Add new API key with required permissions

### 2. **n8n Credentials**
- **Base URL**: `https://yourshop.com/api`
- **API Key**: Your generated webservice key

## 📊 **Raw Mode vs JSON Mode**

### JSON Mode (Default)
```json
{
  "id": 1,
  "name": "T-shirt",
  "price": 19.99,
  "active": true
}
```

### Raw Mode (XML)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <products>
    <product>
      <id><![CDATA[1]]></id>
      <name>
        <language id="1"><![CDATA[T-shirt]]></language>
      </name>
    </product>
  </products>
</prestashop>
```

## 🎯 **Supported Resources**

| Category | Resources |
|----------|-----------|
| **Catalog** | products, categories, manufacturers, suppliers |
| **Orders** | orders, order_details, carts, cart_rules |
| **Customers** | customers, addresses, groups |
| **Stock** | stock_availables, combinations |
| **CMS** | cms, images |
| **Config** | configurations, languages, currencies |

## 💡 **Usage Examples**

### List Products
```typescript
// Use PrestaShop 8 - Products node
// Already pre-configured for products
```

### Search Orders
```typescript
// Use PrestaShop 8 - Orders node
// Operation: Search
// Filters: status = "Processing"
```

### Custom Operations
```typescript
// Use PrestaShop 8 - Execute node
// Mode: Custom
// Full access to all parameters
```

## 🔧 **Advanced Features**

- **Batch Operations** - Process multiple items
- **Error Handling** - Robust error management
- **Performance** - Optimized for large datasets
- **Filtering** - Advanced search capabilities
- **Validation** - Input validation and sanitization

## 📋 **Requirements**

- **n8n**: v0.220.0+
- **PrestaShop**: 8.0+
- **Node.js**: 16+

## 🆘 **Support**

- [GitHub Issues](https://github.com/user/n8n-nodes-prestashop8/issues)
- [n8n Community](https://community.n8n.io/)
- [PrestaShop Documentation](https://devdocs.prestashop.com/)

## 📝 **License**

MIT License - see [LICENSE](LICENSE) file.

---

**Built with ❤️ for the n8n community**
