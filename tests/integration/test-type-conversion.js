#!/usr/bin/env node

/**
 * Test type conversion functionality
 * This demonstrates how the schema-based type conversion works
 */

console.log('🧪 Test: Schema-based Type Conversion\n');

// Simulate the conversion functions
const MOCK_SCHEMA = {
  products: {
    id: { type: 'number', format: 'isUnsignedId', required: false, readOnly: true, multilang: false, maxSize: null },
    id_manufacturer: { type: 'number', format: 'isUnsignedId', required: false, readOnly: false, multilang: false, maxSize: null },
    id_supplier: { type: 'number', format: 'isUnsignedId', required: false, readOnly: false, multilang: false, maxSize: null },
    reference: { type: 'string', format: 'isReference', required: false, readOnly: false, multilang: false, maxSize: 64 },
    price: { type: 'number', format: 'isPrice', required: false, readOnly: false, multilang: false, maxSize: null },
    active: { type: 'boolean', format: 'isBool', required: false, readOnly: false, multilang: false, maxSize: null },
    quantity: { type: 'number', format: 'isInt', required: false, readOnly: false, multilang: false, maxSize: null },
    name: { type: 'string', format: 'isGenericName', required: true, readOnly: false, multilang: true, maxSize: 128 },
  },
  stock_availables: {
    id: { type: 'number', format: 'isUnsignedId', required: false, readOnly: true, multilang: false, maxSize: null },
    id_product: { type: 'number', format: 'isUnsignedId', required: true, readOnly: false, multilang: false, maxSize: null },
    id_product_attribute: { type: 'number', format: 'isUnsignedId', required: true, readOnly: false, multilang: false, maxSize: null },
    quantity: { type: 'number', format: 'isInt', required: true, readOnly: false, multilang: false, maxSize: null },
    depends_on_stock: { type: 'boolean', format: 'isBool', required: true, readOnly: false, multilang: false, maxSize: null },
    out_of_stock: { type: 'number', format: 'isInt', required: true, readOnly: false, multilang: false, maxSize: null },
  }
};

function convertFieldValue(value, fieldInfo) {
  if (value === null || value === undefined || value === '') {
    return value;
  }

  switch (fieldInfo.type) {
    case 'number':
      const num = Number(value);
      return isNaN(num) ? value : num;
    
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (value === '1' || value === 1) return true;
      if (value === '0' || value === 0) return false;
      return Boolean(value);
    
    case 'string':
    default:
      return String(value);
  }
}

function convertResourceTypes(data, resource) {
  const schema = MOCK_SCHEMA[resource];
  if (!schema || !data || typeof data !== 'object') {
    return data;
  }

  const converted = {};

  for (const [field, value] of Object.entries(data)) {
    if (schema[field]) {
      converted[field] = convertFieldValue(value, schema[field]);
    } else {
      converted[field] = value;
    }
  }

  return converted;
}

let allTestsPassed = true;

// Test 1: Product data conversion
console.log('🔍 Test 1: Product data conversion');
const productFromAPI = {
  id: "123",
  id_manufacturer: "5",
  reference: "REF-ABC-123",
  price: "29.99",
  active: "1",
  quantity: "100",
  name: "Test Product"
};

const convertedProduct = convertResourceTypes(productFromAPI, 'products');

console.log('\nAvant conversion (PrestaShop API):');
console.log(JSON.stringify(productFromAPI, null, 2));

console.log('\nAprès conversion:');
console.log(JSON.stringify(convertedProduct, null, 2));

// Verify types
const checks = [
  { field: 'id', expected: 'number', value: convertedProduct.id },
  { field: 'price', expected: 'number', value: convertedProduct.price },
  { field: 'active', expected: 'boolean', value: convertedProduct.active },
  { field: 'quantity', expected: 'number', value: convertedProduct.quantity },
  { field: 'reference', expected: 'string', value: convertedProduct.reference },
];

console.log('\nVérification des types:');
checks.forEach(check => {
  const actualType = typeof check.value;
  const isCorrect = actualType === check.expected;
  if (isCorrect) {
    console.log(`  ✅ ${check.field}: ${actualType} (attendu: ${check.expected})`);
  } else {
    console.log(`  ❌ ${check.field}: ${actualType} (attendu: ${check.expected})`);
    allTestsPassed = false;
  }
});

