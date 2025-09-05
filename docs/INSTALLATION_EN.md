# Installation Guide - PrestaShop 8 Node for n8n

This guide explains how to install and configure the PrestaShop 8 node in your n8n instance.

## 🔧 Prerequisites

### Technical Environment
- **Node.js** 16.10+ 
- **n8n** installed and functional
- **PrestaShop 8.x** with admin access
- SSH/terminal access to your n8n server (for manual installation)

### PrestaShop - Verification
1. **Version**: Make sure you have PrestaShop 8.0+
2. **Admin Access**: Administration rights on the back office
3. **HTTPS**: Recommended for API call security

## 🚀 Installation

### Method 1: Via npm (Recommended)

```bash
# In your n8n folder or globally
npm install n8n-prestashop8-node

# Restart n8n
npm restart n8n
# or if installed globally
n8n start
```

### Method 2: Local Installation (Development)

```bash
# Clone the repository
git clone https://github.com/PPCM/n8n-prestashop8-node.git
cd n8n-prestashop8-node

# Install dependencies
npm install

# Build the project  
npm run build

# Create npm link
npm link

# In your n8n folder
cd /path/to/your/n8n
npm link n8n-prestashop8-node

# Restart n8n
npm restart n8n
```

### Method 3: Docker n8n

If you're using n8n with Docker:

```dockerfile
# Add to your n8n Dockerfile
RUN npm install n8n-prestashop8-node
```

Or with docker-compose:

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
    # Install node on startup
    command: >
      bash -c "
        npm install n8n-prestashop8-node &&
        n8n start
      "
```

## ⚙️ PrestaShop Configuration

### 1. Enable Webservice API

1. **Admin Login**
   - Log into PrestaShop back office
   - URL: `https://your-store.com/admin123`

2. **Enable Web Services**
   ```
   Advanced Parameters > Web Service
   ├── Enable web services: YES  
   ├── Enable CGI mode: YES (if necessary)
   └── Save
   ```

### 2. Create API Key

1. **New API Key**
   ```
   Web Service > Add new key
   ├── Key: [Auto-generate]
   ├── Description: "n8n PrestaShop Integration"
   └── Status: Enabled
   ```

2. **Permission Configuration**
   
   **Minimal Permissions** (read-only):
   ```
   customers: GET
   products: GET  
   orders: GET
   categories: GET
   ```
   
   **Full Permissions** (CRUD):
   ```
   customers: GET, POST, PUT, DELETE
   products: GET, POST, PUT, DELETE
   orders: GET, POST, PUT, DELETE
   categories: GET, POST, PUT, DELETE
   stock_availables: GET, PUT
   [...others as needed]
   ```

3. **IP Restrictions** (optional but recommended)
   - Add your n8n server IP
   - Format: `192.168.1.100` or `10.0.0.0/8`

### 3. Test API

```bash
# Simple test with curl
curl -X GET \
  "https://your-store.com/api/products?display=full&limit=1" \
  -H "Authorization: Basic $(echo -n 'YOUR_API_KEY:' | base64)"
```

Expected response:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <products>
    <product id="1" xlink:href="https://your-store.com/api/products/1">
      ...
    </product>
  </products>
</prestashop>
```

## 🔑 n8n Configuration

### 1. Create Credentials

1. **Access Credentials**
   - In n8n: Menu > Credentials
   - Click "Create New"

2. **PrestaShop 8 API**
   ```
   Type: PrestaShop 8 API
   ├── Base URL: https://your-store.com/api
   ├── API Key: YOUR_GENERATED_API_KEY  
   └── Test Connection: ✓ (optional)
   ```

3. **Connection Test**
   - Click "Test" to validate
   - Expected message: "PrestaShop connection established successfully"

### 2. First Workflow

Create a simple workflow to test:

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
        "prestaShop8Api": "your-credential-id"
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

## 🐛 Troubleshooting

### Common Issues

#### ❌ "Node PrestaShop8 not found"
```bash
# Check installation
npm list n8n-prestashop8-node

# Reinstall if necessary  
npm uninstall n8n-prestashop8-node
npm install n8n-prestashop8-node

# Restart n8n
```

#### ❌ "401 Unauthorized" 
1. **Check API key** in PrestaShop
2. **Verify permissions** for the key
3. **Test with curl** to isolate the problem
4. **Check base URL** (must end with `/api`)

#### ❌ "404 Not Found"
1. **Webservices enabled** in PrestaShop?
2. **Correct URL**? Format: `https://domain.com/api`
3. **Server accessible** from n8n?

#### ❌ "Compilation Errors"
```bash
# Clean and rebuild
npm run clean
npm install  
npm run build
```

### Debug Logs

Enable detailed logs in n8n:

```bash
# Environment variables
export N8N_LOG_LEVEL=debug
export N8N_LOG_OUTPUT=console,file

# Start n8n
n8n start
```

### Data Validation

Use **Raw Mode** for debugging:

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

## 📚 Useful Resources

- **n8n Documentation**: https://docs.n8n.io/
- **PrestaShop API**: https://devdocs.prestashop-project.org/8/webservice/
- **Community Support**: https://community.n8n.io/

## ✅ Installation Validation

Final checklist:

- [ ] Node.js 16.10+ installed
- [ ] n8n working correctly  
- [ ] PrestaShop 8+ with Webservices enabled
- [ ] API key created with proper permissions
- [ ] n8n-prestashop8-node package installed
- [ ] Credentials configured in n8n
- [ ] Connection test successful
- [ ] First workflow functional

🎉 **Installation complete!** You can now use the PrestaShop 8 node in your n8n workflows.
