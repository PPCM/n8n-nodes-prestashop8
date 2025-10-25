# PrestaShop Schema Fetcher

## Description

Ce script récupère automatiquement les schémas de toutes les ressources PrestaShop depuis votre API et génère un fichier TypeScript contenant les définitions de types.

## Utilisation

### Option 1: Avec arguments en ligne de commande

```bash
npm run fetch-schemas -- https://votre-site.com/api VOTRE_CLE_API
```

### Option 2: Avec variables d'environnement

```bash
export PRESTASHOP_API_URL=https://votre-site.com/api
export PRESTASHOP_API_KEY=VOTRE_CLE_API
npm run fetch-schemas
```

### Option 3: Direct avec node

```bash
node scripts/fetch-prestashop-schemas.js https://votre-site.com/api VOTRE_CLE_API
```

## Ce que fait le script

1. **Connexion à l'API PrestaShop** avec votre clé API
2. **Récupération des schémas** pour chaque ressource via `?schema=synopsis`
3. **Parsing des types** PrestaShop vers types JavaScript:
   - `isUnsignedId`, `isInt` → `number`
   - `isBool` → `boolean`
   - `isPrice`, `isFloat` → `number`
   - `isString`, `isGenericName`, etc. → `string`
4. **Génération du fichier** `nodes/PrestaShop8/resourceSchemas.ts`

## Fichier généré

Le fichier `resourceSchemas.ts` contient:

### Définitions de schémas

```typescript
export const RESOURCE_SCHEMAS = {
  products: {
    id: { type: 'number', format: 'isUnsignedId', required: false, ... },
    active: { type: 'boolean', format: 'isBool', required: false, ... },
    price: { type: 'number', format: 'isPrice', required: false, ... },
    ...
  },
  stock_availables: {
    id_product: { type: 'number', format: 'isUnsignedId', required: true, ... },
    ...
  },
  ...
}
```

### Fonctions utilitaires

- `getResourceSchema(resource)` - Obtenir le schéma complet d'une ressource
- `getResourceFields(resource)` - Liste tous les champs disponibles
- `getRequiredFields(resource)` - Liste les champs obligatoires
- `getWritableFields(resource)` - Liste les champs modifiables (non read-only)
- `convertFieldValue(value, fieldInfo)` - Convertir une valeur au bon type
- `convertResourceTypes(data, resource)` - Convertir tous les champs d'un objet
- `convertResourceArray(data, resource)` - Convertir un tableau de ressources

## Quand exécuter ce script

- **Première installation** du nœud
- **Après une mise à jour** de PrestaShop qui modifie les schémas
- **Ajout de nouvelles ressources** personnalisées
- **Personnalisation** si vous avez modifié les champs PrestaShop

## Ressources supportées

Le script récupère les schémas pour 31 ressources:
- products, categories, customers, addresses
- orders, carts, carriers
- stock_availables, combinations
- Et 22 autres ressources PrestaShop

## Prochaines étapes

Après avoir exécuté le script:

1. **Vérifier** le fichier généré: `nodes/PrestaShop8/resourceSchemas.ts`
2. **Compiler** le projet: `npm run build`
3. **Tester** avec vos workflows n8n
4. Les types seront automatiquement convertis pour:
   - List all
   - Get by ID
   - Search with filters

## Exemple de sortie

```
🚀 PrestaShop Schema Fetcher
📡 API URL: https://example.com/api

📥 Fetching schemas for all resources...

  products... ✅ (87 fields)
  categories... ✅ (45 fields)
  customers... ✅ (52 fields)
  stock_availables... ✅ (15 fields)
  ...

📊 Summary: 29 successful, 2 failed

📝 Generating TypeScript file...
✅ Generated: nodes/PrestaShop8/resourceSchemas.ts
📦 Total resources: 29
📋 Total fields: 1247

🎉 Schema generation complete!
```

## Dépannage

**Erreur de connexion**:
- Vérifiez l'URL de l'API (doit se terminer par `/api`)
- Vérifiez la clé API
- Vérifiez que l'API est accessible

**Aucun schéma trouvé**:
- Vérifiez les permissions de la clé API
- Assurez-vous que PrestaShop autorise l'accès aux schémas

**Format inattendu**:
- Le script gère les formats PrestaShop standards
- Si vous avez des champs personnalisés avec des formats inconnus, ils seront traités comme `string` par défaut
