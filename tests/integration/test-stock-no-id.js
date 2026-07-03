#!/usr/bin/env node

/**
 * Test to verify stock_availables does NOT include ID field in XML
 */

const utils = require('../dist/nodes/PrestaShop8/utils.js');

console.log('🧪 Test: stock_availables sans champ ID dans le XML\n');

let allTestsPassed = true;

// Test 1: XML pour stock_availables ne doit PAS contenir <id>
console.log('🔍 Test 1: Vérification absence champ ID dans XML stock_availables');
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
    '<out_of_stock><![CDATA[2]]></out_of_stock>'
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
  
  // Vérifier que le champ ID n'est PAS présent
  if (xml.includes('<id>')) {
    console.log('  ❌ ERREUR: Le champ <id> est présent dans le XML (il ne devrait pas y être)');
    console.log('     Le XML contient:', xml.match(/<id>.*?<\/id>/g));
    allTestsPassed = false;
  } else {
    console.log('  ✅ CORRECT: Le champ <id> est absent du XML (comme attendu)');
  }
  
  if (allFieldsPresent) {
    console.log('✅ Tous les champs requis présents');
  }
  
} catch (error) {
  console.log('❌ Erreur lors de la génération XML:', error.message);
  allTestsPassed = false;
}

// Test 2: XML pour une autre ressource DOIT contenir <id>
console.log('\n🔍 Test 2: Vérification présence champ ID pour ressource products');
try {
  const testFields = [
    { name: 'name-1', value: 'Test Product' },
    { name: 'price', value: '29.99' }
  ];
  
  const xml = utils.buildUpdateXml('products', '123', testFields);
  
  if (xml.includes('<id><![CDATA[123]]></id>')) {
    console.log('  ✅ Champ <id> présent pour products (correct)');
  } else {
    console.log('  ❌ Champ <id> absent pour products (incorrect)');
    allTestsPassed = false;
  }
  
} catch (error) {
  console.log('❌ Erreur:', error.message);
  allTestsPassed = false;
}

// Test 3: Comparaison directe des deux XMLs
console.log('\n🔍 Test 3: Comparaison structure XML');

const stockXml = utils.buildUpdateXml('stock_availables', '999', [
  { name: 'quantity', value: '100' }
]);

const productXml = utils.buildUpdateXml('products', '999', [
  { name: 'price', value: '100' }
]);

console.log('\nStructure pour stock_availables:');
console.log('  <stock_available>');
console.log('    <quantity>...');
console.log('    [PAS de <id>]');
console.log('  </stock_available>');

console.log('\nStructure pour products:');
console.log('  <product>');
console.log('    <price>...');
console.log('    <id>999</id>');
console.log('  </product>');

const stockHasId = stockXml.includes('<id>');
const productHasId = productXml.includes('<id>');

if (!stockHasId && productHasId) {
  console.log('\n✅ Structures XML correctes:');
  console.log('   - stock_availables: SANS <id> ✓');
  console.log('   - products: AVEC <id> ✓');
} else {
  console.log('\n❌ Problème de structure XML:');
  console.log(`   - stock_availables: ${stockHasId ? 'AVEC <id> (incorrect!)' : 'SANS <id> ✓'}`);
  console.log(`   - products: ${productHasId ? 'AVEC <id> ✓' : 'SANS <id> (incorrect!)'}`);
  allTestsPassed = false;
}

// Résumé
console.log('\n📊 Résumé de l\'implémentation stock_availables:');
console.log('');
console.log('Interface utilisateur:');
console.log('  • Champ "ID" standard: MASQUÉ pour stock_availables Update');
console.log('  • Champ "Stock Available ID": AFFICHÉ (pour URL API)');
console.log('  • Champs obligatoires: id_product, id_product_attribute, quantity, etc.');
console.log('');
console.log('Génération XML:');
console.log('  • Champ <id> exclu du XML pour stock_availables');
console.log('  • Tous les champs obligatoires inclus dans le XML');
console.log('  • ID utilisé uniquement dans l\'URL de la requête API');
console.log('');
console.log('URL API générée:');
console.log('  PUT /api/stock_availables/[Stock Available ID]');
console.log('  Body XML: sans <id>, avec tous les champs requis');

if (allTestsPassed) {
  console.log('\n🎉 Tous les tests sont passés!');
  console.log('Le champ ID a été correctement retiré du XML pour stock_availables.');
  process.exit(0);
} else {
  console.log('\n💥 Certains tests ont échoué!');
  process.exit(1);
}
