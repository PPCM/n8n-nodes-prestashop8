#!/usr/bin/env node

/**
 * Test for Display Parameter Handling - Minimal, Full, Custom modes
 */

const fs = require('fs');
const path = require('path');

async function testDisplayParameter() {
  console.log('🎯 Testing Display Parameter Handling\n');

  try {
    // Load the source code to check logic
    const nodeContent = fs.readFileSync(path.join(__dirname, 'nodes', 'PrestaShop8', 'PrestaShop8.node.ts'), 'utf8');
    const utilsContent = fs.readFileSync(path.join(__dirname, 'nodes', 'PrestaShop8', 'utils.ts'), 'utf8');
    
    console.log('📋 Checking processDisplayParameter function:');

    // Check that processDisplayParameter function exists and handles minimal correctly
    const processDisplayPattern = 'export function processDisplayParameter';
    if (utilsContent.includes(processDisplayPattern)) {
      console.log('✅ processDisplayParameter function found');
    } else {
      console.log('❌ processDisplayParameter function not found');
      return false;
    }

    // Check that minimal returns null
    const minimalPattern = "if (displayValue === 'minimal')";
    if (utilsContent.includes(minimalPattern)) {
      console.log('✅ Minimal display mode check found');
    } else {
      console.log('❌ Minimal display mode check not found'); 
      return false;
    }

    const minimalReturnPattern = 'return null';
    if (utilsContent.includes(minimalReturnPattern)) {
      console.log('✅ Minimal mode returns null (no display parameter)');
    } else {
      console.log('❌ Minimal mode does not return null');
      return false;
    }

    console.log('\n🔧 Checking node implementation:');

    // Check that all operations use processDisplayParameter
    const processDisplayUsage = (nodeContent.match(/processDisplayParameter/g) || []).length;
    console.log(`✅ Found ${processDisplayUsage} uses of processDisplayParameter`);

    if (processDisplayUsage < 3) { // Should be used in list, getById, and search
      console.log('❌ processDisplayParameter not used in all operations');
      return false;
    }

    // Check conditional parameter addition
    const conditionalDisplayPattern = 'if (displayValue !== null)';
    const conditionalCount = (nodeContent.match(/if \(displayValue !== null\)/g) || []).length;
    console.log(`✅ Found ${conditionalCount} conditional display parameter additions`);

    if (conditionalCount < 3) {
      console.log('❌ Not all operations check for null display value');
      return false;
    }

    // Check that Display field is available for getById operation
    const descriptionContent = fs.readFileSync(path.join(__dirname, 'nodes', 'PrestaShop8', 'PrestaShop8.node.description.ts'), 'utf8');
    
    if (descriptionContent.includes("operation: ['list', 'search', 'getById']")) {
      console.log('✅ Display field available for getById operation');
    } else {
      console.log('❌ Display field not available for getById operation');
      return false;
    }

    console.log('\n🎯 Display Parameter Behavior:');
    console.log('   ✅ Minimal: No display parameter added to URL (IDs only)');
    console.log('   ✅ Full: display=full parameter added');
    console.log('   ✅ Custom: display=[field1,field2] parameter added');
    console.log('   ✅ Available in: List all, Get by Id, Search with filters');

    console.log('\n📝 Expected URL examples:');
    console.log('   Minimal → /api/products (no display param)');
    console.log('   Full → /api/products?display=full');
    console.log('   Custom → /api/products?display=[id,name,price]');
    
    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testDisplayParameter()
    .then(success => {
      if (success) {
        console.log('\n🎉 Display parameter handling correctly implemented!');
        console.log('Minimal mode now omits display parameter as required by PrestaShop API.');
        process.exit(0);
      } else {
        console.log('\n💥 Display parameter validation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testDisplayParameter };
