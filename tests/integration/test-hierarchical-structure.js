#!/usr/bin/env node

/**
 * Test for Hierarchical Options Structure - Request/Response/Timeout
 */

const fs = require('fs');
const path = require('path');

async function testHierarchicalStructure() {
  console.log('🎯 Testing Hierarchical Options Structure\n');

  try {
    // Load the compiled node description
    const nodeDescription = require('../dist/nodes/PrestaShop8/PrestaShop8.node.description.js');
    const properties = nodeDescription.PrestaShop8Description.properties;
    
    // Find the Options collection
    const optionsProperty = properties.find(prop => prop.name === 'options');
    
    if (!optionsProperty) {
      console.log('❌ Options property not found');
      return false;
    }

    console.log('✅ Options property found');
    console.log('   Type:', optionsProperty.type);

    if (optionsProperty.type !== 'collection') {
      console.log('❌ Options should be type "collection"');
      return false;
    }

    const options = optionsProperty.options;
    console.log('\n📋 Checking Options structure (alphabetical order):');

    // Expected structure (alphabetical order): Request, Response, Timeout
    const expectedOptions = ['Request', 'Response', 'Timeout (ms)'];
    
    if (options.length !== 3) {
      console.log(`❌ Expected 3 options, got ${options.length}`);
      return false;
    }

    // Check Request option
    const requestOption = options.find(opt => opt.displayName === 'Request');
    if (!requestOption) {
      console.log('❌ Request option not found');
      return false;
    }
    
    if (requestOption.type !== 'fixedCollection') {
      console.log('❌ Request should be type "fixedCollection"');
      return false;
    }

    console.log('✅ 1. Request (fixedCollection)');
    
    // Check Request sub-options
    const requestValues = requestOption.options[0].values;
    const expectedRequestOptions = ['Show Request Info', 'Show Request URL'];
    
    if (requestValues.length !== 2) {
      console.log(`❌ Request should have 2 sub-options, got ${requestValues.length}`);
      return false;
    }

    for (let i = 0; i < expectedRequestOptions.length; i++) {
      if (requestValues[i].displayName === expectedRequestOptions[i]) {
        console.log(`   ✅ ${requestValues[i].displayName}`);
      } else {
        console.log(`   ❌ Expected "${expectedRequestOptions[i]}", got "${requestValues[i].displayName}"`);
        return false;
      }
    }

    // Check Response option
    const responseOption = options.find(opt => opt.displayName === 'Response');
    if (!responseOption) {
      console.log('❌ Response option not found');
      return false;
    }
    
    if (responseOption.type !== 'fixedCollection') {
      console.log('❌ Response should be type "fixedCollection"');
      return false;
    }

    console.log('✅ 2. Response (fixedCollection)');
    
    // Check Response sub-options  
    const responseValues = responseOption.options[0].values;
    const expectedResponseOptions = ['Include Response Headers and Status', 'Never Error', 'Raw Mode'];
    
    if (responseValues.length !== 3) {
      console.log(`❌ Response should have 3 sub-options, got ${responseValues.length}`);
      return false;
    }

    for (let i = 0; i < expectedResponseOptions.length; i++) {
      if (responseValues[i].displayName === expectedResponseOptions[i]) {
        console.log(`   ✅ ${responseValues[i].displayName}`);
      } else {
        console.log(`   ❌ Expected "${expectedResponseOptions[i]}", got "${responseValues[i].displayName}"`);
        return false;
      }
    }

    // Check Timeout option
    const timeoutOption = options.find(opt => opt.displayName === 'Timeout (ms)');
    if (!timeoutOption) {
      console.log('❌ Timeout option not found');
      return false;
    }
    
    if (timeoutOption.type !== 'number') {
      console.log('❌ Timeout should be type "number"');
      return false;
    }

    console.log('✅ 3. Timeout (ms) (number)');

    // Test parameter paths in compiled code
    console.log('\n🔧 Testing hierarchical parameter paths in compiled code:');
    const nodeContent = fs.readFileSync(path.join(__dirname, 'dist', 'nodes', 'PrestaShop8', 'PrestaShop8.node.js'), 'utf8');
    
    const expectedPaths = [
      "getNodeParameter('options.timeout'",
      "getNodeParameter('options.response.responseOptions.rawMode'",
      "getNodeParameter('options.response.responseOptions.neverError'", 
      "getNodeParameter('options.response.responseOptions.includeResponseHeaders'",
      "getNodeParameter('options.request.requestOptions.showRequestUrl'",
      "getNodeParameter('options.request.requestOptions.showRequestInfo'"
    ];

    for (const path of expectedPaths) {
      if (nodeContent.includes(path)) {
        console.log(`✅ ${path})`);
      } else {
        console.log(`❌ Missing: ${path})`);
        return false;
      }
    }

    // Verify no old flat paths remain
    const oldFlatPaths = [
      "getNodeParameter('options.rawMode'",
      "getNodeParameter('options.neverError'",
      "getNodeParameter('options.includeResponseHeaders'",
      "getNodeParameter('options.showRequestUrl'",
      "getNodeParameter('options.showRequestInfo'"
    ];

    console.log('\n🗑️  Checking old flat paths are removed:');
    for (const oldPath of oldFlatPaths) {
      if (nodeContent.includes(oldPath)) {
        console.log(`❌ Old flat path still present: ${oldPath}`);
        return false;
      }
    }
    console.log('✅ All old flat paths removed');

    console.log('\n🎯 Final Hierarchical Structure:');
    console.log('   Options/');
    console.log('   ├── Request');
    console.log('   │   ├── Show Request Info');
    console.log('   │   └── Show Request URL');
    console.log('   ├── Response');
    console.log('   │   ├── Include Response Headers and Status');
    console.log('   │   ├── Never Error');
    console.log('   │   └── Raw Mode');
    console.log('   └── Timeout (ms)');
    
    console.log('\n✅ Perfect hierarchical structure achieved!');
    console.log('   ✅ Request and Response are fixedCollections');
    console.log('   ✅ Sub-options appear directly without buttons');
    console.log('   ✅ Alphabetical order maintained');
    console.log('   ✅ Correct parameter paths');
    console.log('   ✅ Clean hierarchical UI');
    
    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testHierarchicalStructure()
    .then(success => {
      if (success) {
        console.log('\n🎉 Hierarchical structure perfectly implemented!');
        process.exit(0);
      } else {
        console.log('\n💥 Hierarchical structure validation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testHierarchicalStructure };
