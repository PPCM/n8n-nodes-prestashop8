# Installationsanleitung - PrestaShop 8 Node für n8n

Diese Anleitung erklärt, wie Sie den PrestaShop 8 Node in Ihrer n8n-Instanz installieren und konfigurieren.

## 🔧 Voraussetzungen

### Technische Umgebung
- **Node.js** 16.10+ 
- **n8n** installiert und funktionsfähig
- **PrestaShop 8.x** mit Admin-Zugang
- SSH/Terminal-Zugang zu Ihrem n8n-Server (für manuelle Installation)

### PrestaShop - Überprüfung
1. **Version**: Stellen Sie sicher, dass Sie PrestaShop 8.0+ haben
2. **Admin-Zugang**: Administratorrechte im Back-Office
3. **HTTPS**: Empfohlen für die Sicherheit der API-Aufrufe

## 🚀 Installation

### Methode 1: Via npm (Empfohlen)

```bash
# In Ihrem n8n-Ordner oder global
npm install n8n-nodes-prestashop8

# n8n neustarten
npm restart n8n
# oder falls global installiert
n8n start
```

### Methode 2: Lokale Installation (Entwicklung)

```bash
# Repository klonen
git clone https://github.com/PPCM/n8n-nodes-prestashop8.git
cd n8n-nodes-prestashop8

# Abhängigkeiten installieren
npm install

# Projekt bauen  
npm run build

# npm-Link erstellen
npm link

# In Ihrem n8n-Ordner
cd /pfad/zu/ihrem/n8n
npm link n8n-nodes-prestashop8

# n8n neustarten
npm restart n8n
```

### Methode 3: Docker n8n

Wenn Sie n8n mit Docker verwenden:

```dockerfile
# Zu Ihrer n8n Dockerfile hinzufügen
RUN npm install n8n-nodes-prestashop8
```

Oder mit docker-compose:

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
    # Node beim Start installieren
    command: >
      bash -c "
        npm install n8n-nodes-prestashop8 &&
        n8n start
      "
```

## ⚙️ PrestaShop-Konfiguration

### 1. Webservice-API aktivieren

1. **Admin-Anmeldung**
   - Melden Sie sich im PrestaShop Back-Office an
   - URL: `https://ihr-shop.com/admin123`

2. **Webservices aktivieren**
   ```
   Erweiterte Parameter > Webservice
   ├── Webservices aktivieren: JA  
   ├── CGI-Modus aktivieren: JA (falls nötig)
   └── Speichern
   ```

### 2. API-Schlüssel erstellen

1. **Neuer API-Schlüssel**
   ```
   Webservice > Neuen Schlüssel hinzufügen
   ├── Schlüssel: [Automatisch generieren]
   ├── Beschreibung: "n8n PrestaShop Integration"
   └── Status: Aktiviert
   ```

2. **Berechtigungskonfiguration**
   
   **Minimale Berechtigungen** (nur lesen):
   ```
   customers: GET
   products: GET  
   orders: GET
   categories: GET
   ```
   
   **Vollständige Berechtigungen** (CRUD):
   ```
   customers: GET, POST, PUT, DELETE
   products: GET, POST, PUT, DELETE
   orders: GET, POST, PUT, DELETE
   categories: GET, POST, PUT, DELETE
   stock_availables: GET, PUT
   [...andere nach Bedarf]
   ```

3. **IP-Beschränkungen** (optional aber empfohlen)
   - Fügen Sie die IP Ihres n8n-Servers hinzu
   - Format: `192.168.1.100` oder `10.0.0.0/8`

### 3. API testen

```bash
# Einfacher Test mit curl
curl -X GET \
  "https://ihr-shop.com/api/products?display=full&limit=1" \
  -H "Authorization: Basic $(echo -n 'IHR_API_SCHLÜSSEL:' | base64)"
```

Erwartete Antwort:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <products>
    <product id="1" xlink:href="https://ihr-shop.com/api/products/1">
      ...
    </product>
  </products>
</prestashop>
```

## 🔑 n8n-Konfiguration

### 1. Anmeldedaten erstellen

1. **Zugang zu Anmeldedaten**
   - In n8n: Menü > Credentials
   - Klicken Sie auf "Create New"

2. **PrestaShop 8 API**
   ```
   Typ: PrestaShop 8 API
   ├── Basis-URL: https://ihr-shop.com/api
   ├── API-Schlüssel: IHR_GENERIERTER_API_SCHLÜSSEL  
   └── Verbindung testen: ✓ (optional)
   ```

3. **Verbindungstest**
   - Klicken Sie auf "Test" zum Validieren
   - Erwartete Nachricht: "PrestaShop-Verbindung erfolgreich hergestellt"

### 2. Erster Workflow

Erstellen Sie einen einfachen Workflow zum Testen:

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
        "prestaShop8Api": "ihre-anmeldedaten-id"
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

## 🐛 Fehlerbehebung

### Häufige Probleme

#### ❌ "Node PrestaShop8 not found"
```bash
# Installation überprüfen
npm list n8n-nodes-prestashop8

# Bei Bedarf neu installieren  
npm uninstall n8n-nodes-prestashop8
npm install n8n-nodes-prestashop8

# n8n neu starten
```

#### ❌ "401 Unauthorized" 
1. **API-Schlüssel überprüfen** in PrestaShop
2. **Berechtigungen überprüfen** für den Schlüssel
3. **Mit curl testen** um das Problem zu isolieren
4. **Basis-URL überprüfen** (muss mit `/api` enden)

#### ❌ "404 Not Found"
1. **Webservices aktiviert** in PrestaShop?
2. **Korrekte URL**? Format: `https://domain.com/api`
3. **Server erreichbar** von n8n aus?

#### ❌ "Compilation Errors"
```bash
# Bereinigen und neu bauen
npm run clean
npm install  
npm run build
```

### Debug-Protokolle

Detaillierte Protokolle in n8n aktivieren:

```bash
# Umgebungsvariablen
export N8N_LOG_LEVEL=debug
export N8N_LOG_OUTPUT=console,file

# n8n starten
n8n start
```

### Datenvalidierung

Verwenden Sie **Raw-Modus** zum Debuggen:

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

## 📚 Nützliche Ressourcen

- **n8n-Dokumentation**: https://docs.n8n.io/
- **PrestaShop-API**: https://devdocs.prestashop-project.org/8/webservice/
- **Community-Support**: https://community.n8n.io/

## ✅ Installationsvalidierung

Abschließende Checkliste:

- [ ] Node.js 16.10+ installiert
- [ ] n8n funktioniert korrekt  
- [ ] PrestaShop 8+ mit aktivierten Webservices
- [ ] API-Schlüssel mit ordnungsgemäßen Berechtigungen erstellt
- [ ] n8n-nodes-prestashop8-Paket installiert
- [ ] Anmeldedaten in n8n konfiguriert
- [ ] Verbindungstest erfolgreich
- [ ] Erster Workflow funktional

🎉 **Installation abgeschlossen!** Sie können nun den PrestaShop 8 Node in Ihren n8n-Workflows verwenden.
