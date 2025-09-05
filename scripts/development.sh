#!/bin/bash

# Script de développement pour le nœud PrestaShop 8
# Facilite les tâches courantes de développement

set -e

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Script de Développement - Nœud PrestaShop 8${NC}"
echo "=================================================="

# Fonction d'aide
show_help() {
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./scripts/development.sh [command]"
    echo ""
    echo -e "${YELLOW}Commands disponibles:${NC}"
    echo "  install     - Installation des dépendances"
    echo "  dev         - Mode développement (watch)"
    echo "  build       - Compilation du projet"
    echo "  test        - Tests du nœud"
    echo "  lint        - Vérification du code"
    echo "  fix         - Correction automatique du code"
    echo "  clean       - Nettoyage des fichiers générés"
    echo "  package     - Création du package npm"
    echo "  link        - Création du lien npm local"
    echo "  unlink      - Suppression du lien npm"
    echo "  status      - Statut du projet"
    echo "  help        - Affiche cette aide"
}

# Installation des dépendances
install_deps() {
    echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
    npm install
    echo -e "${GREEN}✅ Dépendances installées${NC}"
}

# Mode développement
dev_mode() {
    echo -e "${YELLOW}👀 Mode développement (watch)...${NC}"
    echo -e "${BLUE}Ctrl+C pour arrêter${NC}"
    npm run dev
}

# Compilation
build_project() {
    echo -e "${YELLOW}🔨 Compilation du projet...${NC}"
    npm run build
    echo -e "${GREEN}✅ Compilation terminée${NC}"
}

# Tests
run_tests() {
    echo -e "${YELLOW}🧪 Exécution des tests...${NC}"
    npm test
    echo -e "${GREEN}✅ Tests terminés${NC}"
}

# Linting
lint_code() {
    echo -e "${YELLOW}🔍 Vérification du code...${NC}"
    npm run lint
    echo -e "${GREEN}✅ Code vérifié${NC}"
}

# Correction automatique
fix_code() {
    echo -e "${YELLOW}🔧 Correction automatique du code...${NC}"
    npm run lintfix
    npm run format
    echo -e "${GREEN}✅ Code corrigé${NC}"
}

# Nettoyage
clean_project() {
    echo -e "${YELLOW}🧹 Nettoyage...${NC}"
    npm run clean
    rm -f *.tgz
    echo -e "${GREEN}✅ Nettoyage terminé${NC}"
}

# Package
package_project() {
    echo -e "${YELLOW}📦 Création du package...${NC}"
    npm run package
    echo -e "${GREEN}✅ Package créé: $(ls *.tgz 2>/dev/null || echo 'Erreur')${NC}"
}

# Lien npm local
link_local() {
    echo -e "${YELLOW}🔗 Création du lien npm local...${NC}"
    npm link
    echo -e "${GREEN}✅ Lien créé. Utilisez 'npm link n8n-nodes-prestashop8' dans votre projet n8n${NC}"
}

# Suppression du lien
unlink_local() {
    echo -e "${YELLOW}🔗 Suppression du lien npm...${NC}"
    npm unlink
    echo -e "${GREEN}✅ Lien supprimé${NC}"
}

# Statut du projet
show_status() {
    echo -e "${YELLOW}📊 Statut du projet${NC}"
    echo "===================="
    
    # Version Node.js
    echo -e "${BLUE}Node.js:${NC} $(node --version)"
    
    # Version npm
    echo -e "${BLUE}npm:${NC} $(npm --version)"
    
    # Taille du projet
    if [ -d "dist" ]; then
        echo -e "${BLUE}Dist:${NC} $(du -sh dist 2>/dev/null || echo 'N/A')"
    else
        echo -e "${BLUE}Dist:${NC} Non compilé"
    fi
    
    # Package npm
    if [ -f "*.tgz" ]; then
        echo -e "${BLUE}Package:${NC} $(ls *.tgz 2>/dev/null || echo 'Non créé')"
    else
        echo -e "${BLUE}Package:${NC} Non créé"
    fi
    
    # Dépendances
    echo -e "${BLUE}Dépendances:${NC} $(npm list --depth=0 2>/dev/null | grep -c "├──\|└──" || echo '0')"
    
    # Dernière modification
    echo -e "${BLUE}Dernière modif:${NC} $(stat -c %y package.json 2>/dev/null | cut -d' ' -f1 || echo 'N/A')"
}

# Workflow complet de développement
full_workflow() {
    echo -e "${YELLOW}🚀 Workflow complet de développement...${NC}"
    clean_project
    install_deps
    lint_code
    build_project
    run_tests
    package_project
    echo -e "${GREEN}🎉 Workflow terminé avec succès !${NC}"
}

# Traitement des arguments
case "${1:-help}" in
    "install")
        install_deps
        ;;
    "dev")
        dev_mode
        ;;
    "build")
        build_project
        ;;
    "test")
        run_tests
        ;;
    "lint")
        lint_code
        ;;
    "fix")
        fix_code
        ;;
    "clean")
        clean_project
        ;;
    "package")
        package_project
        ;;
    "link")
        link_local
        ;;
    "unlink")
        unlink_local
        ;;
    "status")
        show_status
        ;;
    "workflow"|"all")
        full_workflow
        ;;
    "help"|*)
        show_help
        ;;
esac

echo -e "${BLUE}Done! 🎯${NC}"