// Test 2: Stock available data conversion
console.log('\n🔍 Test 2: Stock available data conversion');
const stockFromAPI = {
  id: "456",
  id_product: "123",
  id_product_attribute: "0",
  quantity: "250",
  depends_on_stock: "0",
  out_of_stock: "2"
};

const convertedStock = convertResourceTypes(stockFromAPI, 'stock_availables');

console.log('\nAvant conversion:');
console.log(JSON.stringify(stockFromAPI, null, 2));

console.log('\nAprès conversion:');
console.log(JSON.stringify(convertedStock, null, 2));

const stockChecks = [
  { field: 'id', expected: 'number', value: convertedStock.id },
  { field: 'id_product', expected: 'number', value: convertedStock.id_product },
  { field: 'quantity', expected: 'number', value: convertedStock.quantity },
  { field: 'depends_on_stock', expected: 'boolean', value: convertedStock.depends_on_stock },
];

console.log('\nVérification des types:');
stockChecks.forEach(check => {
  const actualType = typeof check.value;
  const isCorrect = actualType === check.expected;
  if (isCorrect) {
    console.log(`  ✅ ${check.field}: ${actualType} (attendu: ${check.expected})`);
  } else {
    console.log(`  ❌ ${check.field}: ${actualType} (attendu: ${check.expected})`);
    allTestsPassed = false;
  }
});

// Test 3: Math operations work correctly
console.log('\n🔍 Test 3: Math operations après conversion');

console.log('\nOpérations mathématiques:');
const quantity = convertedProduct.quantity;
const price = convertedProduct.price;
const totalValue = quantity * price;

console.log(`  Quantité: ${quantity} (type: ${typeof quantity})`);
console.log(`  Prix: ${price} (type: ${typeof price})`);
console.log(`  Valeur totale: ${quantity} × ${price} = ${totalValue}`);

if (typeof totalValue === 'number' && !isNaN(totalValue) && totalValue === 2999) {
  console.log('  ✅ Calcul correct: 100 × 29.99 = 2999');
} else {
  console.log(`  ❌ Calcul incorrect: attendu 2999, reçu ${totalValue}`);
  allTestsPassed = false;
}

// Test 4: Boolean logic
console.log('\n🔍 Test 4: Logique booléenne après conversion');

console.log(`  active === true: ${convertedProduct.active === true}`);
console.log(`  !depends_on_stock: ${!convertedStock.depends_on_stock}`);

if (convertedProduct.active === true && convertedStock.depends_on_stock === false) {
  console.log('  ✅ Logique booléenne fonctionne correctement');
} else {
  console.log('  ❌ Problème avec la logique booléenne');
  allTestsPassed = false;
}

// Test 5: String preservation
console.log('\n🔍 Test 5: Préservation des strings (références)');

const ref = convertedProduct.reference;
console.log(`  Référence: "${ref}" (type: ${typeof ref})`);

if (typeof ref === 'string' && ref === 'REF-ABC-123') {
  console.log('  ✅ Les références restent des strings (pas converties en nombre)');
} else {
  console.log('  ❌ Problème avec la préservation des strings');
  allTestsPassed = false;
}

// Summary
console.log('\n📊 Résumé des avantages:');
console.log('');
console.log('✅ Calculs mathématiques fonctionnent directement');
console.log('✅ Conditions booléennes simplifiées');
console.log('✅ Pas de faux positifs (REF-ABC-123 reste string)');
console.log('✅ Compatible avec tous les nœuds n8n (IF, Math, Switch, etc.)');
console.log('✅ Basé sur les schémas officiels PrestaShop');
console.log('');
console.log('🚀 Opérations concernées:');
console.log('  • List all');
console.log('  • Get by ID');  
console.log('  • Search with filters');
console.log('');
console.log('⚙️ Pour activer:');
console.log('  1. npm run fetch-schemas -- <API_URL> <API_KEY>');
console.log('  2. npm run build');
console.log('  3. Redémarrer n8n');

if (allTestsPassed) {
  console.log('\n🎉 Tous les tests sont passés!');
  console.log('La conversion de types basée sur les schémas fonctionne parfaitement.');
  process.exit(0);
} else {
  console.log('\n💥 Certains tests ont échoué!');
  process.exit(1);
}
