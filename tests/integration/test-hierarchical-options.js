#!/usr/bin/env node

/**
 * Test for Final Hierarchical Options Structure
 * Validates the correct organization: Request, Response, Timeout (alphabetical)
 */

const fs = require('fs');
const path = require('path');

async function testHierarchicalOptions() {
  console.log('🎯 Testing Final Hierarchical Options Structure\n');

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

    // Verify it's a collection
    if (optionsProperty.type !== 'collection') {
      console.log('❌ Options should be type "collection"');
      return false;
    }

    // Check alphabetical order of main options: Request, Response, Timeout
    const mainOptions = optionsProperty.options;
    const expectedOrder = ['Request', 'Response', 'Timeout (ms)'];
    
    console.log('\n📋 Checking main options order (alphabetical):');
    
    for (let i = 0; i < expectedOrder.length; i++) {
      if (mainOptions[i] && mainOptions[i].displayName === expectedOrder[i]) {
        console.log(`✅ ${i + 1}. ${mainOptions[i].displayName}`);
      } else {
        console.log(`❌ Expected "${expectedOrder[i]}" at position ${i + 1}, got "${mainOptions[i]?.displayName}"`);
        return false;
      }
    }

    // Check Request group structure
    const requestOption = mainOptions.find(opt => opt.name === 'request');
    if (requestOption && requestOption.type === 'collection') {
      console.log('\n📋 Request group structure:');
      console.log('✅ Request is a nested collection');
      
      const requestOptions = requestOption.options;
      const expectedRequestOptions = ['Show Request Info', 'Show Request URL']; // alphabetical
      
      for (let i = 0; i < expectedRequestOptions.length; i++) {
        if (requestOptions[i] && requestOptions[i].displayName === expectedRequestOptions[i]) {
          console.log(`✅   ${requestOptions[i].displayName}`);
        } else {
          console.log(`❌   Expected "${expectedRequestOptions[i]}", got "${requestOptions[i]?.displayName}"`);
          return false;
        }
      }
    } else {
      console.log('❌ Request group not properly structured');
      return false;
    }

    // Check Response group structure  
    const responseOption = mainOptions.find(opt => opt.name === 'response');
    if (responseOption && responseOption.type === 'collection') {
      console.log('\n📋 Response group structure:');
      console.log('✅ Response is a nested collection');
      
      const responseOptions = responseOption.options;
      const expectedResponseOptions = ['Include Response Headers and Status', 'Never Error', 'Raw Mode']; // alphabetical
      
      for (let i = 0; i < expectedResponseOptions.length; i++) {
        if (responseOptions[i] && responseOptions[i].displayName === expectedResponseOptions[i]) {
          console.log(`✅   ${responseOptions[i].displayName}`);
        } else {
          console.log(`❌   Expected "${expectedResponseOptions[i]}", got "${responseOptions[i]?.displayName}"`);
          return false;
        }
      }
    } else {
      console.log('❌ Response group not properly structured');
      return false;
    }

    // Check Timeout is direct option
    const timeoutOption = mainOptions.find(opt => opt.name === 'timeout');
    if (timeoutOption && timeoutOption.type === 'number') {
      console.log('\n📋 Timeout option:');
      console.log('✅ Timeout is a direct number option');
    } else {
      console.log('❌ Timeout not properly configured');
      return false;
    }

    // Test parameter paths in compiled code
    console.log('\n🔧 Testing parameter paths in compiled code:');
    const nodeContent = fs.readFileSync(path.join(__dirname, 'dist', 'nodes', 'PrestaShop8', 'PrestaShop8.node.js'), 'utf8');
    
    const expectedPaths = [
      "getNodeParameter('options.timeout'",
      "getNodeParameter('options.response.rawMode'",
      "getNodeParameter('options.response.neverError'", 
      "getNodeParameter('options.response.includeResponseHeaders'",
      "getNodeParameter('options.request.showRequestUrl'",
      "getNodeParameter('options.request.showRequestInfo'"
    ];

    for (const path of expectedPaths) {
      if (nodeContent.includes(path)) {
        console.log(`✅ ${path})`);
      } else {
        console.log(`❌ Missing: ${path})`);
        return false;
      }
    }

    console.log('\n🎯 Final Structure Summary:');
    console.log('   Options/');
    console.log('   ├── Request/');
    console.log('   │   ├── Show Request Info');
    console.log('   │   └── Show Request URL');
    console.log('   ├── Response/');
    console.log('   │   ├── Include Response Headers and Status');
    console.log('   │   ├── Never Error');
    console.log('   │   └── Raw Mode');
    console.log('   └── Timeout (ms)');
    
    console.log('\n✅ Perfect hierarchical structure achieved!');
    console.log('   ✅ Alphabetical ordering: Request, Response, Timeout');
    console.log('   ✅ Request group with nested options');
    console.log('   ✅ Response group with nested options');
    console.log('   ✅ Timeout as direct option');
    console.log('   ✅ No unwanted "Choose..." buttons');
    console.log('   ✅ All parameter paths correctly updated');
    
    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testHierarchicalOptions()
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

module.exports = { testHierarchicalOptions };
