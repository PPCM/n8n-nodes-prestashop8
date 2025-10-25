#!/usr/bin/env node

/**
 * Test to verify stock_availables resource is properly available
 */

const types = require('./dist/nodes/PrestaShop8/types.js');

console.log('🔍 Vérification de la ressource stock_availables\n');

// Check if stock_availables exists
const stockResource = types.PRESTASHOP_RESOURCES.stock_availables;

if (stockResource) {
  console.log('✅ Ressource stock_availables trouvée!\n');
  console.log('Détails:');
  console.log(`  - Nom API: ${stockResource.name}`);
  console.log(`  - Nom affiché: ${stockResource.displayName}`);
  console.log(`  - Description: ${stockResource.description}`);
  console.log(`  - Supports Create: ${stockResource.supportsCreate}`);
  console.log(`  - Supports Update: ${stockResource.supportsUpdate}`);
  console.log(`  - Supports Delete: ${stockResource.supportsDelete}`);
  console.log(`  - Supports List: ${stockResource.supportsList}`);
  console.log(`  - Supports GetById: ${stockResource.supportsGetById}`);
  console.log(`  - Supports Search: ${stockResource.supportsSearch}`);
} else {
  console.log('❌ Ressource stock_availables non trouvée!');
  process.exit(1);
}

// List all resources containing "stock"
console.log('\n📋 Toutes les ressources contenant "stock":');
Object.values(types.PRESTASHOP_RESOURCES)
  .filter(r => r.name.toLowerCase().includes('stock') || r.displayName.toLowerCase().includes('stock'))
  .forEach(r => {
    console.log(`  - ${r.displayName} (${r.name})`);
  });

// Show total count
const totalResources = Object.keys(types.PRESTASHOP_RESOURCES).length;
console.log(`\n📊 Total: ${totalResources} ressources disponibles`);

console.log('\n✅ Test terminé avec succès!');
