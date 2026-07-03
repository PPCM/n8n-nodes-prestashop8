#!/usr/bin/env node

/**
 * Test for Flat Options Structure - All options at the same level
 */

const fs = require('fs');
const path = require('path');

async function testFlatOptions() {
  console.log('🎯 Testing Flat Options Structure\n');

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

    // Verify it's a simple collection
    if (optionsProperty.type !== 'collection') {
      console.log('❌ Options should be type "collection"');
      return false;
    }

    // Check all options are at the same level (no nested collections)
    const options = optionsProperty.options;
    const hasNestedCollections = options.some(opt => opt.type === 'collection' || opt.type === 'fixedCollection');
    
    if (hasNestedCollections) {
      console.log('❌ Found nested collections - options should be flat');
      return false;
    }
    
    console.log('✅ All options are at the same level (flat structure)');

    // Check expected options are present (alphabetical order)
    const expectedOptions = [
      'Include Response Headers and Status',
      'Never Error',
      'Raw Mode', 
      'Show Request Info',
      'Show Request URL',
      'Timeout (ms)'
    ];

    console.log('\n📋 Checking options in alphabetical order:');
    
    for (let i = 0; i < expectedOptions.length; i++) {
      const option = options[i];
      if (option && option.displayName === expectedOptions[i]) {
        console.log(`✅ ${i + 1}. ${option.displayName} (${option.name})`);
      } else {
        console.log(`❌ Expected "${expectedOptions[i]}" at position ${i + 1}, got "${option?.displayName}"`);
        return false;
      }
    }

    // Test parameter paths in compiled code
    console.log('\n🔧 Testing flat parameter paths in compiled code:');
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

    // Verify no old nested paths remain
    const oldNestedPaths = [
      'options.request.',
      'options.response.'
    ];

    console.log('\n🗑️  Checking old nested paths are removed:');
    for (const oldPath of oldNestedPaths) {
      if (nodeContent.includes(oldPath)) {
        console.log(`❌ Old nested path still present: ${oldPath}`);
        return false;
      }
    }
    console.log('✅ All old nested paths removed');

    console.log('\n🎯 Final Flat Structure:');
    console.log('   Options/');
    options.forEach((opt, index) => {
      console.log(`   ${index === options.length - 1 ? '└──' : '├──'} ${opt.displayName}`);
    });
    
    console.log('\n✅ Perfect flat structure achieved!');
    console.log('   ✅ No sub-menus or nested collections');
    console.log('   ✅ All options directly accessible');
    console.log('   ✅ Alphabetical organization');
    console.log('   ✅ Simple parameter paths');
    console.log('   ✅ Clean user interface');
    
    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testFlatOptions()
    .then(success => {
      if (success) {
        console.log('\n🎉 Flat options structure perfectly implemented!');
        process.exit(0);
      } else {
        console.log('\n💥 Flat structure validation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testFlatOptions };
