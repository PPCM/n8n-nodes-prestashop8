# Guía de Instalación - Nodo PrestaShop 8 para n8n

Esta guía explica cómo instalar y configurar el nodo PrestaShop 8 en su instancia de n8n.

## 🔧 Prerrequisitos

### Entorno Técnico
- **Node.js** 16.10+ 
- **n8n** instalado y funcional
- **PrestaShop 8.x** con acceso de administrador
- Acceso SSH/terminal a su servidor n8n (para instalación manual)

### PrestaShop - Verificación
1. **Versión**: Asegúrese de tener PrestaShop 8.0+
2. **Acceso Admin**: Derechos de administración en el back office
3. **HTTPS**: Recomendado para la seguridad de las llamadas API

## 🚀 Instalación

### Método 1: Via npm (Recomendado)

```bash
# En su carpeta n8n o globalmente
npm install n8n-prestashop8-node

# Reiniciar n8n
npm restart n8n
# o si está instalado globalmente
n8n start
```

### Método 2: Instalación Local (Desarrollo)

```bash
# Clonar el repositorio
git clone https://github.com/PPCM/n8n-prestashop8-node.git
cd n8n-prestashop8-node

# Instalar dependencias
npm install

# Construir el proyecto  
npm run build

# Crear enlace npm
npm link

# En su carpeta n8n
cd /ruta/a/su/n8n
npm link n8n-prestashop8-node

# Reiniciar n8n
npm restart n8n
```

### Método 3: Docker n8n

Si está usando n8n con Docker:

```dockerfile
# Agregar a su Dockerfile de n8n
RUN npm install n8n-prestashop8-node
```

O con docker-compose:

```yaml
version: '3.1'
services:
  n8n:
    image: n8nio/n8n
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password
    volumes:
      - ./n8n-data:/home/node/.n8n
    # Instalar nodo al inicio
    command: >
      bash -c "
        npm install n8n-prestashop8-node &&
        n8n start
      "
```

## ⚙️ Configuración de PrestaShop

### 1. Habilitar API Webservice

1. **Inicio de Sesión Admin**
   - Inicie sesión en el back office de PrestaShop
   - URL: `https://su-tienda.com/admin123`

2. **Habilitar Servicios Web**
   ```
   Parámetros Avanzados > Servicio Web
   ├── Habilitar servicios web: SÍ  
   ├── Habilitar modo CGI: SÍ (si es necesario)
   └── Guardar
   ```

### 2. Crear Clave API

1. **Nueva Clave API**
   ```
   Servicio Web > Agregar nueva clave
   ├── Clave: [Generar automáticamente]
   ├── Descripción: "n8n PrestaShop Integration"
   └── Estado: Habilitado
   ```

2. **Configuración de Permisos**
   
   **Permisos Mínimos** (solo lectura):
   ```
   customers: GET
   products: GET  
   orders: GET
   categories: GET
   ```
   
   **Permisos Completos** (CRUD):
   ```
   customers: GET, POST, PUT, DELETE
   products: GET, POST, PUT, DELETE
   orders: GET, POST, PUT, DELETE
   categories: GET, POST, PUT, DELETE
   stock_availables: GET, PUT
   [...otros según necesidades]
   ```

3. **Restricciones de IP** (opcional pero recomendado)
   - Agregue la IP de su servidor n8n
   - Formato: `192.168.1.100` o `10.0.0.0/8`

### 3. Probar API

```bash
# Prueba simple con curl
curl -X GET \
  "https://su-tienda.com/api/products?display=full&limit=1" \
  -H "Authorization: Basic $(echo -n 'SU_CLAVE_API:' | base64)"
```

Respuesta esperada:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <products>
    <product id="1" xlink:href="https://su-tienda.com/api/products/1">
      ...
    </product>
  </products>
</prestashop>
```

## 🔑 Configuración de n8n

### 1. Crear Credenciales

1. **Acceso a Credenciales**
   - En n8n: Menú > Credentials
   - Haga clic en "Create New"

2. **API de PrestaShop 8**
   ```
   Tipo: PrestaShop 8 API
   ├── URL Base: https://su-tienda.com/api
   ├── Clave API: SU_CLAVE_API_GENERADA  
   └── Probar Conexión: ✓ (opcional)
   ```

3. **Prueba de Conexión**
   - Haga clic en "Test" para validar
   - Mensaje esperado: "Conexión PrestaShop establecida con éxito"

### 2. Primer Workflow

Cree un workflow simple para probar:

```json
{
  "nodes": [
    {
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger"
    },
    {
      "name": "PrestaShop 8",
      "type": "PrestaShop8",
      "credentials": {
        "prestaShop8Api": "su-id-de-credenciales"
      },
      "parameters": {
        "resource": "products",
        "operation": "list",
        "advancedOptions": {
          "limit": "5"
        }
      }
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [["PrestaShop 8"]]
    }
  }
}
```

## 🐛 Solución de Problemas

### Problemas Comunes

#### ❌ "Node PrestaShop8 not found"
```bash
# Verificar instalación
npm list n8n-prestashop8-node

# Reinstalar si es necesario  
npm uninstall n8n-prestashop8-node
npm install n8n-prestashop8-node

# Reiniciar n8n
```

#### ❌ "401 Unauthorized" 
1. **Verificar clave API** en PrestaShop
2. **Comprobar permisos** de la clave
3. **Probar con curl** para aislar el problema
4. **Verificar URL base** (debe terminar en `/api`)

#### ❌ "404 Not Found"
1. **¿Webservices habilitados** en PrestaShop?
2. **¿URL correcta**? Formato: `https://dominio.com/api`
3. **¿Servidor accesible** desde n8n?

#### ❌ "Compilation Errors"
```bash
# Limpiar y reconstruir
npm run clean
npm install  
npm run build
```

### Logs de Debug

Habilitar logs detallados en n8n:

```bash
# Variables de entorno
export N8N_LOG_LEVEL=debug
export N8N_LOG_OUTPUT=console,file

# Iniciar n8n
n8n start
```

### Validación de Datos

Use **Modo Raw** para debugging:

```json
{
  "resource": "products",
  "operation": "getById", 
  "id": "1",
  "rawMode": true,
  "debugOptions": {
    "showUrl": true,
    "showHeaders": true
  }
}
```

## 📚 Recursos Útiles

- **Documentación n8n**: https://docs.n8n.io/
- **API PrestaShop**: https://devdocs.prestashop-project.org/8/webservice/
- **Soporte Comunidad**: https://community.n8n.io/

## ✅ Validación de Instalación

Lista de verificación final:

- [ ] Node.js 16.10+ instalado
- [ ] n8n funcionando correctamente  
- [ ] PrestaShop 8+ con Webservices habilitados
- [ ] Clave API creada con permisos apropiados
- [ ] Paquete n8n-prestashop8-node instalado
- [ ] Credenciales configuradas en n8n
- [ ] Prueba de conexión exitosa
- [ ] Primer workflow funcional

🎉 **¡Instalación completa!** Ahora puede usar el nodo PrestaShop 8 en sus workflows de n8n.
