#!/usr/bin/env node

/**
 * Test URL Construction for Search with Filters
 */

const fs = require('fs');
const path = require('path');

// Import the function to test
let buildUrlWithFilters;
try {
  const utils = require('../dist/nodes/PrestaShop8/utils.js');
  buildUrlWithFilters = utils.buildUrlWithFilters;
} catch (error) {
  console.log('⚠️  Compiled dist not found, testing will be done via code analysis');
}

async function testUrlConstruction() {
  console.log('🔗 Testing URL Construction for Search Filters\n');

  try {
    const baseUrl = 'https://example.com/api/products';
    
    // Test different filter scenarios
    const testCases = [
      {
        name: 'Simple equal filter',
        params: {
          'filter[name]': '[ProductName]',
          limit: '10'
        },
        expected: 'filter[name]=[ProductName]&limit=10&output_format=JSON'
      },
      {
        name: 'Multiple filters',
        params: {
          'filter[name]': '[Product]%',
          'filter[price]': '[10,50]',
          'filter[active]': '[1]',
          display: 'full'
        },
        expected: 'filter[name]=[Product]%&filter[price]=[10,50]&filter[active]=[1]&display=full&output_format=JSON'
      },
      {
        name: 'Empty filter (IS_EMPTY)',
        params: {
          'filter[description]': '[]',
          limit: '20'
        },
        expected: 'filter[description]=[]&limit=20&output_format=JSON'
      },
      {
        name: 'Not empty filter (IS_NOT_EMPTY)',
        params: {
          'filter[description]': '![]',
          sort: 'name_ASC'
        },
        expected: 'filter[description]=![]&sort=name_ASC&output_format=JSON'
      }
    ];

    console.log('📋 Testing URL construction logic:\n');

    if (buildUrlWithFilters) {
      console.log('✅ Using compiled buildUrlWithFilters function\n');
      
      for (const testCase of testCases) {
        const result = buildUrlWithFilters(baseUrl, testCase.params, false);
        const url = new URL(result);
        const actualParams = url.searchParams.toString();
        
        console.log(`🧪 ${testCase.name}:`);
        console.log(`   Input: ${JSON.stringify(testCase.params)}`);
        console.log(`   URL: ${result}`);
        console.log(`   Parameters: ${actualParams}`);
        
        // Check if all expected parameters are present
        const expectedParts = testCase.expected.split('&');
        let allMatch = true;
        
        for (const part of expectedParts) {
          if (!actualParams.includes(part)) {
            console.log(`   ❌ Missing: ${part}`);
            allMatch = false;
          }
        }
        
        if (allMatch) {
          console.log('   ✅ All parameters correctly included');
        }
        console.log('');
      }
    } else {
      console.log('📝 Analyzing source code structure:\n');
      
      // Check source code structure
      const utilsContent = fs.readFileSync(path.join(__dirname, 'nodes', 'PrestaShop8', 'utils.ts'), 'utf8');
      
      // Check if the function handles filter parameters correctly
      if (utilsContent.includes("key.startsWith('filter[')")) {
        console.log('✅ Function checks for filter[ parameters');
      } else {
        console.log('❌ Function does not handle filter[ parameters');
      }
      
      if (utilsContent.includes('params.append(key, String(value))')) {
        console.log('✅ Function appends filter parameters to URL');
      } else {
        console.log('❌ Function does not append filter parameters');
      }
      
      if (utilsContent.includes("params.append('output_format', 'JSON')")) {
        console.log('✅ Function adds output_format=JSON');
      } else {
        console.log('❌ Function missing output_format parameter');
      }
    }

    // Check node implementation
    console.log('🔧 Checking node search operation:\n');
    
    const nodeContent = fs.readFileSync(path.join(__dirname, 'nodes', 'PrestaShop8', 'PrestaShop8.node.ts'), 'utf8');
    
    // Check if filterParams is correctly constructed
    if (nodeContent.includes('const filterParams: Record<string, any> = {};')) {
      console.log('✅ filterParams object correctly initialized');
    } else {
      console.log('❌ filterParams object not found');
    }
    
    // Check if filterParams is merged into urlParams
    if (nodeContent.includes('...filterParams,')) {
      console.log('✅ filterParams correctly spread into urlParams');
    } else {
      console.log('❌ filterParams not merged into urlParams');
    }
    
    // Check if urlParams is passed to buildUrlWithFilters
    if (nodeContent.includes('buildUrlWithFilters(`${credentials.baseUrl}/${resource}`, urlParams, rawMode)')) {
      console.log('✅ urlParams correctly passed to buildUrlWithFilters');
    } else {
      console.log('❌ urlParams not passed to buildUrlWithFilters');
    }

    console.log('\n📝 Expected behavior:');
    console.log('1. Search operation collects filters into filterParams object');
    console.log('2. filterParams keys have format: filter[fieldname]');
    console.log('3. filterParams is spread into urlParams with other parameters');
    console.log('4. buildUrlWithFilters processes all parameters including filter[]');
    console.log('5. Final URL includes all filter parameters');

    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testUrlConstruction()
    .then(success => {
      if (success) {
        console.log('\n🎉 URL construction analysis completed!');
        console.log('Check the output above to verify filter parameters are properly included.');
        process.exit(0);
      } else {
        console.log('\n💥 URL construction test failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testUrlConstruction };
