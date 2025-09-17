// Test pour diagnostiquer le problème d'authentification PrestaShop
const axios = require('axios');

async function testCredentials() {
  console.log('🔧 DIAGNOSTIC TEST CREDENTIALS PRESTASHOP');
  console.log('='.repeat(50));
  
  // Configuration de test (remplacez par vos vraies credentials)
  const baseUrl = 'https://your-store.com/api'; // Remplacez par votre URL
  const apiKey = 'YOUR_API_KEY_HERE'; // Remplacez par votre clé API
  
  if (baseUrl === 'https://your-store.com/api' || apiKey === 'YOUR_API_KEY_HERE') {
    console.log('❌ Veuillez configurer vos credentials dans le fichier test-credentials.js');
    return;
  }
  
  console.log('🔍 Test 1: Configuration basique');
  console.log('Base URL:', baseUrl);
  console.log('API Key:', apiKey.substring(0, 8) + '...');
  
  // Test exactement comme le fait n8n credentials
  console.log('\n🔍 Test 2: Requête comme n8n credentials test');
  try {
    const response = await axios({
      method: 'GET',
      baseURL: baseUrl,
      url: '/',
      auth: {
        username: apiKey,
        password: '',
      },
      headers: {
        'Output-Format': 'JSON',
      },
      timeout: 30000
    });
    
    console.log('✅ Test credentials réussi !');
    console.log('Status:', response.status);
    console.log('Response type:', typeof response.data);
    console.log('Response keys:', Object.keys(response.data || {}));
    
  } catch (error) {
    console.log('❌ Test credentials échoué');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response statusText:', error.response.statusText);
      console.log('Response headers:', error.response.headers);
      console.log('Response data:', error.response.data);
    }
    
    if (error.request) {
      console.log('Request config:', {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers,
        auth: error.config?.auth
      });
    }
  }
  
  // Test avec headers différents
  console.log('\n🔍 Test 3: Sans header Output-Format');
  try {
    const response = await axios({
      method: 'GET',
      baseURL: baseUrl,
      url: '/',
      auth: {
        username: apiKey,
        password: '',
      },
      timeout: 30000
    });
    
    console.log('✅ Test sans Output-Format réussi !');
    console.log('Status:', response.status);
    
  } catch (error) {
    console.log('❌ Test sans Output-Format échoué');
    console.log('Error:', error.message);
  }
  
  // Test avec XML explicite
  console.log('\n🔍 Test 4: Avec Output-Format XML');
  try {
    const response = await axios({
      method: 'GET',
      baseURL: baseUrl,
      url: '/',
      auth: {
        username: apiKey,
        password: '',
      },
      headers: {
        'Output-Format': 'XML',
      },
      timeout: 30000
    });
    
    console.log('✅ Test XML réussi !');
    console.log('Status:', response.status);
    
  } catch (error) {
    console.log('❌ Test XML échoué');
    console.log('Error:', error.message);
  }
  
  console.log('\n💡 CONSEILS DE DÉPANNAGE:');
  console.log('1. Vérifiez que l\'URL se termine par /api');
  console.log('2. Vérifiez que la clé API est activée dans PrestaShop');
  console.log('3. Vérifiez les permissions de la clé API');
  console.log('4. Testez manuellement: curl -u "API_KEY:" "URL/api/"');
}

// Lancer le test
testCredentials().catch(console.error);
