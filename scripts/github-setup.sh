#!/bin/bash

# Script de configuration GitHub pour le projet n8n PrestaShop 8
# Usage: ./scripts/github-setup.sh

set -e

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Configuration GitHub - n8n PrestaShop 8 Node${NC}"
echo "=================================================="

# Vérifier que Git est installé
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git n'est pas installé${NC}"
    exit 1
fi

# Vérifier que nous sommes dans un dossier de projet
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Ce script doit être exécuté depuis le dossier racine du projet${NC}"
    exit 1
fi

# Initialiser git si pas encore fait
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📂 Initialisation du repository Git...${NC}"
    git init
    echo -e "${GREEN}✅ Repository Git initialisé${NC}"
fi

# Configurer le remote GitHub
echo -e "${YELLOW}🔗 Configuration du remote GitHub...${NC}"
if git remote | grep -q "origin"; then
    git remote set-url origin https://github.com/PPCM/n8n-nodes-prestashop8.git
    echo -e "${GREEN}✅ Remote origin mis à jour${NC}"
else
    git remote add origin https://github.com/PPCM/n8n-nodes-prestashop8.git
    echo -e "${GREEN}✅ Remote origin ajouté${NC}"
fi

# Renommer README pour GitHub si nécessaire
if [ -f "README_GITHUB.md" ]; then
    echo -e "${YELLOW}📄 Préparation du README pour GitHub...${NC}"
    if [ -f "README.md" ]; then
        mv README.md README_FULL.md
        echo -e "${BLUE}📄 README.md sauvegardé vers README_FULL.md${NC}"
    fi
    cp README_GITHUB.md README.md
    echo -e "${GREEN}✅ README GitHub activé${NC}"
fi

# Ajouter tous les fichiers
echo -e "${YELLOW}📦 Ajout des fichiers au staging...${NC}"
git add .
echo -e "${GREEN}✅ Fichiers ajoutés${NC}"

# Commit initial si aucun commit
if ! git log --oneline 2>/dev/null | head -1 > /dev/null; then
    echo -e "${YELLOW}💾 Commit initial...${NC}"
    git commit -m "🎉 Initial release: n8n PrestaShop 8 Node v1.0.0

✨ Features:
- Full CRUD operations for PrestaShop 8
- Automatic XML/JSON conversion
- 25+ resources supported
- Advanced filtering and search
- Raw mode for debugging
- Comprehensive documentation

🛠️ Technical:
- TypeScript with strict typing
- n8n community node compatible
- ESLint + Prettier configuration
- Automated build and testing

📚 Documentation:
- Complete setup guides
- Practical examples
- Installation instructions
- Troubleshooting guides"
    echo -e "${GREEN}✅ Commit initial créé${NC}"
else
    echo -e "${BLUE}📝 Commit existant détecté, commit des changements...${NC}"
    git commit -m "📦 Update GitHub references and documentation

- Update package.json with GitHub repository
- Add GitHub links in documentation
- Create GitHub-specific README
- Update contribution guidelines
- Add GitHub Issues links" || echo -e "${YELLOW}⚠️  Aucun changement à commiter${NC}"
fi

# Créer les tags de version
echo -e "${YELLOW}🏷️  Création du tag de version...${NC}"
if ! git tag | grep -q "v1.0.0"; then
    git tag -a v1.0.0 -m "🎉 Release v1.0.0 - Initial release

Features:
- Full CRUD operations
- XML/JSON auto-conversion  
- 25+ PrestaShop resources
- Advanced filtering
- Comprehensive documentation"
    echo -e "${GREEN}✅ Tag v1.0.0 créé${NC}"
else
    echo -e "${BLUE}🏷️  Tag v1.0.0 existe déjà${NC}"
fi

# Afficher les prochaines étapes
echo ""
echo -e "${BLUE}🎯 Prochaines étapes :${NC}"
echo "1. ${YELLOW}Créer le repository sur GitHub :${NC}"
echo "   https://github.com/new"
echo "   Repository name: n8n-nodes-prestashop8"
echo "   Description: Comprehensive n8n community node for PrestaShop 8 integration with automatic XML/JSON conversion"
echo ""

echo "2. ${YELLOW}Pousser le code vers GitHub :${NC}"
echo "   git branch -M main"
echo "   git push -u origin main"
echo "   git push --tags"
echo ""

echo "3. ${YELLOW}Configurer le repository GitHub :${NC}"
echo "   - Ajouter description et topics"
echo "   - Configurer GitHub Pages (optionnel)"
echo "   - Activer Issues et Discussions"
echo "   - Ajouter README badges"
echo ""

echo "4. ${YELLOW}Publier sur npm :${NC}"
echo "   npm login"
echo "   npm publish"
echo ""

echo "5. ${YELLOW}Partager avec la communauté :${NC}"
echo "   - n8n Community Forum"
echo "   - Reddit r/n8n"
echo "   - Twitter/LinkedIn"
echo ""

echo -e "${GREEN}🎉 Configuration GitHub terminée !${NC}"
echo -e "${BLUE}Repository prêt pour GitHub : https://github.com/PPCM/n8n-nodes-prestashop8${NC}"
