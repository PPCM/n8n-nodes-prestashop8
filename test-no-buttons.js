#!/usr/bin/env node

/**
 * Test for No Buttons Structure - Direct display of sub-options  
 */

const fs = require('fs');
const path = require('path');

async function testNoButtons() {
  console.log('🎯 Testing No Buttons Structure\n');

  try {
    // Load the compiled node description
    const nodeDescription = require('./dist/nodes/PrestaShop8/PrestaShop8.node.description.js');
    const properties = nodeDescription.PrestaShop8Description.properties;
    
    // Find the Options collection
    const optionsProperty = properties.find(prop => prop.name === 'options');
    
    if (!optionsProperty) {
      console.log('❌ Options property not found');
      return false;
    }

    console.log('✅ Options property found');
    console.log('   Type:', optionsProperty.type);

    const options = optionsProperty.options;

    // Check Request option
    const requestOption = options.find(opt => opt.displayName === 'Request');
    if (!requestOption) {
      console.log('❌ Request option not found');
      return false;
    }
    
    if (requestOption.type !== 'collection') {
      console.log('❌ Request should be type "collection" to avoid buttons');
      return false;
    }

    console.log('✅ Request is type "collection" (no buttons)');
    console.log('   Sub-options:');
    requestOption.options.forEach(opt => {
      console.log(`   - ${opt.displayName} (${opt.name})`);
    });

    // Check Response option
    const responseOption = options.find(opt => opt.displayName === 'Response');
    if (!responseOption) {
      console.log('❌ Response option not found');
      return false;
    }
    
    if (responseOption.type !== 'collection') {
      console.log('❌ Response should be type "collection" to avoid buttons');
      return false;
    }

    console.log('✅ Response is type "collection" (no buttons)');
    console.log('   Sub-options:');
    responseOption.options.forEach(opt => {
      console.log(`   - ${opt.displayName} (${opt.name})`);
    });

    // Test parameter paths in compiled code
    console.log('\n🔧 Testing simplified parameter paths in compiled code:');
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

    // Verify no fixedCollection paths remain
    const oldFixedPaths = [
      '.requestOptions.',
      '.responseOptions.'
    ];

    console.log('\n🗑️  Checking old fixedCollection paths are removed:');
    for (const oldPath of oldFixedPaths) {
      if (nodeContent.includes(oldPath)) {
        console.log(`❌ Old fixedCollection path still present: ${oldPath}`);
        return false;
      }
    }
    console.log('✅ All old fixedCollection paths removed');

    console.log('\n🎯 Final Structure (No Buttons):');
    console.log('   Options/');
    console.log('   ├── Request (collection - direct display)');
    console.log('   │   ├── Show Request Info');
    console.log('   │   └── Show Request URL');
    console.log('   ├── Response (collection - direct display)');
    console.log('   │   ├── Include Response Headers and Status');
    console.log('   │   ├── Never Error');
    console.log('   │   └── Raw Mode');
    console.log('   └── Timeout (ms)');
    
    console.log('\n✅ Perfect no-buttons structure achieved!');
    console.log('   ✅ Request and Response are simple collections');
    console.log('   ✅ Sub-options display directly without buttons');
    console.log('   ✅ No "Choose..." buttons');
    console.log('   ✅ Simplified parameter paths');
    console.log('   ✅ Clean direct access UI');
    
    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testNoButtons()
    .then(success => {
      if (success) {
        console.log('\n🎉 No-buttons structure perfectly implemented!');
        process.exit(0);
      } else {
        console.log('\n💥 No-buttons structure validation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testNoButtons };
