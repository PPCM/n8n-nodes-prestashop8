#!/usr/bin/env node

const https = require('https');

// Credentials are read from CLI args or environment — never hardcoded.
const apiUrl = process.argv[2] || process.env.PRESTASHOP_API_URL;
const apiKey = process.argv[3] || process.env.PRESTASHOP_API_KEY;

if (!apiUrl || !apiKey) {
  console.error('Usage: PRESTASHOP_API_URL=... PRESTASHOP_API_KEY=... node test-direct-key.js');
  process.exit(1);
}

console.log('🧪 Test avec clé DIRECTE (déjà en Base64)\n');

const url = new URL(`${apiUrl}/products`);
url.searchParams.append('schema', 'synopsis');
url.searchParams.append('output_format', 'JSON');

// Utiliser la clé DIRECTEMENT sans re-encoding
console.log('Auth:', `Basic ${apiKey.substring(0, 30)}...`);

const options = {
  headers: {
    'Authorization': `Basic ${apiKey}`,  // Directement!
    'Accept': 'application/json'
  }
};

const req = https.get(url.toString(), options, (res) => {
  console.log(`\nStatus: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ SUCCESS! La clé est DÉJÀ en Base64 final!');
      console.log('Data length:', data.length);
    } else {
      console.log('❌ FAILED');
      console.log('Response:', data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Error:', error.message);
});

req.end();
