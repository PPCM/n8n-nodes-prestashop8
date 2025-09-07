#!/usr/bin/env node

const axios = require('axios');

// Configuration de test (remplacez par vos vraies valeurs)
const config = {
  baseUrl: 'https://votre-boutique.com/api', // Remplacez par votre URL
  apiKey: 'VOTRE_API_KEY' // Remplacez par votre clé API
};

async function testRawMode() {
  console.log('🧪 Test du Raw Mode PrestaShop...\n');

  try {
    // Test 1: Sans Output-Format (devrait renvoyer XML)
    console.log('📡 Test 1: Sans Output-Format header');
    const response1 = await axios.get(`${config.baseUrl}/products`, {
      auth: {
        username: config.apiKey,
        password: ''
      },
      transformResponse: (data) => data, // Garde la réponse brute
      timeout: 30000
    });
    
    console.log('Headers envoyés:', response1.config.headers);
    console.log('Type de réponse:', typeof response1.data);
    console.log('Début de la réponse:', response1.data.substring(0, 200));
    console.log('---\n');

    // Test 2: Avec Output-Format JSON
    console.log('📡 Test 2: Avec Output-Format: JSON');
    const response2 = await axios.get(`${config.baseUrl}/products`, {
      auth: {
        username: config.apiKey,
        password: ''
      },
      headers: {
        'Output-Format': 'JSON'
      },
      transformResponse: (data) => data, // Garde la réponse brute
      timeout: 30000
    });
    
    console.log('Headers envoyés:', response2.config.headers);
    console.log('Type de réponse:', typeof response2.data);
    console.log('Début de la réponse:', response2.data.substring(0, 200));
    console.log('---\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n⚠️  Pour utiliser ce script:');
    console.log('1. Installez axios: npm install axios');
    console.log('2. Modifiez config.baseUrl et config.apiKey');
    console.log('3. Relancez: node debug-raw-mode.js');
  }
}

testRawMode();
