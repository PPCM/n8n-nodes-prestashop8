#!/usr/bin/env node

const https = require('https');

// Credentials are read from CLI args or environment — never hardcoded.
const apiUrl = process.argv[2] || process.env.PRESTASHOP_API_URL;
const apiKey = process.argv[3] || process.env.PRESTASHOP_API_KEY;

if (!apiUrl || !apiKey) {
  console.error('Usage: PRESTASHOP_API_URL=... PRESTASHOP_API_KEY=... node test-single-schema.js');
  console.error('   or: node test-single-schema.js <apiUrl> <apiKey>');
  process.exit(1);
}

console.log('🧪 Test schéma products seul\n');

const url = new URL(`${apiUrl}/products`);
url.searchParams.append('schema', 'synopsis');
url.searchParams.append('output_format', 'JSON');

const auth = Buffer.from(`${apiKey}:`).toString('base64');

console.log('URL:', url.toString());
console.log('Auth:', `Basic ${auth.substring(0, 30)}...`);
console.log('');

const options = {
  headers: {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json'
  }
};

const req = https.get(url.toString(), options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('\n✅ SUCCESS!');
      console.log('Data length:', data.length);
      console.log('First 200 chars:', data.substring(0, 200));
    } else {
      console.log('\n❌ FAILED');
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Error:', error.message);
});

req.end();
