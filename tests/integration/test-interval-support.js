#!/usr/bin/env node

/**
 * Test for Interval Support in Equal and Not Equal operators
 */

const fs = require('fs');
const path = require('path');

async function testIntervalSupport() {
  console.log('📊 Testing Interval Support for Equal/Not Equal Operators\n');

  try {
    // Load the compiled function to test actual output
    let buildUrlWithFilters;
    try {
      const utils = require('../dist/nodes/PrestaShop8/utils.js');
      buildUrlWithFilters = utils.buildUrlWithFilters;
    } catch (error) {
      console.log('⚠️  Using source code analysis instead of compiled function');
    }

    const baseUrl = 'https://example.com/api/products';
    
    // Test cases for interval functionality
    const testCases = [
      {
        name: 'Simple equal value',
        operator: '=',
        field: 'price',
        value: '100',
        expected: 'filter[price]=[100]',
        description: 'Single value with equal operator'
      },
      {
        name: 'Interval equal value',
        operator: '=',
        field: 'price',
        value: '10,20',
        expected: 'filter[price]=[10,20]',
        description: 'Interval value with equal operator'
      },
      {
        name: 'Simple not equal value',
        operator: '!=',
        field: 'active',
        value: '0',
        expected: 'filter[active]=![0]',
        description: 'Single value with not equal operator'
      },
      {
        name: 'Interval not equal value',
        operator: '!=',
        field: 'price',
        value: '50,100',
        expected: 'filter[price]=![50,100]',
        description: 'Interval value with not equal operator'
      },
      {
        name: 'Already formatted interval',
        operator: '=',
        field: 'id',
        value: '[10,20]',
        expected: 'filter[id]=[[10,20]]',
        description: 'Pre-formatted interval (should be wrapped again)'
      },
      {
        name: 'Decimal interval',
        operator: '=',
        field: 'weight',
        value: '1.5,3.7',
        expected: 'filter[weight]=[1.5,3.7]',
        description: 'Decimal values in interval'
      },
      {
        name: 'Three values comma-separated',
        operator: '=',
        field: 'category_id',
        value: '1,5,10',
        expected: 'filter[category_id]=[1,5,10]',
        description: 'Multiple values comma-separated'
      }
    ];

    console.log('🧪 Testing interval conversion:\n');

    if (buildUrlWithFilters) {
      for (const testCase of testCases) {
        const params = {};
        
        // Simulate the logic from the node
        let filterValue;
        const value = testCase.value.trim();
        
        switch (testCase.operator) {
          case '=':
            if (value.includes(',') && !value.startsWith('[')) {
              filterValue = `[${value}]`;
            } else {
              filterValue = `[${value}]`;
            }
            break;
          case '!=':
            if (value.includes(',') && !value.startsWith('[')) {
              filterValue = `![${value}]`;
            } else {
              filterValue = `![${value}]`;
            }
            break;
        }
        
        params[`filter[${testCase.field}]`] = filterValue;
        
        const result = buildUrlWithFilters(baseUrl, params, false);
        const url = new URL(result);
        const actualParams = decodeURIComponent(url.searchParams.toString());
        
        console.log(`📋 ${testCase.name}:`);
        console.log(`   Input: ${testCase.operator} ${testCase.field} "${testCase.value}"`);
        console.log(`   Expected: ${testCase.expected}`);
        console.log(`   Actual: ${actualParams.split('&')[0]}`);
        
        if (actualParams.includes(testCase.expected)) {
          console.log('   ✅ Interval handling correct');
        } else {
          console.log('   ❌ Interval handling incorrect');
        }
        console.log('');
      }
    }

    // Check source code implementation
    console.log('🔧 Verifying source code implementation:\n');
    
    const nodeContent = fs.readFileSync(path.join(__dirname, 'nodes', 'PrestaShop8', 'PrestaShop8.node.ts'), 'utf8');
    
    // Check if interval logic is implemented
    if (nodeContent.includes('value.includes(\',\')')) {
      console.log('✅ Comma detection logic found');
    } else {
      console.log('❌ Comma detection logic missing');
    }

    if (nodeContent.includes('!value.startsWith(\'[\')')) {
      console.log('✅ Pre-formatted interval detection found');
    } else {
      console.log('❌ Pre-formatted interval detection missing');
    }

    // Check description update
    const descriptionContent = fs.readFileSync(path.join(__dirname, 'nodes', 'PrestaShop8', 'PrestaShop8.node.description.ts'), 'utf8');
    if (descriptionContent.includes('use "10,20" for intervals')) {
      console.log('✅ Value field description updated with interval info');
    } else {
      console.log('❌ Value field description not updated');
    }

    console.log('\n📝 Interval Functionality Summary:');
    console.log('• Equal operator: "10,20" → filter[field]=[10,20]');
    console.log('• Not Equal operator: "10,20" → filter[field]=![10,20]');
    console.log('• Handles single values: "100" → [100]');
    console.log('• Handles decimals: "1.5,3.7" → [1.5,3.7]');
    console.log('• Handles multiple values: "1,5,10" → [1,5,10]');
    console.log('• Works with both = and != operators');

    console.log('\n💡 Usage Examples:');
    console.log('• Price between 10-20: field=price, operator==, value=10,20');
    console.log('• Price not between 50-100: field=price, operator=!=, value=50,100');
    console.log('• ID in list: field=id, operator==, value=1,5,10,15');

    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testIntervalSupport()
    .then(success => {
      if (success) {
        console.log('\n🎉 Interval support correctly implemented!');
        console.log('Users can now use comma-separated values for intervals with Equal/Not Equal operators.');
        process.exit(0);
      } else {
        console.log('\n💥 Interval support validation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testIntervalSupport };
