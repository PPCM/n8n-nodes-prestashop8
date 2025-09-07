# ⚡ Guide d'Installation Rapide - PrestaShop 8 Node

## 📦 **Installation**

### 1. **Installer le Package**
```bash
# Dans votre répertoire n8n
npm install /home/ppcm/CascadeProjects/n8n-nodes-prestashop8/n8n-nodes-prestashop8-1.0.0.tgz

# Ou si vous avez copié le fichier ailleurs
npm install /chemin/vers/n8n-nodes-prestashop8-1.0.0.tgz
```

### 2. **Redémarrer n8n**
```bash
# Arrêter n8n
Ctrl+C (si en mode développement)

# Redémarrer n8n  
npm start
# ou
n8n start
```

---

## 🔧 **Configuration PrestaShop**

### 1. **Activer l'API Web Service**
Dans votre back-office PrestaShop :
1. Allez dans **Paramètres avancés** → **Webservice**
2. Activez **"Activer le webservice de PrestaShop"**
3. Cliquez **"Ajouter une nouvelle clé de webservice"**

### 2. **Créer une Clé API**
1. **Description** : `n8n Integration`
2. **Clé** : Générer automatiquement ou personnaliser
3. **Permissions** : Cocher les ressources nécessaires
   - ✅ Products (Lecture/Écriture)
   - ✅ Categories (Lecture/Écriture) 
   - ✅ Customers (Lecture/Écriture)
   - ✅ Orders (Lecture)
   - ✅ Autres selon vos besoins
4. **Sauvegarder**

---

## 🎯 **Premier Test**

### 1. **Créer les Credentials**
Dans n8n :
1. Aller dans **Credentials**
2. Créer **"PrestaShop 8 Api"**
3. Remplir :
   - **Base URL** : `https://votre-boutique.com/api`
   - **API Key** : Votre clé créée ci-dessus

### 2. **Test de Connexion**
1. **Nouveau Workflow** dans n8n
2. **Ajouter nœud** → Rechercher **"PrestaShop"**
3. Vous devriez voir :
   ```
   ✅ PrestaShop 8
   ✅ PrestaShop 8 - Products  
   ✅ PrestaShop 8 - Orders
   ✅ PrestaShop 8 - Customers
   ✅ PrestaShop 8 - Categories
   ✅ PrestaShop 8 - Stock
   ```

### 3. **Premier Workflow**
1. Choisir **"PrestaShop 8 - Products"**
2. **Resource** : `products` (pré-sélectionné)
3. **Operation** : `Lister tous`
4. **Credentials** : Sélectionner vos credentials
5. **Exécuter** le nœud

---

## ✅ **Vérification du Succès**

### **Indicateurs de Bon Fonctionnement**
- [ ] **6 nœuds** PrestaShop visibles dans la recherche
- [ ] **Connexion réussie** aux credentials
- [ ] **Données reçues** lors de l'exécution
- [ ] **Raw Mode** retourne XML (si activé)
- [ ] **Mode Normal** retourne JSON propre

### **Si Problème d'Icône**
L'icône peut apparaître comme "?" ou image cassée :
- C'est **normal** lors du premier test
- **Fonctionnalité** non affectée
- **Rechargez** la page n8n si nécessaire

---

## 🎪 **Exemple Workflow Complet**

```
[Manual Trigger] 
    ↓
[PrestaShop 8 - Products]
    • Operation: Lister tous
    • Raw Mode: OFF
    • Limit: 10
    ↓  
[Set Node]
    • Extraire: name, price, active
    ↓
[Email Node] 
    • Envoyer liste produits
```

---

## 🔍 **Test Raw Mode**

### **Comparaison des Modes**

**Mode Normal (Raw Mode: OFF)**
```json
{
  "id": 1,
  "name": "T-shirt Blanc", 
  "price": 15.99,
  "active": true
}
```

**Raw Mode (Raw Mode: ON)**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <products>
    <product>
      <id><![CDATA[1]]></id>
      <name>
        <language id="1"><![CDATA[T-shirt Blanc]]></language>
      </name>
      <associations>...</associations>
    </product>
  </products>
</prestashop>
```

---

## 🆘 **Dépannage Rapide**

### **Erreur "Node not found"**
```bash
# Vérifier installation
npm list | grep prestashop

# Réinstaller si nécessaire
npm uninstall n8n-nodes-prestashop8
npm install /chemin/vers/n8n-nodes-prestashop8-1.0.0.tgz
```

### **Erreur de Connexion API**
1. **Vérifier URL** : `https://boutique.com/api` (avec `/api`)
2. **Tester clé** manuellement :
   ```bash
   curl -u "VOTRE_CLE:" https://boutique.com/api/products?display=full
   ```
3. **Permissions** : Vérifier dans PrestaShop admin

### **Raw Mode ne fonctionne pas**
- **Version n8n** : Compatible avec 0.220.0+
- **Redémarrer** n8n après installation
- **Tester** d'abord mode normal, puis Raw

---

## 🎉 **Félicitations !**

Si tout fonctionne, vous avez maintenant :
- ✅ **6 nœuds PrestaShop** fonctionnels
- ✅ **Accès à 30+ ressources** PrestaShop
- ✅ **Raw Mode XML** pour intégrations avancées  
- ✅ **Interface moderne** en anglais

**🚀 Vous êtes prêt à créer des workflows PrestaShop puissants ! 🚀**

---

**💡 Conseil : Commencez par des opérations simples (List, GetById) avant les modifications (Create, Update, Delete)**
