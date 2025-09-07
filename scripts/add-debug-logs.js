#!/usr/bin/env node

const fs = require('fs');

const filePath = 'nodes/PrestaShop8/PrestaShop8.node.ts';

console.log('🔧 Adding debug logs for Raw Mode...');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Ajouter debug pour le premier cas (list) seulement
  const listCasePattern = /(case 'list': \{[\s\S]*?)(const response = await this\.helpers\.httpRequest\(options\);)\s+(responseData = rawMode \? response : simplifyPrestashopResponse\(response, resource\);)\s+(break;)/;
  
  if (listCasePattern.test(content)) {
    content = content.replace(listCasePattern, 
      '$1console.log(\'🔧 DEBUG - Raw Mode:\', rawMode);\n' +
      '            console.log(\'🔧 DEBUG - Headers sent:\', options.headers);\n' +
      '            console.log(\'🔧 DEBUG - JSON option:\', options.json);\n' +
      '            \n' +
      '            $2\n' +
      '            \n' +
      '            console.log(\'🔧 DEBUG - Response type:\', typeof response);\n' +
      '            console.log(\'🔧 DEBUG - Response preview:\', typeof response === \'string\' ? response.substring(0, 100) : JSON.stringify(response).substring(0, 100));\n' +
      '            \n' +
      '            $3\n' +
      '            $4'
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Debug logs added successfully!');
  } else {
    console.log('❌ Could not find list case pattern');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
