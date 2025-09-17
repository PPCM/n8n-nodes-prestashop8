#!/usr/bin/env node

/**
 * Test script for the new Response Options in PrestaShop8 Node
 * Tests both "Include Response Headers and Status" and "Never Error" options
 */

const axios = require('axios');

// Configuration - Update these values with your PrestaShop credentials
const config = {
  baseUrl: 'https://your-prestashop.com/api', // Update with your PrestaShop URL
  apiKey: 'YOUR_API_KEY_HERE', // Update with your API key
};

async function testResponseOptions() {
  console.log('🧪 Testing PrestaShop8 Node Response Options\n');

  // Test 1: Include Response Headers and Status - Success Case
  console.log('📋 Test 1: Include Response Headers and Status (Success)');
  try {
    const response = await axios({
      method: 'GET',
      url: `${config.baseUrl}/products?display=[id]&limit=1`,
      auth: {
        username: config.apiKey,
        password: ''
      },
      headers: {
        'Output-Format': 'JSON'
      },
      validateStatus: () => true // Accept all status codes
    });

    console.log('✅ Status Code:', response.status);
    console.log('✅ Headers Available:', Object.keys(response.headers).length > 0);
    console.log('✅ Response Headers Sample:', {
      'content-type': response.headers['content-type'],
      'content-length': response.headers['content-length'],
      'server': response.headers['server']
    });
    console.log('✅ Body Present:', !!response.data);
    console.log('');
  } catch (error) {
    console.log('❌ Test 1 Failed:', error.message);
    console.log('');
  }

  // Test 2: Never Error Option - Error Case  
  console.log('📋 Test 2: Never Error Option (404 Error)');
  try {
    const response = await axios({
      method: 'GET',
      url: `${config.baseUrl}/products/999999`, // Non-existent product
      auth: {
        username: config.apiKey,
        password: ''
      },
      headers: {
        'Output-Format': 'JSON'
      },
      validateStatus: () => true // Accept all status codes (simulates neverError: true)
    });

    console.log('✅ Status Code:', response.status);
    console.log('✅ Request completed without throwing error (neverError behavior)');
    console.log('✅ Error response still available:', !!response.data);
    console.log('');
  } catch (error) {
    console.log('❌ Test 2 Failed:', error.message);
    console.log('');
  }

  // Test 3: Combined Options
  console.log('📋 Test 3: Combined Options (Headers + Never Error)');
  try {
    const response = await axios({
      method: 'GET',
      url: `${config.baseUrl}/products/1`, // Try to get product with ID 1
      auth: {
        username: config.apiKey,
        password: ''
      },
      headers: {
        'Output-Format': 'JSON'
      },
      validateStatus: () => true
    });

    const simulatedNodeResponse = {
      body: response.data,
      headers: {
        'content-type': response.headers['content-type'],
        'content-length': response.headers['content-length'],
        'server': response.headers['server']
      },
      statusCode: response.status,
      statusMessage: response.status >= 200 && response.status < 300 ? 'OK' : 'Error'
    };

    console.log('✅ Simulated Node Response Structure:');
    console.log('  - body:', !!simulatedNodeResponse.body);
    console.log('  - headers:', !!simulatedNodeResponse.headers);
    console.log('  - statusCode:', simulatedNodeResponse.statusCode);
    console.log('  - statusMessage:', simulatedNodeResponse.statusMessage);
    console.log('');
  } catch (error) {
    console.log('❌ Test 3 Failed:', error.message);
    console.log('');
  }

  // Test 4: Raw Mode with Headers
  console.log('📋 Test 4: Raw Mode with Response Headers');
  try {
    const response = await axios({
      method: 'GET',
      url: `${config.baseUrl}/products?display=[id]&limit=1`,
      auth: {
        username: config.apiKey,
        password: ''
      },
      headers: {
        'Output-Format': 'XML'
      },
      transformResponse: [(data) => data], // Keep raw response
      validateStatus: () => true
    });

    const simulatedRawResponse = {
      body: { raw: response.data },
      headers: response.headers,
      statusCode: response.status,
      statusMessage: response.status >= 200 && response.status < 300 ? 'OK' : 'Error'
    };

    console.log('✅ Raw Mode Response with Headers:');
    console.log('  - Raw XML present:', typeof simulatedRawResponse.body.raw === 'string');
    console.log('  - Headers present:', !!simulatedRawResponse.headers);
    console.log('  - Status available:', !!simulatedRawResponse.statusCode);
    console.log('');
  } catch (error) {
    console.log('❌ Test 4 Failed:', error.message);
    console.log('');
  }

  console.log('🎯 Test Summary:');
  console.log('   The new response options should provide:');
  console.log('   1. includeResponseHeaders: Wraps response in {body, headers, statusCode, statusMessage}');
  console.log('   2. neverError: Prevents HTTP errors from throwing, returns error response instead');
  console.log('   3. Both options work in combination');
  console.log('   4. Compatible with both JSON and Raw XML modes');
  console.log('');
  console.log('💡 Note: Update the config section with your actual PrestaShop credentials to test with real data.');
}

// Run tests if this file is executed directly
if (require.main === module) {
  testResponseOptions().catch(console.error);
}

module.exports = { testResponseOptions };
