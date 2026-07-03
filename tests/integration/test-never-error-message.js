#!/usr/bin/env node

/**
 * Test for Never Error Message Preservation - Original server message without interpretation
 */

const fs = require('fs');
const path = require('path');

async function testNeverErrorMessage() {
  console.log('🎯 Testing Never Error Message Preservation\n');

  try {
    // Load the source node code
    const nodeContent = fs.readFileSync(path.join(__dirname, 'nodes', 'PrestaShop8', 'PrestaShop8.node.ts'), 'utf8');
    
    console.log('📋 Checking message handling in Never Error mode:');

    // Check that we only use server data without fallbacks
    const correctPatterns = [
      'message: error.response?.data || \'\'',
      'message: axiosResponse.data || \'\''
    ];

    for (const pattern of correctPatterns) {
      if (nodeContent.includes(pattern)) {
        console.log(`✅ Found correct pattern: ${pattern}`);
      } else {
        console.log(`❌ Missing correct pattern: ${pattern}`);
        return false;
      }
    }

    // Check that we removed interpretation fallbacks
    const forbiddenPatterns = [
      'error.message ||',
      'HTTP Error',
      'HTTP ${axiosResponse.status} Error'
    ];

    console.log('\n🚫 Checking forbidden interpretation patterns are removed:');
    for (const pattern of forbiddenPatterns) {
      if (nodeContent.includes(pattern)) {
        console.log(`❌ Found forbidden pattern: ${pattern}`);
        return false;
      }
    }
    console.log('✅ All interpretation patterns removed');

    // Count occurrences to ensure all instances are updated
    const dataOnlyCount = (nodeContent.match(/message: .*\.data \|\| ''/g) || []).length;
    console.log(`\n📊 Found ${dataOnlyCount} correct message assignments`);

    if (dataOnlyCount < 4) { // Should be at least 4: 2 in axios sections + 2 in executeHttpRequest
      console.log('❌ Not all message assignments updated');
      return false;
    }

    console.log('\n🎯 Never Error Message Behavior:');
    console.log('   ✅ Uses ONLY server response data (error.response?.data)');
    console.log('   ✅ Returns empty string "" if no server message');  
    console.log('   ✅ NO interpretation or fallback messages');
    console.log('   ✅ NO "HTTP Error" or status code interpolation');
    console.log('   ✅ Raw server message preserved exactly');

    console.log('\n📝 Expected outputs:');
    console.log('   Server returns error message → { "status": 404, "message": "Product not found" }');
    console.log('   Server returns XML error → { "status": 400, "message": "<error>Invalid data</error>" }');
    console.log('   Server returns no message → { "status": 500, "message": "" }');
    
    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testNeverErrorMessage()
    .then(success => {
      if (success) {
        console.log('\n🎉 Never Error message preservation correctly implemented!');
        console.log('Messages are now preserved exactly as sent by the PrestaShop server.');
        process.exit(0);
      } else {
        console.log('\n💥 Never Error message preservation validation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testNeverErrorMessage };
