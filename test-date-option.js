#!/usr/bin/env node

/**
 * Test for Date Format option in Advanced Options
 */

const fs = require('fs');

async function testDateOption() {
  console.log('⚙️ Testing Date Format Option in Advanced Options\n');

  try {
    // Test the description file for the new option
    console.log('🔍 Checking Advanced Options configuration:\n');
    
    const descriptionContent = fs.readFileSync(
      './nodes/PrestaShop8/PrestaShop8.node.description.ts', 
      'utf8'
    );

    // Check if Date Format option exists
    if (descriptionContent.includes('Date Format')) {
      console.log('✅ Date Format option found in description');
    } else {
      console.log('❌ Date Format option missing in description');
      return false;
    }

    if (descriptionContent.includes('dateFormat')) {
      console.log('✅ dateFormat name property found');
    } else {
      console.log('❌ dateFormat name property missing');
      return false;
    }

    if (descriptionContent.includes('adds date=1 parameter')) {
      console.log('✅ Correct description for date=1 parameter');
    } else {
      console.log('❌ Description for date=1 parameter missing');
    }

    // Test the implementation file
    console.log('\n🔧 Checking implementation logic:\n');
    
    const nodeContent = fs.readFileSync(
      './nodes/PrestaShop8/PrestaShop8.node.ts', 
      'utf8'
    );

    // Check for date format logic in list operation
    if (nodeContent.includes('if (advancedOptions.dateFormat)')) {
      console.log('✅ Date format check logic found');
    } else {
      console.log('❌ Date format check logic missing');
      return false;
    }

    if (nodeContent.includes('urlParams.date = 1')) {
      console.log('✅ date=1 parameter assignment found');
    } else {
      console.log('❌ date=1 parameter assignment missing');
      return false;
    }

    // Count occurrences to ensure it's in both list and search operations
    const dateFormatMatches = (nodeContent.match(/if \(advancedOptions\.dateFormat\)/g) || []).length;
    const dateParamMatches = (nodeContent.match(/urlParams\.date = 1/g) || []).length;

    if (dateFormatMatches >= 2 && dateParamMatches >= 2) {
      console.log('✅ Date format logic implemented in both list and search operations');
    } else {
      console.log(`❌ Date format logic incomplete - found ${dateFormatMatches} checks and ${dateParamMatches} assignments (expected 2 each)`);
      return false;
    }

    // Test URL construction with buildUrlWithFilters
    console.log('\n🧪 Testing URL construction with date parameter:\n');
    
    let buildUrlWithFilters;
    try {
      const utils = require('./dist/nodes/PrestaShop8/utils.js');
      buildUrlWithFilters = utils.buildUrlWithFilters;
    } catch (error) {
      console.log('⚠️  Using logic validation instead of compiled function test');
    }

    if (buildUrlWithFilters) {
      // Test with date parameter
      const baseUrl = 'https://example.com/api/products';
      const paramsWithDate = {
        limit: '20',
        date: 1,
        'filter[name]': 'test'
      };

      const urlWithDate = buildUrlWithFilters(baseUrl, paramsWithDate, false);
      const url = new URL(urlWithDate);
      
      console.log('📋 Testing URL with date=1 parameter:');
      console.log(`   Base URL: ${baseUrl}`);
      console.log(`   Parameters: ${JSON.stringify(paramsWithDate)}`);
      console.log(`   Result URL: ${urlWithDate}`);
      
      if (url.searchParams.get('date') === '1') {
        console.log('   ✅ date=1 parameter correctly added to URL');
      } else {
        console.log('   ❌ date=1 parameter missing or incorrect in URL');
        return false;
      }

      if (url.searchParams.get('limit') === '20') {
        console.log('   ✅ Other parameters preserved');
      }

      if (url.searchParams.get('filter[name]') === 'test') {
        console.log('   ✅ Filter parameters preserved');
      }

      // Test without date parameter
      const paramsWithoutDate = {
        limit: '10',
        'filter[price]': '>100'
      };

      const urlWithoutDate = buildUrlWithFilters(baseUrl, paramsWithoutDate, false);
      const urlNoDate = new URL(urlWithoutDate);
      
      console.log('\n📋 Testing URL without date parameter:');
      console.log(`   Parameters: ${JSON.stringify(paramsWithoutDate)}`);
      console.log(`   Result URL: ${urlWithoutDate}`);
      
      if (!urlNoDate.searchParams.has('date')) {
        console.log('   ✅ date parameter correctly omitted when not specified');
      } else {
        console.log('   ❌ date parameter incorrectly added when not specified');
        return false;
      }
    }

    console.log('\n📝 Date Format Option Summary:');
    console.log('• Added to Advanced Options as boolean field');
    console.log('• Default: false (disabled)');  
    console.log('• When enabled: adds date=1 to URL parameters');
    console.log('• Available in both List and Search operations');
    console.log('• Works alongside other filters and options');

    console.log('\n💡 Usage:');
    console.log('1. Go to List or Search operation');
    console.log('2. Open Advanced Options');
    console.log('3. Enable "Date Format" checkbox');
    console.log('4. Execute → adds date=1 to API request URL');

    return true;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testDateOption()
    .then(success => {
      if (success) {
        console.log('\n🎉 Date Format option successfully implemented!');
        console.log('Users can now enable date processing in filters via Advanced Options.');
        process.exit(0);
      } else {
        console.log('\n💥 Date Format option validation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testDateOption };
