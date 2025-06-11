#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const JEST_IMPORT = "import {describe, expect, it, beforeEach, afterEach, beforeAll, afterAll, jest} from '@jest/globals';";

function addJestImportToFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the import already exists
  if (content.includes("from '@jest/globals'")) {
    console.log(`✓ ${filePath} - already has Jest imports`);
    return;
  }
  
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Find the right place to insert the import
  // Skip over any leading comments or jest.mock() calls
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments at the top
    if (line === '' || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
      insertIndex = i + 1;
      continue;
    }
    
    // Skip jest.mock() calls
    if (line.startsWith('jest.mock(')) {
      insertIndex = i + 1;
      continue;
    }
    
    // If we hit an import statement, insert before it
    if (line.startsWith('import ')) {
      insertIndex = i;
      break;
    }
    
    // If we hit any other code, insert here
    break;
  }
  
  // Insert the Jest import
  lines.splice(insertIndex, 0, JEST_IMPORT);
  
  // If there's no empty line after jest.mock() calls, add one
  if (insertIndex > 0 && lines[insertIndex - 1].trim().startsWith('jest.mock(')) {
    lines.splice(insertIndex, 0, '');
  }
  
  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✓ ${filePath} - added Jest imports`);
}

function main() {
  console.log('Adding Jest imports to test files...\n');
  
  // Find all test files
  const testFiles = glob.sync('test/**/*.test.ts');
  
  console.log(`Found ${testFiles.length} test files\n`);
  
  let updated = 0;
  let skipped = 0;
  
  testFiles.forEach(filePath => {
    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      addJestImportToFile(filePath);
      const newContent = fs.readFileSync(filePath, 'utf8');
      
      if (originalContent !== newContent) {
        updated++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`✗ ${filePath} - error: ${error.message}`);
    }
  });
  
  console.log(`\nDone! Updated ${updated} files, skipped ${skipped} files`);
}

if (require.main === module) {
  main();
} 