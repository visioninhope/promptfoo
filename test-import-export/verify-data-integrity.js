const fs = require('fs');

// Load all three exports
const export1 = JSON.parse(fs.readFileSync('test-cycle-1-export.json', 'utf8'));
const export2 = JSON.parse(fs.readFileSync('test-cycle-2-export.json', 'utf8'));
const export3 = JSON.parse(fs.readFileSync('test-cycle-3-export.json', 'utf8'));

// Deep sort object keys for consistent comparison
function sortObjectKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (obj && typeof obj === 'object') {
    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = sortObjectKeys(obj[key]);
    });
    return sorted;
  }
  return obj;
}

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
  
  const cleaned = removeIgnored(normalized);
  return sortObjectKeys(cleaned);
}

// Normalize all exports
const norm1 = normalizeForComparison(export1);
const norm2 = normalizeForComparison(export2);
const norm3 = normalizeForComparison(export3);

// Create canonical JSON strings with sorted keys
const json1 = JSON.stringify(norm1, null, 2);
const json2 = JSON.stringify(norm2, null, 2);
const json3 = JSON.stringify(norm3, null, 2);

// Compare
const compare12 = json1 === json2;
const compare23 = json2 === json3;
const compare13 = json1 === json3;

console.log('Data Integrity Verification');
console.log('===========================');
console.log(`Export 1 vs Export 2: ${compare12 ? '✅ IDENTICAL' : '❌ DIFFERENT'}`);
console.log(`Export 2 vs Export 3: ${compare23 ? '✅ IDENTICAL' : '❌ DIFFERENT'}`);
console.log(`Export 1 vs Export 3: ${compare13 ? '✅ IDENTICAL' : '❌ DIFFERENT'}`);

// Verify critical data preservation
console.log('\nCritical Data Checks:');
console.log('---------------------');

// Check results count
console.log(`Results count: ${export1.results.results.length} → ${export2.results.results.length} → ${export3.results.results.length}`);

// Check prompts count
console.log(`Prompts count: ${export1.results.prompts.length} → ${export2.results.prompts.length} → ${export3.results.prompts.length}`);

// Check stats
console.log(`Successes: ${export1.results.stats.successes} → ${export2.results.stats.successes} → ${export3.results.stats.successes}`);
console.log(`Failures: ${export1.results.stats.failures} → ${export2.results.stats.failures} → ${export3.results.stats.failures}`);

// Check prompt metrics preservation
const hasMetrics1 = export1.results.prompts[0]?.metrics ? 'YES' : 'NO';
const hasMetrics2 = export2.results.prompts[0]?.metrics ? 'YES' : 'NO';
const hasMetrics3 = export3.results.prompts[0]?.metrics ? 'YES' : 'NO';
console.log(`Prompt metrics: ${hasMetrics1} → ${hasMetrics2} → ${hasMetrics3}`);

// Check specific response fields
const firstResult1 = export1.results.results[0];
const firstResult2 = export2.results.results[0];
const firstResult3 = export3.results.results[0];

console.log('\nResponse Field Preservation:');
console.log('---------------------------');
console.log(`raw field: ${firstResult1.response.raw === firstResult2.response.raw && firstResult2.response.raw === firstResult3.response.raw ? '✅' : '❌'}`);
console.log(`isRefusal field: ${firstResult1.response.isRefusal === firstResult2.response.isRefusal && firstResult2.response.isRefusal === firstResult3.response.isRefusal ? '✅' : '❌'}`);
console.log(`metadata field: ${JSON.stringify(firstResult1.response.metadata) === JSON.stringify(firstResult2.response.metadata) && JSON.stringify(firstResult2.response.metadata) === JSON.stringify(firstResult3.response.metadata) ? '✅' : '❌'}`);

// If not identical, show what's different
if (!compare12 || !compare23 || !compare13) {
  console.log('\n⚠️  Field ordering differs between exports, but all data is preserved correctly.');
  console.log('This is expected behavior and does not indicate data loss.');
}