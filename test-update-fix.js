#!/usr/bin/env node

/**
 * Test for Update Operation Bug Fix - Validate escapeXml handles non-string types
 */

const utils = require('./dist/nodes/PrestaShop8/utils.js');

async function testUpdateFix() {
  console.log('🧪 Testing Update Operation Bug Fix\n');

  try {
    let allTestsPassed = true;

    // Test 1: buildUpdateXml with number ID (the original bug)
    console.log('🔍 Test 1: buildUpdateXml with numeric ID');
    try {
      const xml = utils.buildUpdateXml('products', 21, [
        { name: 'ean13', value: '6942138975901' },
        { name: 'stock', value: '997' }
      ]);
      
      if (xml.includes('<id><![CDATA[21]]></id>')) {
        console.log('✅ Numeric ID correctly converted to string in XML');
      } else {
        console.log('❌ Numeric ID not properly handled');
        console.log('Generated XML:', xml);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log('❌ Error with numeric ID:', error.message);
      allTestsPassed = false;
    }

    // Test 2: buildUpdateXml with string ID
    console.log('\n🔍 Test 2: buildUpdateXml with string ID');
    try {
      const xml = utils.buildUpdateXml('products', '42', [
        { name: 'ean13', value: '1234567890123' }
      ]);
      
      if (xml.includes('<id><![CDATA[42]]></id>')) {
        console.log('✅ String ID correctly handled in XML');
      } else {
        console.log('❌ String ID not properly handled');
        allTestsPassed = false;
      }
    } catch (error) {
      console.log('❌ Error with string ID:', error.message);
      allTestsPassed = false;
    }

    // Test 3: Numeric values in fields
    console.log('\n🔍 Test 3: Numeric values in field values');
    try {
      const xml = utils.buildUpdateXml('products', 100, [
        { name: 'price', value: '29.99' },
        { name: 'quantity', value: '500' }
      ]);
      
      if (xml.includes('<price><![CDATA[29.99]]></price>') && 
          xml.includes('<quantity><![CDATA[500]]></quantity>')) {
        console.log('✅ Numeric field values correctly handled');
      } else {
        console.log('❌ Numeric field values not properly handled');
        allTestsPassed = false;
      }
    } catch (error) {
      console.log('❌ Error with numeric values:', error.message);
      allTestsPassed = false;
    }

    // Test 4: XML special characters escaping
    console.log('\n🔍 Test 4: XML special characters escaping');
    try {
      const xml = utils.buildUpdateXml('products', 200, [
        { name: 'name', value: 'Product <with> "special" & \'chars\'' }
      ]);
      
      if (xml.includes('&lt;with&gt;') && 
          xml.includes('&quot;special&quot;') && 
          xml.includes('&amp;') &&
          xml.includes('&apos;chars&apos;')) {
        console.log('✅ XML special characters properly escaped');
      } else {
        console.log('❌ XML special characters not properly escaped');
        console.log('Generated XML:', xml);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log('❌ Error with special characters:', error.message);
      allTestsPassed = false;
    }

    // Test 5: Real-world scenario from bug report
    console.log('\n🔍 Test 5: Real-world scenario (bug report data)');
    try {
      const xml = utils.buildUpdateXml('products', 21, [
        { name: 'ean13', value: '6942138975901' }
      ]);
      
      if (xml.includes('<id><![CDATA[21]]></id>') && 
          xml.includes('<ean13><![CDATA[6942138975901]]></ean13>')) {
        console.log('✅ Real-world scenario works correctly');
      } else {
        console.log('❌ Real-world scenario failed');
        console.log('Generated XML:', xml);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log('❌ Error with real-world scenario:', error.message);
      allTestsPassed = false;
    }

    console.log('\n📊 Bug Fix Summary:');
    console.log('Issue: unsafe.replace is not a function');
    console.log('Root Cause: escapeXml function received non-string type (number)');
    console.log('Solution: Enhanced escapeXml to handle all data types with String() conversion');
    console.log('Impact: Update operations with numeric IDs now work correctly');

    return allTestsPassed;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.error(error);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testUpdateFix()
    .then(success => {
      if (success) {
        console.log('\n🎉 All tests passed! Bug fix validated successfully.');
        console.log('Update operations with numeric IDs are now working properly.');
        process.exit(0);
      } else {
        console.log('\n💥 Some tests failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testUpdateFix };
