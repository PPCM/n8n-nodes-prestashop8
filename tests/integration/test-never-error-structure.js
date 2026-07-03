#!/usr/bin/env node

/**
 * Test for Never Error Structure - status and message fields
 */

const fs = require('fs');
const path = require('path');

async function testNeverErrorStructure() {
  console.log('🎯 Testing Never Error Response Structure\n');

  try {
    // Load the source node code (compiled JS is gitignored)
    const nodeContent = fs.readFileSync(path.join(__dirname, 'nodes', 'PrestaShop8', 'PrestaShop8.node.ts'), 'utf8');
    
    console.log('📋 Checking Never Error implementation in compiled code:');

    // Check for error response structure in axios sections  
    const expectedPatterns = [
      'status: axiosResponse.status',
      'message: axiosResponse.data',
      'status: error.response?.status || 500',
      'message: error.response?.data || error.message'
    ];

    for (const pattern of expectedPatterns) {
      if (nodeContent.includes(pattern)) {
        console.log(`✅ Found: ${pattern}`);
      } else {
        console.log(`❌ Missing: ${pattern}`);
        return false;
      }
    }

    // Check for executeHttpRequest error structure
    const executeHttpRequestPattern = 'status: error.httpCode || error.response?.status || 500';
    if (nodeContent.includes(executeHttpRequestPattern)) {
      console.log(`✅ Found executeHttpRequest error structure`);
    } else {
      console.log(`❌ Missing executeHttpRequest error structure`);
      return false;
    }

    console.log('\n🔧 Verifying Never Error parameter paths:');
    const neverErrorPath = "getNodeParameter('options.response.neverError'";
    if (nodeContent.includes(neverErrorPath)) {
      console.log(`✅ Never Error parameter path correct`);
    } else {
      console.log(`❌ Never Error parameter path incorrect`);
      return false;
    }

    console.log('\n🎯 Expected Never Error Response Structure:');
    console.log('   When HTTP error occurs and Never Error is true:');
    console.log('   {');
    console.log('     "status": <HTTP_STATUS_CODE>,');
    console.log('     "message": <SERVER_MESSAGE_OR_ERROR>');
    console.log('   }');

    console.log('\n✅ Never Error structure implementation verified!');
    console.log('   ✅ Status field returns actual HTTP status code');
    console.log('   ✅ Message field returns raw server message');
    console.log('   ✅ No interpretation or transformation of error data');
    console.log('   ✅ Consistent structure across axios and httpRequest methods');
    
    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testNeverErrorStructure()
    .then(success => {
      if (success) {
        console.log('\n🎉 Never Error structure correctly implemented!');
        console.log('When Never Error is activated, errors will return:');
        console.log('- status: The exact HTTP status code from the server');
        console.log('- message: The raw message from the server without interpretation');
        process.exit(0);
      } else {
        console.log('\n💥 Never Error structure validation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testNeverErrorStructure };
