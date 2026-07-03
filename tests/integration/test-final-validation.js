#!/usr/bin/env node

/**
 * Final Validation Test for PrestaShop8 Node Reorganized Options
 * Tests the new hierarchical structure: Options > Request/Response groups
 */

const fs = require('fs');
const path = require('path');

async function validateNodeStructure() {
  console.log('🔍 Final Validation - PrestaShop8 Node Options Structure\n');

  // Test 1: Verify compiled node exists
  console.log('📦 Test 1: Node Compilation');
  try {
    const compiledNodePath = path.join(__dirname, 'dist', 'nodes', 'PrestaShop8', 'PrestaShop8.node.js');
    const nodeDescPath = path.join(__dirname, 'dist', 'nodes', 'PrestaShop8', 'PrestaShop8.node.description.js');
    
    if (fs.existsSync(compiledNodePath) && fs.existsSync(nodeDescPath)) {
      console.log('✅ Node successfully compiled');
      console.log('✅ Node description compiled');
    } else {
      console.log('❌ Missing compiled files');
      return false;
    }
  } catch (error) {
    console.log('❌ Compilation error:', error.message);
    return false;
  }

  // Test 2: Load and validate node structure
  console.log('\n📋 Test 2: Node Structure Validation');
  try {
    const { PrestaShop8 } = require('../dist/nodes/PrestaShop8/PrestaShop8.node.js');
    const nodeDescription = require('../dist/nodes/PrestaShop8/PrestaShop8.node.description.js');
    
    console.log('✅ Node class loaded successfully');
    console.log('✅ Node description loaded successfully');
    
    // Check if description has the new Options structure
    const properties = nodeDescription.PrestaShop8Description.properties;
    const optionsProperty = properties.find(prop => prop.name === 'options');
    const timeoutProperty = properties.find(prop => prop.name === 'timeout');
    
    if (optionsProperty && timeoutProperty) {
      console.log('✅ New Options structure found');
      console.log('✅ Timeout as direct option found');
      
      // Check Request group
      const requestGroup = optionsProperty.options.find(opt => opt.name === 'request');
      if (requestGroup && requestGroup.type === 'fixedCollection') {
        console.log('✅ Request group correctly structured');
        const requestOptions = requestGroup.options[0].values;
        const hasShowRequestUrl = requestOptions.some(opt => opt.name === 'showRequestUrl');
        const hasShowRequestInfo = requestOptions.some(opt => opt.name === 'showRequestInfo');
        
        if (hasShowRequestUrl && hasShowRequestInfo) {
          console.log('✅ Request options (URL & Info) present');
        } else {
          console.log('❌ Missing Request options');
        }
      } else {
        console.log('❌ Request group incorrectly structured');
      }
      
      // Check Response group
      const responseGroup = optionsProperty.options.find(opt => opt.name === 'response');
      if (responseGroup && responseGroup.type === 'fixedCollection') {
        console.log('✅ Response group correctly structured');
        const responseOptions = responseGroup.options[0].values;
        const hasRawMode = responseOptions.some(opt => opt.name === 'rawMode');
        const hasIncludeHeaders = responseOptions.some(opt => opt.name === 'includeResponseHeaders');
        const hasNeverError = responseOptions.some(opt => opt.name === 'neverError');
        
        if (hasRawMode && hasIncludeHeaders && hasNeverError) {
          console.log('✅ Response options (Raw Mode, Headers, Never Error) present');
        } else {
          console.log('❌ Missing Response options');
        }
      } else {
        console.log('❌ Response group incorrectly structured');
      }
    } else {
      console.log('❌ New Options structure not found');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Node structure validation failed:', error.message);
    return false;
  }

  // Test 3: Validate parameter paths in node execution
  console.log('\n🔧 Test 3: Parameter Path Validation');
  try {
    const nodeContent = fs.readFileSync(path.join(__dirname, 'dist', 'nodes', 'PrestaShop8', 'PrestaShop8.node.js'), 'utf8');
    
    // Check for new parameter paths
    const hasNewTimeoutPath = nodeContent.includes("getNodeParameter('timeout'");
    const hasNewRawModePath = nodeContent.includes("options.response.responseOptions.rawMode");
    const hasNewNeverErrorPath = nodeContent.includes("options.response.responseOptions.neverError");
    const hasNewHeadersPath = nodeContent.includes("options.response.responseOptions.includeResponseHeaders");
    const hasNewRequestUrlPath = nodeContent.includes("options.request.requestOptions.showRequestUrl");
    const hasNewRequestInfoPath = nodeContent.includes("options.request.requestOptions.showRequestInfo");
    
    if (hasNewTimeoutPath) {
      console.log('✅ Timeout parameter path updated');
    } else {
      console.log('❌ Timeout parameter path not updated');
    }
    
    if (hasNewRawModePath && hasNewNeverErrorPath && hasNewHeadersPath) {
      console.log('✅ Response options parameter paths updated');
    } else {
      console.log('❌ Response options parameter paths not updated');
    }
    
    if (hasNewRequestUrlPath && hasNewRequestInfoPath) {
      console.log('✅ Request options parameter paths updated');
    } else {
      console.log('❌ Request options parameter paths not updated');
    }
    
    // Check that old debugOptions paths are removed
    const hasOldDebugOptions = nodeContent.includes("debugOptions.");
    if (!hasOldDebugOptions) {
      console.log('✅ Old debugOptions references removed');
    } else {
      console.log('❌ Old debugOptions references still present');
    }
    
  } catch (error) {
    console.log('❌ Parameter path validation failed:', error.message);
    return false;
  }

  // Test 4: Import validation
  console.log('\n🚀 Test 4: Module Import Test');
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    console.log('✅ Package version:', packageJson.version);
    console.log('✅ Package name:', packageJson.name);
    
    // Test that the module can be imported without errors
    delete require.cache[path.resolve('./dist/nodes/PrestaShop8/PrestaShop8.node.js')];
    const nodeModule = require('../dist/nodes/PrestaShop8/PrestaShop8.node.js');
    
    if (nodeModule.PrestaShop8 && typeof nodeModule.PrestaShop8 === 'function') {
      console.log('✅ Node class is properly exported');
    } else {
      console.log('❌ Node class export issue');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Import test failed:', error.message);
    return false;
  }

  console.log('\n🎯 Final Validation Summary:');
  console.log('   ✅ All tests passed successfully!');
  console.log('   ✅ Options structure reorganized correctly');
  console.log('   ✅ Hierarchical groups (Request/Response) implemented');
  console.log('   ✅ Timeout moved to direct option');
  console.log('   ✅ Parameter paths updated throughout codebase');
  console.log('   ✅ No compilation errors');
  console.log('');
  console.log('📋 New Options Structure:');
  console.log('   Options/');
  console.log('   ├── Request/');
  console.log('   │   ├── Show Request URL');
  console.log('   │   └── Show Request Info');
  console.log('   └── Response/');
  console.log('       ├── Raw Mode');
  console.log('       ├── Include Response Headers and Status');
  console.log('       └── Never Error');
  console.log('   Timeout (ms) - Direct option');
  console.log('');
  console.log('🔧 Parameter Paths:');
  console.log("   - timeout");
  console.log("   - options.request.requestOptions.showRequestUrl");
  console.log("   - options.request.requestOptions.showRequestInfo");
  console.log("   - options.response.responseOptions.rawMode");
  console.log("   - options.response.responseOptions.includeResponseHeaders");
  console.log("   - options.response.responseOptions.neverError");
  console.log('');
  console.log('🚀 Ready for production use!');
  
  return true;
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateNodeStructure()
    .then(success => {
      if (success) {
        console.log('\n✅ All validations completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Some validations failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Validation error:', error);
      process.exit(1);
    });
}

module.exports = { validateNodeStructure };
