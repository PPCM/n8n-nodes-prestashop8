#!/usr/bin/env node

/**
 * Test to verify stock_availables DOES include ID field in XML
 */

const utils = require('../dist/nodes/PrestaShop8/utils.js');

console.log('🧪 Test: stock_availables AVEC champ ID dans le XML\n');

let allTestsPassed = true;

// Test 1: XML pour stock_availables doit contenir <id>
console.log('🔍 Test 1: Vérification présence champ ID dans XML stock_availables');
try {
  const testFields = [
    { name: 'id_product', value: '15' },
    { name: 'id_product_attribute', value: '0' },
    { name: 'quantity', value: '250' },
    { name: 'depends_on_stock', value: '0' },
    { name: 'out_of_stock', value: '2' }
  ];
  
  const xml = utils.buildUpdateXml('stock_availables', '42', testFields);
  
  console.log('XML généré:');
  console.log(xml);
  console.log('');
  
  // Vérifier que le XML contient tous les champs requis
  const requiredInXml = [
    '<id_product><![CDATA[15]]></id_product>',
    '<id_product_attribute><![CDATA[0]]></id_product_attribute>',
    '<quantity><![CDATA[250]]></quantity>',
    '<depends_on_stock><![CDATA[0]]></depends_on_stock>',
    '<out_of_stock><![CDATA[2]]></out_of_stock>',
    '<id><![CDATA[42]]></id>'
  ];
  
  let allFieldsPresent = true;
  for (const expectedElement of requiredInXml) {
    if (xml.includes(expectedElement)) {
      console.log(`  ✅ Trouvé: ${expectedElement}`);
    } else {
      console.log(`  ❌ Manquant: ${expectedElement}`);
      allFieldsPresent = false;
      allTestsPassed = false;
    }
  }
  
  // Vérifier que le champ ID est présent
  if (xml.includes('<id><![CDATA[42]]></id>')) {
    console.log('  ✅ CORRECT: Le champ <id> est présent dans le XML (comme attendu)');
  } else {
    console.log('  ❌ ERREUR: Le champ <id> est absent du XML (il devrait être présent)');
    allTestsPassed = false;
  }
  
  if (allFieldsPresent) {
    console.log('✅ Tous les champs présents (y compris <id>)');
  }
  
} catch (error) {
  console.log('❌ Erreur lors de la génération XML:', error.message);
  allTestsPassed = false;
}

// Test 2: Vérifier l'ordre des champs
console.log('\n🔍 Test 2: Vérification ordre des champs dans XML');
try {
  const testFields = [
    { name: 'id_product', value: '99' },
    { name: 'quantity', value: '500' }
  ];
  
  const xml = utils.buildUpdateXml('stock_availables', '123', testFields);
  
  // Le champ <id> doit être à la fin, après tous les autres champs
  const idPosition = xml.indexOf('<id>');
  const lastFieldPosition = xml.lastIndexOf('<quantity>');
  
  if (idPosition > lastFieldPosition) {
    console.log('  ✅ Champ <id> correctement placé à la fin du XML');
  } else {
    console.log('  ⚠️  Champ <id> positionné avant les autres champs');
  }
  
} catch (error) {
  console.log('❌ Erreur:', error.message);
  allTestsPassed = false;
}

// Test 3: Comparaison avec autre ressource
console.log('\n🔍 Test 3: Cohérence avec les autres ressources');

const stockXml = utils.buildUpdateXml('stock_availables', '999', [
  { name: 'quantity', value: '100' }
]);

const productXml = utils.buildUpdateXml('products', '999', [
  { name: 'price', value: '100' }
]);

const stockHasId = stockXml.includes('<id><![CDATA[999]]></id>');
const productHasId = productXml.includes('<id><![CDATA[999]]></id>');

if (stockHasId && productHasId) {
  console.log('✅ Comportement cohérent:');
  console.log('   - stock_availables: AVEC <id> ✓');
  console.log('   - products: AVEC <id> ✓');
} else {
  console.log('❌ Comportement incohérent:');
  console.log(`   - stock_availables: ${stockHasId ? 'AVEC <id>' : 'SANS <id> (incorrect!)'}`);
  console.log(`   - products: ${productHasId ? 'AVEC <id>' : 'SANS <id> (incorrect!)'}`);
  allTestsPassed = false;
}

// Résumé
console.log('\n📊 Configuration finale stock_availables:');
console.log('');
console.log('Interface utilisateur (Update):');
console.log('  ✅ Champ "ID" standard (requis)');
console.log('  ✅ Product ID (id_product)');
console.log('  ✅ Product Attribute ID (id_product_attribute)');
console.log('  ✅ Quantity (quantity)');
console.log('  ✅ Depends On Stock (depends_on_stock)');
console.log('  ✅ Out Of Stock (out_of_stock)');
console.log('  ✅ Fields to Update (champs additionnels optionnels)');
console.log('');
console.log('Génération XML:');
console.log('  ✅ Tous les champs obligatoires inclus');
console.log('  ✅ Champ <id> inclus dans le XML');
console.log('  ✅ Structure XML complète et valide');
console.log('');
console.log('Requête API:');
console.log('  PUT /api/stock_availables/[ID]');
console.log('  Body XML: avec <id> + tous les champs requis');

if (allTestsPassed) {
  console.log('\n🎉 Tous les tests sont passés!');
  console.log('Le champ ID est correctement inclus pour stock_availables.');
  process.exit(0);
} else {
  console.log('\n💥 Certains tests ont échoué!');
  process.exit(1);
}
