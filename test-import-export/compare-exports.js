const fs = require('fs');

const original = JSON.parse(fs.readFileSync('new-test-export.json', 'utf8'));
const reExport = JSON.parse(fs.readFileSync('final-fixed-export.json', 'utf8'));

// Fields that are expected to differ
const ignoredFields = ['evalId', 'id', 'createdAt', 'timestamp', 'exportedAt', 'evaluationCreatedAt'];

function deepCompare(obj1, obj2, path = '') {
  const differences = [];
  
  // Handle null/undefined
  if (obj1 === null || obj1 === undefined || obj2 === null || obj2 === undefined) {
    if (obj1 !== obj2) {
      differences.push(`${path}: ${obj1} !== ${obj2}`);
    }
    return differences;
  }
  
  // Handle arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      differences.push(`${path}.length: ${obj1.length} !== ${obj2.length}`);
    }
    const maxLen = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < maxLen; i++) {
      differences.push(...deepCompare(obj1[i], obj2[i], `${path}[${i}]`));
    }
    return differences;
  }
  
  // Handle objects
  if (typeof obj1 === 'object' && typeof obj2 === 'object') {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    for (const key of allKeys) {
      // Skip ignored fields
      if (ignoredFields.includes(key)) {
        continue;
      }
      
      if (!(key in obj1)) {
        differences.push(`${path}.${key}: missing in original`);
      } else if (!(key in obj2)) {
        differences.push(`${path}.${key}: missing in re-export`);
      } else {
        differences.push(...deepCompare(obj1[key], obj2[key], `${path}.${key}`));
      }
    }
    return differences;
  }
  
  // Handle primitives
  if (obj1 !== obj2) {
    differences.push(`${path}: ${JSON.stringify(obj1)} !== ${JSON.stringify(obj2)}`);
  }
  
  return differences;
}

console.log('Comparing exports...\n');

// Compare the exports
const diffs = deepCompare(original, reExport);

if (diffs.length === 0) {
  console.log('✅ Exports are identical (excluding IDs and timestamps)!');
} else {
  console.log('❌ Found differences:');
  diffs.forEach(diff => console.log(`  - ${diff}`));
}

// Also check that data integrity is maintained
console.log('\nData integrity checks:');
console.log(`Original results count: ${original.results.results.length}`);
console.log(`Re-export results count: ${reExport.results.results.length}`);
console.log(`Original prompts count: ${original.results.prompts?.length || 0}`);
console.log(`Re-export prompts count: ${reExport.results.prompts?.length || 0}`);

// Check that all test results are preserved
if (original.results.results.length === reExport.results.results.length) {
  console.log('✅ All test results preserved');
} else {
  console.log('❌ Test results count mismatch');
}

// Check critical fields in results
let allFieldsPresent = true;
for (let i = 0; i < original.results.results.length; i++) {
  const origResult = original.results.results[i];
  const reResult = reExport.results.results[i];
  
  const criticalFields = ['score', 'success', 'latencyMs', 'failureReason', 'provider', 'testCase', 'prompt'];
  for (const field of criticalFields) {
    if (!(field in reResult)) {
      console.log(`❌ Missing field '${field}' in result ${i}`);
      allFieldsPresent = false;
    }
  }
}

if (allFieldsPresent) {
  console.log('✅ All critical fields present in results');
}