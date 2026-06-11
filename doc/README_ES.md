# n8n PrestaShop 8 Node

[![npm version](https://badge.fury.io/js/n8n-nodes-prestashop8.svg)](https://www.npmjs.com/package/n8n-nodes-prestashop8)
[![Downloads](https://img.shields.io/npm/dt/n8n-nodes-prestashop8.svg)](https://www.npmjs.com/package/n8n-nodes-prestashop8)
[![GitHub license](https://img.shields.io/github/license/PPCM/n8n-nodes-prestashop8)](https://github.com/PPCM/n8n-nodes-prestashop8/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/PPCM/n8n-nodes-prestashop8)](https://github.com/PPCM/n8n-nodes-prestashop8/issues)
[![GitHub stars](https://img.shields.io/github/stars/PPCM/n8n-nodes-prestashop8)](https://github.com/PPCM/n8n-nodes-prestashop8/stargazers)

Un nodo comunitario completo de n8n para integración con PrestaShop 8 con conversión automática XML/JSON y soporte CRUD completo.

**🌍 Idiomas de la documentación:**
- 🇬🇧 [**English**](../README.md)
- 🇫🇷 [**Français**](./README_FR.md)
- 🇩🇪 [**Deutsch**](./README_DE.md)
- 🇪🇸 **Español** (este archivo)

[🚀 Inicio Rápido](#inicio-rápido) | [✨ Características](#características) | [📚 Documentación](#documentación) | [🎯 Ejemplos](#ejemplos) | [🤝 Contribuir](#contribuir)

---

## 🎯 Descripción General

**El primer nodo n8n** que realmente simplifica la integración con PrestaShop 8:

- ✅ **Operaciones CRUD completas** sin escribir una sola línea de XML
- ✅ **Interfaz gráfica intuitiva** con menús desplegables dinámicos
- ✅ **Conversión automática XML/JSON** - XML de PrestaShop ↔ JSON simple
- ✅ **25+ recursos soportados**: productos, clientes, pedidos, inventario...
- ✅ **Filtrado avanzado** con 10 operadores de búsqueda
- ✅ **Modo raw** para depuración y casos de uso avanzados
- ✅ **Reintento ante errores** para recuperarse automáticamente de errores transitorios (timeouts, cortes de conexión)

## 🚀 Inicio Rápido

### Instalación
```bash
npm install n8n-nodes-prestashop8
```

### Configuración de PrestaShop
1. **Habilitar Webservice**: Configuración > Servicio Web > Habilitar
2. **Crear clave API** con permisos CRUD
3. **Anotar la URL**: `https://su-tienda.com/api`

### Configuración de n8n
```javascript
// Credenciales de la API de PrestaShop 8
{
  "baseUrl": "https://su-tienda.com/api",
  "apiKey": "SU_CLAVE_API"
}
```

### Primer Workflow
```javascript
// Listar productos activos
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

## ✨ Características

### 🔄 Operaciones CRUD Completas
| Operación | Descripción | Ejemplo |
|-----------|-------------|---------|
| **List** | Recuperar colecciones | Todos los productos |
| **Get by ID** | Recuperación individual | Producto ID 123 |
| **Search** | Búsqueda con filtros | Productos > 20€ |
| **Create** | Crear nuevas entidades | Nuevo cliente |
| **Update** | Modificar existentes | Actualizar inventario |
| **Delete** | Eliminar entidades | Borrar pedido |

### 📊 Recursos Soportados

<details>
<summary><strong>👥 CRM y Clientes (6 recursos)</strong></summary>

- `customers` - Clientes de la tienda
- `addresses` - Direcciones de envío/facturación
- `groups` - Grupos de clientes y precios
- `customer_threads` - Conversaciones de atención al cliente
- `customer_messages` - Mensajes individuales
- `guests` - Visitantes no registrados
</details>

<details>
<summary><strong>📦 Catálogo de Productos (9 recursos)</strong></summary>

- `products` - Catálogo de productos
- `combinations` - Variaciones de producto (talla, color...)
- `stock_availables` - Gestión de inventario
- `categories` - Árbol de categorías
- `manufacturers` - Marcas y fabricantes
- `suppliers` - Proveedores
- `tags` - Etiquetas de productos
- `product_features` - Características del producto
- `product_options` - Opciones de personalización
</details>

<details>
<summary><strong>🛒 Pedidos y Ventas (8 recursos)</strong></summary>

- `orders` - Pedidos de la tienda
- `order_details` - Artículos del pedido
- `order_histories` - Historial de cambios de estado
- `order_states` - Estados posibles del pedido
- `order_carriers` - Transportistas por pedido
- `order_invoices` - Facturas
- `carts` - Carritos de compras
- `cart_rules` - Códigos de descuento y promociones
</details>

### 🔍 Filtrado Avanzado

| Operador | Descripción | Ejemplo |
|----------|-------------|---------|
| `=` | Igual | `price = 19.99` |
| `!=` | Diferente | `active != 0` |
| `>` / `>=` | Mayor que | `stock > 10` |
| `<` / `<=` | Menor que | `price <= 50` |
| `LIKE` | Contiene | `name LIKE %iPhone%` |
| `NOT LIKE` | No contiene | `ref NOT LIKE %OLD%` |
| `BEGINS` | Comienza con | `name BEGINS Apple` |
| `ENDS` | Termina con | `ref ENDS -2024` |

### 🎛️ Opciones Avanzadas

- **Paginación**: `limit=20` o `limit=10,30`
- **Ordenación**: `[price_ASC]`, `[date_add_DESC]`
- **Campos**: `full`, `minimal` o personalizado
- **Debug**: URL, headers, timeout
- **Reintento ante errores**: reintenta automáticamente una llamada que falla por un error transitorio — timeout de red, corte de conexión, error de servidor 5xx o rate-limit 429 (nunca en 4xx). Número máximo de intentos y retardo fijo entre intentos configurables; el presupuesto de reintentos se reinicia para cada llamada fallida. Cada intento se registra en los logs del servidor n8n.

## 🎯 Ejemplos de Uso

### Automatización de E-commerce
```javascript
// Sincronización diaria de inventario ERP → PrestaShop
Cron → ERP API → Transform → PrestaShop 8 Node → Slack Alert
```

### Automatización de Marketing
```javascript
// Nuevos clientes → CRM + email de bienvenida
PrestaShop Webhook → PrestaShop 8 Node → CRM → Mailchimp
```

### Business Intelligence
```javascript
// Reporte diario de ventas
Cron → PrestaShop 8 Node → Calcular KPIs → Email Report
```

## 📚 Documentación

- **[🎯 Ejemplos Prácticos](./EXAMPLES_ES.md)** - Casos de uso detallados
- **[🛠️ Guía de Instalación](./INSTALLATION_ES.md)** - Configuración paso a paso
- **[📝 Changelog](./CHANGELOG.md)** - Actualizaciones y correcciones

## 🐛 Problemas y Soporte

### Problemas Comunes
- **401 Unauthorized** → Verificar clave API y permisos
- **404 Not Found** → Comprobar URL base y Webservices habilitados
- **Timeout** → Aumentar timeout en opciones de debug, o activar **Reintento ante errores** para recuperarse automáticamente de timeouts transitorios

### Obtener Ayuda
- 🐞 **[GitHub Issues](https://github.com/PPCM/n8n-nodes-prestashop8/issues)** - Bugs y preguntas
- 🌐 **[Comunidad n8n](https://community.n8n.io)** - Discusiones del foro
- 📖 **[Documentación](./INSTALLATION_ES.md)** - Guías detalladas

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Aquí te explicamos cómo participar:

### Inicio Rápido para Desarrollo
```bash
git clone https://github.com/PPCM/n8n-nodes-prestashop8.git
cd n8n-nodes-prestashop8
npm install
npm run dev  # Modo watch
```

### Proceso de Contribución
1. **Hacer fork** del proyecto
2. **Crear** una rama de característica (`git checkout -b feature/amazing-feature`)
3. **Hacer commit** de los cambios (`git commit -m 'Add amazing feature'`)
4. **Hacer push** de la rama (`git push origin feature/amazing-feature`)
5. **Abrir** un Pull Request

### Tipos de Contribuciones
- 🐞 **Corrección de bugs**
- ✨ **Nuevas características**
- 📚 **Mejoras en la documentación**
- 🧪 **Pruebas adicionales**
- 🎨 **Mejoras UI/UX**

### Directrices
- Código TypeScript con tipado estricto
- Pruebas unitarias para nuevas características
- Documentación actualizada
- Respetar ESLint + Prettier

## 📊 Hoja de Ruta

### v1.1 (Q1 2024)
- [ ] Caché inteligente para optimizar llamadas a la API
- [ ] Plantillas de workflow preconfiguradas
- [ ] Operaciones en lotes para procesamiento masivo
- [ ] Webhooks integrados de PrestaShop

### v1.2 (Q2 2024)
- [ ] Soporte para PrestaShop Cloud
- [ ] Multi-tienda avanzado
- [ ] Mapeo visual de campos
- [ ] Métricas de rendimiento

### v2.0 (Q3 2024)
- [ ] Soporte GraphQL (si está disponible en PrestaShop)
- [ ] Transformación de datos potenciada por IA
- [ ] Sincronización en tiempo real
- [ ] Dashboard de analytics avanzado

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT. Ver el archivo [LICENSE](../LICENSE) para detalles.

## 🙏 Agradecimientos

- **Equipo n8n** por la fantástica herramienta de automatización
- **Comunidad PrestaShop** por la documentación de la API
- **Colaboradores** que mejoran este proyecto

---

**Revoluciona tu e-commerce con n8n y PrestaShop 8** 🚀

[⬆ Volver arriba](#n8n-prestashop-8-node)
