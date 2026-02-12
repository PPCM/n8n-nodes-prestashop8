# 🔧 Débogage Authentification PrestaShop 8

## ❌ **Erreur Corrigée : "Couldn't connect with these settings"**

### **Problème Identifié**
L'erreur contradictoire `"Couldn't connect with these settings - Connexion PrestaShop établie avec succès"` était causée par une règle de validation incorrecte dans le test de connexion des credentials.

### **Solution Appliquée**
✅ **Correction du test de connexion** dans `PrestaShop8Api.credentials.ts`
- Suppression de la règle `responseSuccessBody` problématique  
- Simplification pour utiliser la validation automatique n8n
- Test basé uniquement sur le code de statut HTTP

---

## 🔍 **Diagnostic Authentification PrestaShop**

### **1. Vérifications Préalables**

#### **URL de Base**
```
Format correct : https://votre-boutique.com/api
❌ Éviter : https://votre-boutique.com/api/
❌ Éviter : https://votre-boutique.com
```

#### **Clé API PrestaShop**
- Générée dans : `Paramètres avancés > Service Web > Clés`
- Format : Chaîne alphanumérique (32 caractères)
- Status : `Activé`

#### **Permissions PrestaShop**
```
Minimales (lecture seule) :
✓ customers: GET
✓ products: GET  
✓ orders: GET
✓ categories: GET

Complètes (CRUD) :
✓ customers: GET, POST, PUT, DELETE
✓ products: GET, POST, PUT, DELETE
✓ orders: GET, POST, PUT, DELETE
✓ stock_availables: GET, PUT
```

### **2. Tests Manuels**

#### **Test curl Direct**
```bash
# Test de base (remplacez YOUR_API_KEY et YOUR_STORE_URL)
curl -X GET \
  "https://votre-boutique.com/api" \
  -H "Authorization: Basic $(echo -n 'YOUR_API_KEY:' | base64)" \
  -H "Output-Format: JSON"
```

**Réponse attendue :**
```json
{
  "prestashop": {
    "api": "https://votre-boutique.com/api"
  }
}
```

#### **Test avec Liste Produits**
```bash
curl -X GET \
  "https://votre-boutique.com/api/products?limit=1" \
  -H "Authorization: Basic $(echo -n 'YOUR_API_KEY:' | base64)" \
  -H "Output-Format: JSON"
```

### **3. Débogage n8n**

#### **Configuration Credentials**
```json
{
  "baseUrl": "https://votre-boutique.com/api",
  "apiKey": "votre-cle-api-32-caracteres",
  "testConnection": true
}
```

#### **Vérifications dans n8n**
1. **Onglet Credentials** → Créer nouvelle credential
2. **Type** : PrestaShop 8 API  
3. **Base URL** : URL complète avec `/api`
4. **API Key** : Coller la clé sans espaces
5. **Save** → Le test devrait maintenant réussir

---

## 🚨 **Erreurs Fréquentes et Solutions**

### **"401 Unauthorized"**
**Causes :**
- Clé API incorrecte
- Permissions insuffisantes  
- IP bloquée

**Solutions :**
```bash
# Vérifier la clé API
curl -I "https://votre-boutique.com/api" \
  -H "Authorization: Basic $(echo -n 'VOTRE_CLE:' | base64)"

# Vérifier les permissions dans PrestaShop
Paramètres avancés > Service Web > Clés > [Votre clé] > Permissions
```

### **"404 Not Found"**
**Causes :**
- URL incorrecte
- Webservices désactivés

**Solutions :**
```bash
# Vérifier l'URL
ping votre-boutique.com

# Dans PrestaShop : Paramètres avancés > Service Web
✓ Activer les services web : OUI
✓ Activer le mode CGI : OUI (si nécessaire)
```

### **"SSL Certificate Error"**
**Causes :**
- Certificat SSL invalide
- Configuration HTTPS incorrecte

**Solutions :**
```bash
# Test avec ignore SSL (développement uniquement)
curl -k "https://votre-boutique.com/api"

# Production : Corriger le certificat SSL
```

### **"Timeout"**
**Causes :**
- Serveur lent
- Restrictions réseau

**Solutions :**
- Augmenter le timeout dans les options avancées n8n
- Vérifier la connectivité réseau
- Contacter l'hébergeur si persistant

---

## 🛠️ **Mode Debug Avancé**

### **Options de Debug n8n**
```json
{
  "resource": "products",
  "operation": "list", 
  "rawMode": true,
  "debugOptions": {
    "showUrl": true,
    "showHeaders": true,
    "timeout": 30000
  }
}
```

### **Logs Détaillés**
```bash
# Variables environnement n8n
export N8N_LOG_LEVEL=debug
export N8N_LOG_OUTPUT=console,file

# Démarrer n8n avec logs
n8n start
```

---

## ✅ **Checklist Validation Authentification**

### **PrestaShop (Back-Office)**
- [ ] Service Web activé
- [ ] Clé API créée et activée
- [ ] Permissions configurées correctement
- [ ] IP autorisée (si restrictions)

### **n8n (Credentials)**
- [ ] URL format correct avec `/api`
- [ ] Clé API copiée exactement
- [ ] Test de connexion réussi
- [ ] Pas d'espaces dans les champs

### **Réseau**
- [ ] HTTPS fonctionnel
- [ ] Pas de proxy bloquant
- [ ] Firewall autorise les connexions
- [ ] DNS résout correctement

---

## 🎯 **Correction Appliquée**

**Fichier modifié :** `credentials/PrestaShop8Api.credentials.ts`

**Avant :**
```typescript
rules: [
  {
    type: 'responseSuccessBody',
    properties: {
      key: 'prestashop',
      value: undefined, // ← Problème ici
      message: 'Connexion PrestaShop établie avec succès',
    },
  },
],
```

**Après :**
```typescript
// Pas de règles - validation automatique n8n
test: ICredentialTestRequest = {
  request: {
    baseURL: '={{$credentials.baseUrl}}',
    url: '/',
    method: 'GET',
    headers: {
      'Output-Format': 'JSON',
    },
  },
};
```

**✅ L'authentification PrestaShop devrait maintenant fonctionner correctement !**

Pour tester, recompilez avec `npm run build` et testez la connexion dans n8n.
