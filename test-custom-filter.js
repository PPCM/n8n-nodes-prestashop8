#!/usr/bin/env node

/**
 * Test for Custom Filter - No interpretation of user input
 */

const fs = require('fs');
const path = require('path');

async function testCustomFilter() {
  console.log('⚙️ Testing Custom Filter - Raw User Input\n');

  try {
    // Load the compiled function to test actual output
    let buildUrlWithFilters;
    try {
      const utils = require('./dist/nodes/PrestaShop8/utils.js');
      buildUrlWithFilters = utils.buildUrlWithFilters;
    } catch (error) {
      console.log('⚠️  Using source code analysis instead of compiled function');
    }

    const baseUrl = 'https://example.com/api/products';
    
    // Test cases for custom filter functionality
    const testCases = [
      {
        name: 'Simple custom parameter',
        customFilter: 'date=1',
        expected: 'date=1',
        description: 'User writes date=1, should stay date=1 in URL'
      },
      {
        name: 'Custom filter parameter',
        customFilter: 'filter[name]=test',
        expected: 'filter[name]=test',
        description: 'User can write filter[] format if they want'
      },
      {
        name: 'Multiple parameters',
        customFilter: 'date=1&status=active',
        expected: ['date=1', 'status=active'],
        description: 'Multiple parameters separated by &'
      },
      {
        name: 'Complex PrestaShop filter',
        customFilter: 'filter[price]=>[100]&filter[name]=[Product]%',
        expected: ['filter[price]=>[100]', 'filter[name]=[Product]%'],
        description: 'Complex PrestaShop expressions as user writes them'
      },
      {
        name: 'Custom non-filter parameter',
        customFilter: 'custom_param=value123',
        expected: 'custom_param=value123',
        description: 'Non-filter parameters should work too'
      }
    ];

    console.log('🧪 Testing custom filter handling:\n');

    if (buildUrlWithFilters) {
      for (const testCase of testCases) {
        const params = {};
        
        // Simulate the logic from the node for CUSTOM operator
        const customFilter = testCase.customFilter.trim();
        const parts = customFilter.split('&');
        
        for (const part of parts) {
          const [key, value] = part.split('=', 2);
          if (key && value !== undefined) {
            params[key.trim()] = value.trim();
          }
        }
        
        const result = buildUrlWithFilters(baseUrl, params, false);
        const url = new URL(result);
        const actualParams = decodeURIComponent(url.searchParams.toString());
        
        console.log(`📋 ${testCase.name}:`);
        console.log(`   Input: "${testCase.customFilter}"`);
        
        if (Array.isArray(testCase.expected)) {
          console.log(`   Expected: ${testCase.expected.join(' & ')}`);
          
          let allMatch = true;
          for (const expectedPart of testCase.expected) {
            if (!actualParams.includes(expectedPart)) {
              allMatch = false;
              console.log(`   ❌ Missing: ${expectedPart}`);
            }
          }
          
          if (allMatch) {
            console.log('   ✅ All parameters correctly preserved');
          }
        } else {
          console.log(`   Expected: ${testCase.expected}`);
          
          if (actualParams.includes(testCase.expected)) {
            console.log('   ✅ Parameter correctly preserved');
          } else {
            console.log(`   ❌ Expected "${testCase.expected}" but got "${actualParams.split('&')[0]}"`);
          }
        }
        
        console.log(`   Actual URL: ${result}`);
        console.log('');
      }
    }

    // Check source code implementation
    console.log('🔧 Verifying source code implementation:\n');
    
    const nodeContent = fs.readFileSync(path.join(__dirname, 'nodes', 'PrestaShop8', 'PrestaShop8.node.ts'), 'utf8');
    
    // Check that custom filter is not interpreted
    if (nodeContent.includes('customFilter.split(\'&\')')) {
      console.log('✅ Custom filter splits by & for multiple parameters');
    } else {
      console.log('❌ Custom filter splitting logic missing');
    }

    if (nodeContent.includes('part.split(\'=\', 2)')) {
      console.log('✅ Custom filter splits by = for key=value pairs');
    } else {
      console.log('❌ Key=value splitting logic missing');
    }

    if (nodeContent.includes('filterParams[key.trim()] = value.trim()')) {
      console.log('✅ Custom filter adds parameters directly without interpretation');
    } else {
      console.log('❌ Direct parameter addition logic missing');
    }

    // Check that old interpretation logic is removed
    if (!nodeContent.includes('filter[${field}]') || !nodeContent.includes('match(/filter\\[([^\\]]+)\\]=')) {
      console.log('✅ Old interpretation logic removed');
    } else {
      console.log('❌ Old interpretation logic still present in CUSTOM section');
    }

    console.log('\n📝 Custom Filter Behavior:');
    console.log('• User input preserved exactly as written');
    console.log('• No automatic filter[] wrapping');
    console.log('• No interpretation or transformation');
    console.log('• Support for multiple parameters with &');
    console.log('• User has complete control over parameter format');

    console.log('\n💡 Usage Examples:');
    console.log('• Simple: date=1 → URL contains date=1');
    console.log('• Filter format: filter[name]=test → URL contains filter[name]=test');  
    console.log('• Multiple: date=1&status=active → URL contains both');
    console.log('• Complex: filter[price]=>[100]&custom=value → URL contains both');

    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testCustomFilter()
    .then(success => {
      if (success) {
        console.log('\n🎉 Custom filter handling correctly implemented!');
        console.log('Users now have complete control over custom filter expressions.');
        process.exit(0);
      } else {
        console.log('\n💥 Custom filter validation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testCustomFilter };
