#!/bin/bash

# Script pour pousser le code vers GitHub une fois le repository créé
echo "🚀 Pushing to GitHub..."

# Pousser la branche main
git push -u origin main

# Pousser les tags
git push --tags

echo "✅ Code pushed to GitHub!"
echo "🌐 Repository: https://github.com/PPCM/n8n-nodes-prestashop8"

# Afficher les prochaines étapes
echo ""
echo "🎯 Next steps:"
echo "1. Configure repository settings on GitHub"
echo "2. Add topics: n8n, prestashop, typescript, automation, ecommerce"
echo "3. Publish on npm: npm publish"
echo "4. Share with n8n community"
