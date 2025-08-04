const fs = require('fs');

// Load all three exports
const export1 = JSON.parse(fs.readFileSync('test-cycle-1-export.json', 'utf8'));
const export2 = JSON.parse(fs.readFileSync('test-cycle-2-export.json', 'utf8'));
const export3 = JSON.parse(fs.readFileSync('test-cycle-3-export.json', 'utf8'));

// Fields that are expected to differ
const ignoredFields = ['evalId', 'id', 'createdAt', 'timestamp', 'exportedAt', 'evaluationCreatedAt', 'nodeVersion', 'promptfooVersion'];

function normalizeForComparison(obj) {
  const normalized = JSON.parse(JSON.stringify(obj));
  
  // Remove ignored fields
  function removeIgnored(o) {
    if (Array.isArray(o)) {
      return o.map(removeIgnored);
    }
    if (o && typeof o === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(o)) {
        if (!ignoredFields.includes(key)) {
          result[key] = removeIgnored(value);
        }
      }
      return result;
    }
    return o;
  }
  
  return removeIgnored(normalized);
}

// Normalize all exports
const norm1 = normalizeForComparison(export1);
const norm2 = normalizeForComparison(export2);
const norm3 = normalizeForComparison(export3);

// Compare
const compare12 = JSON.stringify(norm1) === JSON.stringify(norm2);
const compare23 = JSON.stringify(norm2) === JSON.stringify(norm3);
const compare13 = JSON.stringify(norm1) === JSON.stringify(norm3);

console.log('Comparison Results:');
console.log(`Export 1 vs Export 2: ${compare12 ? '✅ IDENTICAL' : '❌ DIFFERENT'}`);
console.log(`Export 2 vs Export 3: ${compare23 ? '✅ IDENTICAL' : '❌ DIFFERENT'}`);
console.log(`Export 1 vs Export 3: ${compare13 ? '✅ IDENTICAL' : '❌ DIFFERENT'}`);

// Check specific data integrity
console.log('\nData Integrity Checks:');
console.log(`Results count: ${export1.results.results.length} → ${export2.results.results.length} → ${export3.results.results.length}`);
console.log(`Prompts count: ${export1.results.prompts.length} → ${export2.results.prompts.length} → ${export3.results.prompts.length}`);

// Check if stats are preserved
console.log(`\nStats preservation:`);
console.log(`Export 1 successes: ${export1.results.stats.successes}`);
console.log(`Export 2 successes: ${export2.results.stats.successes}`);
console.log(`Export 3 successes: ${export3.results.stats.successes}`);

// Check prompt metrics
console.log(`\nPrompt metrics preservation:`);
console.log(`Export 1 has metrics: ${export1.results.prompts[0]?.metrics ? 'YES' : 'NO'}`);
console.log(`Export 2 has metrics: ${export2.results.prompts[0]?.metrics ? 'YES' : 'NO'}`);
console.log(`Export 3 has metrics: ${export3.results.prompts[0]?.metrics ? 'YES' : 'NO'}`);

// If different, show first difference
if (!compare12 || !compare23 || !compare13) {
  console.log('\nDetailed differences:');
  
  // Find first difference
  function findDifference(obj1, obj2, path = '') {
    if (JSON.stringify(obj1) === JSON.stringify(obj2)) return null;
    
    if (typeof obj1 !== typeof obj2) {
      return `Type mismatch at ${path}: ${typeof obj1} vs ${typeof obj2}`;
    }
    
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) {
        return `Array length at ${path}: ${obj1.length} vs ${obj2.length}`;
      }
      for (let i = 0; i < obj1.length; i++) {
        const diff = findDifference(obj1[i], obj2[i], `${path}[${i}]`);
        if (diff) return diff;
      }
    } else if (obj1 && typeof obj1 === 'object' && obj2 && typeof obj2 === 'object') {
      const keys1 = Object.keys(obj1).sort();
      const keys2 = Object.keys(obj2).sort();
      if (JSON.stringify(keys1) !== JSON.stringify(keys2)) {
        return `Keys mismatch at ${path}: ${keys1.join(',')} vs ${keys2.join(',')}`;
      }
      for (const key of keys1) {
        const diff = findDifference(obj1[key], obj2[key], `${path}.${key}`);
        if (diff) return diff;
      }
    } else if (obj1 !== obj2) {
      return `Value at ${path}: ${JSON.stringify(obj1)} vs ${JSON.stringify(obj2)}`;
    }
    
    return null;
  }
  
  if (!compare12) {
    console.log('First difference between Export 1 and 2:', findDifference(norm1, norm2));
  }
  if (!compare23) {
    console.log('First difference between Export 2 and 3:', findDifference(norm2, norm3));
  }
}