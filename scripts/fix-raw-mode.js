#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = 'nodes/PrestaShop8/PrestaShop8.node.ts';

console.log('🔧 Fixing Raw Mode - Adding json: false option...');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern to find IHttpRequestOptions objects and add json: false in raw mode
  const optionsPattern = /(const options: IHttpRequestOptions = \{[\s\S]*?)(timeout: this\.getNodeParameter\('debugOptions\.timeout', i, 30000\) as number,)\s*(\};)/g;
  
  const replacement = '$1$2\n              ...(rawMode ? { json: false } : {}),\n            $3';
  
  content = content.replace(optionsPattern, replacement);
  
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log('✅ Raw Mode fix applied successfully!');
  console.log('📝 Added json: false option for raw mode in HTTP requests');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
