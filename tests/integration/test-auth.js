#!/usr/bin/env node

/**
 * Test authentication with PrestaShop API
 */

const https = require('https');
const http = require('http');

// Credentials are read from CLI args or environment — never hardcoded.
const apiUrl = process.argv[2] || process.env.PRESTASHOP_API_URL;
const apiKey = process.argv[3] || process.env.PRESTASHOP_API_KEY;

if (!apiUrl || !apiKey) {
  console.error('Usage: PRESTASHOP_API_URL=... PRESTASHOP_API_KEY=... node test-auth.js');
  console.error('   or: node test-auth.js <apiUrl> <apiKey>');
  process.exit(1);
}

console.log('🔐 Test d\'authentification PrestaShop\n');
console.log('URL:', apiUrl);
console.log('API Key (longueur):', apiKey.length);

// Test 1: Clé telle quelle (peut-être déjà encodée)
console.log('🧪 Test 1: Utiliser la clé directement (supposée déjà en Base64)');
testAuth(apiKey, 'Direct (Base64 supposé)');

// Test 2: Encoder la clé (comme le script fait)
console.log('\n🧪 Test 2: Encoder la clé avec Buffer.from');
const encodedKey = Buffer.from(`${apiKey}:`).toString('base64');
testAuth(encodedKey, 'Buffer encoded');

// Test 3: Décoder puis réencoder (au cas où c'est du double encoding)
console.log('\n🧪 Test 3: Décoder puis réencoder');
try {
  const decoded = Buffer.from(apiKey, 'base64').toString('utf-8');
  console.log('   Clé décodée:', decoded.substring(0, 30) + '...');
  
  // Si la clé décodée contient déjà ':', on la prend telle quelle
  if (decoded.includes(':')) {
    console.log('   ✓ La clé décodée contient déjà ":"');
    testAuth(apiKey, 'Already Base64 with colon');
  } else {
    // Sinon on ajoute ':' et on encode
    const reencoded = Buffer.from(`${decoded}:`).toString('base64');
    testAuth(reencoded, 'Decoded then re-encoded');
  }
} catch (e) {
  console.log('   ❌ Impossible de décoder en Base64');
}

function testAuth(authValue, description) {
  const url = new URL(`${apiUrl}/products`);
  url.searchParams.append('schema', 'synopsis');
  url.searchParams.append('output_format', 'JSON');
  url.searchParams.append('limit', '1');

  const protocol = url.protocol === 'https:' ? https : http;
  
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authValue}`,
      'Accept': 'application/json'
    }
  };

  console.log(`   Testing avec: ${description}`);
  console.log(`   Header: Authorization: Basic ${authValue.substring(0, 30)}...`);

  const req = protocol.get(url.toString(), options, (res) => {
    console.log(`   ✅ Status: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      console.log('   🎉 AUTHENTIFICATION RÉUSSIE !');
      console.log(`   👉 Utiliser cette valeur: ${authValue.substring(0, 40)}...`);
    } else if (res.statusCode === 401) {
      console.log('   ❌ ÉCHEC: 401 Unauthorized');
    } else {
      console.log(`   ⚠️  Statut inattendu: ${res.statusCode}`);
    }
    
    // Consommer la réponse
    res.on('data', () => {});
    res.on('end', () => {});
  });

  req.on('error', (error) => {
    console.log(`   ❌ Erreur: ${error.message}`);
  });

  req.end();
}

// Wait for all requests to complete
setTimeout(() => {
  console.log('\n✅ Tests terminés');
  process.exit(0);
}, 5000);
