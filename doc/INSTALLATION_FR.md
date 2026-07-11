# Guide d'Installation - Nœud PrestaShop 8 pour n8n

Ce guide vous explique comment installer et configurer le nœud PrestaShop 8 dans votre instance n8n.

## 🔧 Prérequis

### Environnement Technique
- **Node.js** 16.10+ 
- **n8n** installé et fonctionnel
- **PrestaShop 8.x** avec accès admin
- Accès SSH/terminal à votre serveur n8n (pour installation manuelle)

### PrestaShop - Vérification
1. **Version** : Assurez-vous d'avoir PrestaShop 8.0+
2. **Accès Admin** : Droits d'administration sur le back-office
3. **HTTPS** : Recommandé pour la sécurité des API calls

## 🚀 Installation

### Méthode 1 : Via npm (Recommandée)

```bash
# Dans votre dossier n8n ou globalement
npm install n8n-nodes-prestashop8

# Redémarrez n8n
npm restart n8n
# ou si installé globalement
n8n start
```

### Méthode 2 : Installation Locale (Développement)

```bash
# Cloner le repository
git clone https://github.com/PPCM/n8n-nodes-prestashop8.git
cd n8n-nodes-prestashop8

# Installer les dépendances
npm install

# Compiler le projet  
npm run build

# Créer un lien npm
npm link

# Dans votre dossier n8n
cd /path/to/your/n8n
npm link n8n-nodes-prestashop8

# Redémarrer n8n
npm restart n8n
```

### Méthode 3 : Docker n8n

Si vous utilisez n8n avec Docker :

```dockerfile
# Ajoutez dans votre Dockerfile n8n
RUN npm install n8n-nodes-prestashop8
```

Ou avec docker-compose :

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
    # Installer le nœud au démarrage
    command: >
      bash -c "
        npm install n8n-nodes-prestashop8 &&
        n8n start
      "
```

## ⚙️ Configuration PrestaShop

### 1. Activer l'API Webservice

1. **Connexion Admin**
   - Connectez-vous au back-office PrestaShop
   - URL : `https://votre-boutique.com/admin123`

2. **Activer les Services Web**
   ```
   Paramètres Avancés > Service Web
   ├── Activer les services Web : OUI  
   ├── Activer le mode CGI : OUI (si nécessaire)
   └── Sauvegarder
   ```

### 2. Créer une Clé API

1. **Nouvelle Clé API**
   ```
   Service Web > Ajouter une nouvelle clé
   ├── Clé : [Générer automatiquement]
   ├── Description : "n8n PrestaShop Integration"
   └── État : Activé
   ```

2. **Configuration des Permissions**
   
   **Permissions Minimales** (lecture seule) :
   ```
   customers: GET
   products: GET  
   orders: GET
   categories: GET
   ```
   
   **Permissions Complètes** (CRUD) :
   ```
   customers: GET, POST, PUT, DELETE
   products: GET, POST, PUT, DELETE
   orders: GET, POST, PUT, DELETE
   categories: GET, POST, PUT, DELETE
   stock_availables: GET, PUT
   [...autres selon besoins]
   ```

3. **Restrictions IP** (optionnel mais recommandé)
   - Ajoutez l'IP de votre serveur n8n
   - Format : `192.168.1.100` ou `10.0.0.0/8`

### 3. Tester l'API

```bash
# Test simple avec curl
curl -X GET \
  "https://votre-boutique.com/api/products?display=full&limit=1" \
  -H "Authorization: Basic $(echo -n 'VOTRE_CLE_API:' | base64)"
```

Réponse attendue :
```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <products>
    <product id="1" xlink:href="https://votre-boutique.com/api/products/1">
      ...
    </product>
  </products>
</prestashop>
```

## 🔑 Configuration n8n

### 1. Créer les Credentials

1. **Accès Credentials**
   - Dans n8n : Menu > Credentials
   - Cliquer sur "Create New"

2. **PrestaShop 8 API**
   ```
   Type : PrestaShop 8 API
   ├── Base URL : https://votre-boutique.com/api
   ├── API Key : VOTRE_CLE_API_GENEREE  
   └── Test Connection : ✓ (optionnel)
   ```

3. **Test de Connexion**
   - Cliquer sur "Test" pour valider
   - Message attendu : "Connexion PrestaShop établie avec succès"

### 2. Premier Workflow

Créez un workflow simple pour tester :

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
        "prestaShop8Api": "votre-credential-id"
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

## 🐛 Dépannage

### Problèmes Courants

#### ❌ "Node PrestaShop8 not found"
```bash
# Vérifier l'installation
npm list n8n-nodes-prestashop8

# Réinstaller si nécessaire  
npm uninstall n8n-nodes-prestashop8
npm install n8n-nodes-prestashop8

# Redémarrer n8n
```

#### ❌ Le paquet ne se charge plus après une mise à jour (`Cannot find module 'axios'` / `Cannot find module 'xmlbuilder'` / `ENOENT ... xmlbuilder/lib/index.js`)

Les versions jusqu'à la 2.8.1 pouvaient laisser une installation cassée, et n8n garde la version cassée épinglée dans `~/.n8n/nodes/package.json` — chaque redémarrage de pod/conteneur la réinstalle alors. Pour récupérer :

```bash
# 1. Supprimer le dossier des nœuds communautaires (résidus + version épinglée)
rm -rf ~/.n8n/nodes

# 2. Redémarrer n8n (il démarre sans le nœud, sans erreur)

# 3. Réinstaller via l'interface : Settings → Community nodes → Install
#    → n8n-nodes-prestashop8 (installe ≥ 2.8.2, qui est autonome)
```

Les credentials sont stockés en base de données et ne sont **pas** perdus par cette opération. Remarque : si un menu de credentials apparaît vide ensuite, vérifiez que le credential est partagé avec le **projet** du workflow (n8n cloisonne les credentials par projet).

#### ❌ "401 Unauthorized" 
1. **Vérifier la clé API** dans PrestaShop
2. **Contrôler les permissions** de la clé
3. **Tester avec curl** pour isoler le problème
4. **Vérifier l'URL de base** (doit finir par `/api`)

#### ❌ "404 Not Found"
1. **Webservices activés** dans PrestaShop ?
2. **URL correcte** ? Format : `https://domain.com/api`
3. **Serveur accessible** depuis n8n ?

#### ❌ "Compilation Errors"
```bash
# Nettoyer et reconstruire
npm run clean
npm install  
npm run build
```

### Logs de Debug

Activez les logs détaillés dans n8n :

```bash
# Variables d'environnement
export N8N_LOG_LEVEL=debug
export N8N_LOG_OUTPUT=console,file

# Démarrer n8n
n8n start
```

### Validation des Données

Utilisez le **Mode Raw** pour debug :

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

## 📚 Ressources Utiles

- **Documentation n8n** : https://docs.n8n.io/
- **API PrestaShop** : https://devdocs.prestashop-project.org/8/webservice/
- **Support Community** : https://community.n8n.io/

## ✅ Validation Installation

Checklist finale :

- [ ] Node.js 16.10+ installé
- [ ] n8n fonctionne correctement  
- [ ] PrestaShop 8+ avec Webservices activés
- [ ] Clé API créée avec bonnes permissions
- [ ] Package n8n-nodes-prestashop8 installé
- [ ] Credentials configurées dans n8n
- [ ] Test de connexion réussi
- [ ] Premier workflow fonctionnel

🎉 **Installation terminée !** Vous pouvez maintenant utiliser le nœud PrestaShop 8 dans vos workflows n8n.
