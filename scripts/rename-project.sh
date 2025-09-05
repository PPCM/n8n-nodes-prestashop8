#!/bin/bash

# Script pour renommer toutes les références du projet
# De: n8n-nodes-prestashop8 vers n8n-nodes-prestashop8

echo "🔄 Renommage du projet vers n8n-nodes-prestashop8..."

# Chercher et remplacer dans tous les fichiers Markdown
find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" -exec sed -i 's/n8n-nodes-prestashop8/n8n-nodes-prestashop8/g' {} +

# Chercher et remplacer dans tous les fichiers JSON
find . -name "*.json" -not -path "./node_modules/*" -not -path "./.git/*" -exec sed -i 's/n8n-nodes-prestashop8/n8n-nodes-prestashop8/g' {} +

# Chercher et remplacer dans tous les fichiers shell
find . -name "*.sh" -not -path "./node_modules/*" -not -path "./.git/*" -exec sed -i 's/n8n-nodes-prestashop8/n8n-nodes-prestashop8/g' {} +

echo "✅ Toutes les références ont été mises à jour!"

# Afficher un résumé des fichiers modifiés
echo ""
echo "📊 Fichiers qui contenaient des références (vérification):"
grep -r "n8n-nodes-prestashop8" . --exclude-dir=node_modules --exclude-dir=.git || echo "✅ Aucune référence à l'ancien nom trouvée!"

echo ""
echo "🎯 Prochaines étapes:"
echo "1. Vérifier les modifications avec: git diff"
echo "2. Créer un nouveau repository GitHub: n8n-nodes-prestashop8"
echo "3. Committer les changements"
echo "4. Mettre à jour le remote: git remote set-url origin https://github.com/PPCM/n8n-nodes-prestashop8.git"
