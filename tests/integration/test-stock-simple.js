#!/usr/bin/env node

/**
 * Test to verify stock_availables works like other resources with only ID + Fields to Update
 */

const fieldMappings = require('../dist/nodes/PrestaShop8/fieldMappings.js');
const utils = require('../dist/nodes/PrestaShop8/utils.js');

console.log('🧪 Test: stock_availables avec configuration simplifiée\n');

let allTestsPassed = true;

// Test 1: Vérifier qu'il n'y a pas de mappings dédiés
console.log('🔍 Test 1: Vérification absence de mappings dédiés pour stock_availables');
const stockMappings = fieldMappings.getFieldMappingsForResource('stock_availables');

if (stockMappings === null || stockMappings === undefined) {
  console.log('✅ Aucun mapping dédié pour stock_availables (correct)');
} else {
  console.log('❌ Des mappings dédiés existent encore pour stock_availables');
  console.log('   Mappings trouvés:', stockMappings);
  allTestsPassed = false;
}

// Test 2: Vérifier la génération XML avec uniquement Fields to Update
console.log('\n🔍 Test 2: Génération XML avec Fields to Update manuel');
try {
  // Simulation de ce que l'utilisateur entrerait manuellement
  const manualFields = [
    { name: 'id_product', value: '15' },
    { name: 'id_product_attribute', value: '0' },
    { name: 'quantity', value: '250' },
    { name: 'depends_on_stock', value: '0' },
    { name: 'out_of_stock', value: '2' }
  ];
  
  const xml = utils.buildUpdateXml('stock_availables', '42', manualFields);
  
  console.log('XML généré avec champs manuels:');
  console.log(xml);
  console.log('');
  
  // Vérifier que tous les champs sont présents
  const expectedFields = [
    '<id_product><![CDATA[15]]></id_product>',
    '<id_product_attribute><![CDATA[0]]></id_product_attribute>',
    '<quantity><![CDATA[250]]></quantity>',
    '<depends_on_stock><![CDATA[0]]></depends_on_stock>',
    '<out_of_stock><![CDATA[2]]></out_of_stock>',
    '<id><![CDATA[42]]></id>'
  ];
  
  let allPresent = true;
  for (const expected of expectedFields) {
    if (xml.includes(expected)) {
      console.log(`  ✅ ${expected}`);
    } else {
      console.log(`  ❌ Manquant: ${expected}`);
      allPresent = false;
      allTestsPassed = false;
    }
  }
  
  if (allPresent) {
    console.log('✅ Tous les champs manuels correctement inclus dans le XML');
  }
} catch (error) {
  console.log('❌ Erreur:', error.message);
  allTestsPassed = false;
}

// Test 3: Vérifier avec champs minimaux
console.log('\n🔍 Test 3: Génération XML avec champs minimaux');
try {
  const minimalFields = [
    { name: 'quantity', value: '100' }
  ];
  
  const xml = utils.buildUpdateXml('stock_availables', '99', minimalFields);
  
  if (xml.includes('<quantity><![CDATA[100]]></quantity>') &&
      xml.includes('<id><![CDATA[99]]></id>')) {
    console.log('✅ XML minimal fonctionnel');
  } else {
    console.log('❌ Problème avec XML minimal');
    allTestsPassed = false;
  }
} catch (error) {
  console.log('❌ Erreur:', error.message);
  allTestsPassed = false;
}

// Test 4: Comparaison avec autre ressource
console.log('\n🔍 Test 4: Comparaison comportement avec ressource products');

const stockXml = utils.buildUpdateXml('stock_availables', '123', [
  { name: 'quantity', value: '50' }
]);

const productXml = utils.buildUpdateXml('products', '123', [
  { name: 'price', value: '50' }
]);

console.log('\nStructure stock_availables:');
console.log('  - Champs: manuels via "Fields to Update"');
console.log('  - ID: inclus dans XML');
console.log('  - Comportement: identique aux autres ressources');

console.log('\nStructure products:');
console.log('  - Champs: manuels via "Fields to Update"');
console.log('  - ID: inclus dans XML');
console.log('  - Comportement: identique aux autres ressources');

if (stockXml.includes('<id>') && productXml.includes('<id>')) {
  console.log('\n✅ Comportement cohérent entre toutes les ressources');
} else {
  console.log('\n❌ Comportement incohérent');
  allTestsPassed = false;
}

// Résumé
console.log('\n📊 Configuration finale stock_availables:');
console.log('');
console.log('Interface utilisateur (Update):');
console.log('  ✅ Champ "ID" - Requis (identique aux autres ressources)');
console.log('  ✅ "Fields to Update" - Pour tous les champs (manuel)');
console.log('  ❌ Pas de champs obligatoires dédiés');
console.log('');
console.log('Utilisation:');
console.log('  1. Fournir l\'ID du stock_available à mettre à jour');
console.log('  2. Ajouter les champs manuellement via "Fields to Update":');
console.log('     - id_product');
console.log('     - id_product_attribute');
console.log('     - quantity');
console.log('     - depends_on_stock');
console.log('     - out_of_stock');
console.log('     - [tout autre champ PrestaShop]');
console.log('');
console.log('Génération XML:');
console.log('  ✅ Champ <id> inclus');
console.log('  ✅ Tous les champs de "Fields to Update" inclus');
console.log('  ✅ Structure standard PrestaShop');
console.log('');
console.log('Avantages:');
console.log('  • Flexibilité totale sur les champs à mettre à jour');
console.log('  • Comportement cohérent avec toutes les ressources');
console.log('  • Pas de validation stricte sur les champs obligatoires');
console.log('  • Support de tous les champs PrestaShop stock_availables');

if (allTestsPassed) {
  console.log('\n🎉 Tous les tests sont passés!');
  console.log('stock_availables fonctionne maintenant comme les autres ressources.');
  console.log('Seulement ID requis, tous les autres champs via "Fields to Update".');
  process.exit(0);
} else {
  console.log('\n💥 Certains tests ont échoué!');
  process.exit(1);
}
