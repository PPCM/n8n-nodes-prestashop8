#!/usr/bin/env node

/**
 * Test for stock_availables required fields validation
 */

const fieldMappings = require('./dist/nodes/PrestaShop8/fieldMappings.js');
const utils = require('./dist/nodes/PrestaShop8/utils.js');

console.log('🧪 Test des champs stock_availables\n');

let allTestsPassed = true;

// Test 1: Vérifier les mappings de champs
console.log('🔍 Test 1: Vérification des mappings de champs');
const stockMappings = fieldMappings.getFieldMappingsForResource('stock_availables');

if (stockMappings) {
  console.log('✅ Mappings trouvés pour stock_availables');
  
  const expectedMappings = {
    stockProductId: 'id_product',
    stockProductAttributeId: 'id_product_attribute',
    stockQuantity: 'quantity',
    stockDependsOnStock: 'depends_on_stock',
    stockOutOfStock: 'out_of_stock'
  };
  
  let allMappingsCorrect = true;
  for (const [inputName, expectedField] of Object.entries(expectedMappings)) {
    if (stockMappings[inputName] === expectedField) {
      console.log(`  ✅ ${inputName} → ${expectedField}`);
    } else {
      console.log(`  ❌ ${inputName}: attendu "${expectedField}", reçu "${stockMappings[inputName]}"`);
      allMappingsCorrect = false;
      allTestsPassed = false;
    }
  }
  
  if (allMappingsCorrect) {
    console.log('✅ Tous les mappings sont corrects');
  }
} else {
  console.log('❌ Aucun mapping trouvé pour stock_availables');
  allTestsPassed = false;
}

// Test 2: Vérifier les champs requis
console.log('\n🔍 Test 2: Vérification des champs requis');
const requiredFields = utils.REQUIRED_FIELDS_BY_RESOURCE['stock_availables'];

if (requiredFields) {
  console.log('✅ Champs requis définis:', requiredFields.join(', '));
  
  const expectedRequired = ['id_product', 'id_product_attribute', 'quantity', 'depends_on_stock', 'out_of_stock'];
  const missingFields = expectedRequired.filter(f => !requiredFields.includes(f));
  const extraFields = requiredFields.filter(f => !expectedRequired.includes(f));
  
  if (missingFields.length === 0 && extraFields.length === 0) {
    console.log('✅ Tous les champs requis sont présents et corrects');
  } else {
    if (missingFields.length > 0) {
      console.log('❌ Champs manquants:', missingFields.join(', '));
      allTestsPassed = false;
    }
    if (extraFields.length > 0) {
      console.log('⚠️  Champs supplémentaires:', extraFields.join(', '));
    }
  }
} else {
  console.log('❌ Aucun champ requis défini pour stock_availables');
  allTestsPassed = false;
}

// Test 3: Générer un XML de test pour stock_availables
console.log('\n🔍 Test 3: Génération XML pour stock_availables');
try {
  const testFields = [
    { name: 'id_product', value: '15' },
    { name: 'id_product_attribute', value: '0' },
    { name: 'quantity', value: '250' },
    { name: 'depends_on_stock', value: '0' },
    { name: 'out_of_stock', value: '2' }
  ];
  
  const xml = utils.buildUpdateXml('stock_availables', '42', testFields);
  
  // Vérifier que le XML contient tous les champs
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
  
  if (allFieldsPresent) {
    console.log('✅ XML généré correctement avec tous les champs');
  }
  
  // Vérifier la structure XML
  if (xml.includes('<stock_available>') && xml.includes('</stock_available>')) {
    console.log('✅ Structure XML correcte (utilise stock_available au singulier)');
  } else {
    console.log('❌ Structure XML incorrecte');
    allTestsPassed = false;
  }
  
} catch (error) {
  console.log('❌ Erreur lors de la génération XML:', error.message);
  allTestsPassed = false;
}

// Test 4: Valider la conversion des types numériques
console.log('\n🔍 Test 4: Conversion des types numériques');
try {
  const numericFields = [
    { name: 'id_product', value: 15 },  // Number
    { name: 'quantity', value: '100' }  // String
  ];
  
  // Cette fonction buildUpdateXml doit accepter des nombres
  const xml = utils.buildUpdateXml('stock_availables', 99, numericFields);
  
  if (xml.includes('<id_product><![CDATA[15]]></id_product>') &&
      xml.includes('<quantity><![CDATA[100]]></quantity>') &&
      xml.includes('<id><![CDATA[99]]></id>')) {
    console.log('✅ Conversion des types numériques correcte');
  } else {
    console.log('❌ Problème avec la conversion des types numériques');
    console.log('XML généré:', xml);
    allTestsPassed = false;
  }
} catch (error) {
  console.log('❌ Erreur avec les types numériques:', error.message);
  allTestsPassed = false;
}

// Résumé final
console.log('\n📊 Résumé des fonctionnalités stock_availables:');
console.log('');
console.log('Champs obligatoires disponibles:');
console.log('  • Product ID (id_product) - Type: Number');
console.log('  • Product Attribute ID (id_product_attribute) - Type: Number');
console.log('  • Quantity (quantity) - Type: Number');
console.log('  • Depends On Stock (depends_on_stock) - Type: Bool (0/1)');
console.log('  • Out Of Stock (out_of_stock) - Type: Int (0=Deny, 1=Allow, 2=Default)');
console.log('');
console.log('Opérations supportées:');
console.log('  ✅ Update - Mettre à jour les stocks');
console.log('  ✅ List - Lister tous les stocks');
console.log('  ✅ Get By ID - Récupérer un stock spécifique');
console.log('  ✅ Search - Rechercher avec filtres');
console.log('  ❌ Create - Non supporté par PrestaShop');
console.log('  ❌ Delete - Non supporté par PrestaShop');

if (allTestsPassed) {
  console.log('\n🎉 Tous les tests sont passés avec succès!');
  console.log('Les champs stock_availables sont correctement configurés.');
  process.exit(0);
} else {
  console.log('\n💥 Certains tests ont échoué!');
  process.exit(1);
}
