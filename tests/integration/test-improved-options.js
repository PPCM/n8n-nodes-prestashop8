#!/usr/bin/env node

/**
 * Test for Improved Options Structure - Flat Collection without Choose buttons
 */

const fs = require('fs');
const path = require('path');

async function testImprovedOptions() {
  console.log('🎯 Testing Improved Options Structure\n');

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
    console.log('   Placeholder:', optionsProperty.placeholder);

    // Verify it's a simple collection (not fixedCollection)
    if (optionsProperty.type !== 'collection') {
      console.log('❌ Options should be type "collection"');
      return false;
    }
    
    console.log('✅ Options is correctly a simple collection');

    // Check all expected options are present at the same level
    const expectedOptions = [
      'timeout',
      'showRequestUrl', 
      'showRequestInfo',
      'rawMode',
      'includeResponseHeaders',
      'neverError'
    ];

    console.log('\n📋 Checking individual options:');
    
    for (const expectedOption of expectedOptions) {
      const option = optionsProperty.options.find(opt => opt.name === expectedOption);
      if (option) {
        console.log(`✅ ${option.displayName} (${expectedOption})`);
      } else {
        console.log(`❌ Missing option: ${expectedOption}`);
        return false;
      }
    }

    // Verify no fixedCollection structures remain
    const hasFixedCollections = optionsProperty.options.some(opt => opt.type === 'fixedCollection');
    if (hasFixedCollections) {
      console.log('❌ Found unwanted fixedCollection structures');
      return false;
    }
    
    console.log('✅ No unwanted fixedCollection structures found');

    // Test parameter paths in compiled code
    console.log('\n🔧 Testing parameter paths in compiled code:');
    const nodeContent = fs.readFileSync(path.join(__dirname, 'dist', 'nodes', 'PrestaShop8', 'PrestaShop8.node.js'), 'utf8');
    
    const expectedPaths = [
      "getNodeParameter('options.timeout'",
      "getNodeParameter('options.rawMode'",
      "getNodeParameter('options.neverError'", 
      "getNodeParameter('options.includeResponseHeaders'",
      "getNodeParameter('options.showRequestUrl'",
      "getNodeParameter('options.showRequestInfo'"
    ];

    for (const path of expectedPaths) {
      if (nodeContent.includes(path)) {
        console.log(`✅ ${path})`);
      } else {
        console.log(`❌ Missing: ${path})`);
        return false;
      }
    }

    // Verify old complex paths are removed
    const oldComplexPaths = [
      'options.request.requestOptions',
      'options.response.responseOptions',
      'debugOptions.'
    ];

    console.log('\n🗑️  Checking old paths are removed:');
    for (const oldPath of oldComplexPaths) {
      if (nodeContent.includes(oldPath)) {
        console.log(`❌ Old path still present: ${oldPath}`);
        return false;
      }
    }
    console.log('✅ All old complex paths removed');

    console.log('\n🎯 Final Structure Summary:');
    console.log('   Options/');
    optionsProperty.options.forEach(opt => {
      console.log(`   ├── ${opt.displayName}`);
    });
    
    console.log('\n✅ All improvements completed successfully!');
    console.log('   ✅ Timeout reintegrated into Options');
    console.log('   ✅ No more "Choose..." buttons (fixedCollection removed)');
    console.log('   ✅ Flat, simple structure like HTTP Request node');
    console.log('   ✅ All parameter paths simplified');
    
    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testImprovedOptions()
    .then(success => {
      if (success) {
        console.log('\n🎉 All improvements validated successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Some improvements failed validation!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testImprovedOptions };
