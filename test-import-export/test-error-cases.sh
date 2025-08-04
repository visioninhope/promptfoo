#!/bin/bash

echo "Testing Import Error Handling"
echo "============================="

# Test 1: Non-existent file
echo -e "\n1. Testing non-existent file:"
pf import non-existent-file.json 2>&1 | grep -E "(File not found|Failed to import)"

# Test 2: Empty file
echo -e "\n2. Testing empty file:"
touch empty.json
pf import empty.json 2>&1 | grep -E "(empty|Failed to import)"
rm empty.json

# Test 3: Invalid JSON
echo -e "\n3. Testing invalid JSON:"
echo "{ invalid json" > invalid.json
pf import invalid.json 2>&1 | grep -E "(Invalid JSON|Failed to import)"
rm invalid.json

# Test 4: Missing required fields
echo -e "\n4. Testing missing required fields:"
echo '{"results": {}}' > missing-fields.json
pf import missing-fields.json 2>&1 | grep -E "(Invalid eval format|Failed to import)"
rm missing-fields.json

# Test 5: Invalid version
echo -e "\n5. Testing invalid version:"
echo '{"id": "test", "results": {"version": 99, "results": []}}' > invalid-version.json
pf import invalid-version.json 2>&1 | grep -E "(Invalid eval format|Failed to import)"
rm invalid-version.json

# Test 6: Large file simulation (create a file with many results)
echo -e "\n6. Testing large file handling:"
node -e "
const data = {
  id: 'large-test',
  results: {
    version: 3,
    timestamp: new Date().toISOString(),
    prompts: [{
      raw: 'test',
      label: 'test',
      provider: 'echo',
      id: 'test-prompt'
    }],
    results: Array(10000).fill(null).map((_, i) => ({
      id: 'result-' + i,
      promptIdx: 0,
      testIdx: i,
      vars: { test: i },
      response: { output: 'test' + i },
      success: true,
      score: 1,
      latencyMs: 1,
      namedScores: {},
      cost: 0,
      metadata: {}
    })),
    stats: { successes: 10000, failures: 0, errors: 0 }
  },
  config: {}
};
require('fs').writeFileSync('large-file.json', JSON.stringify(data));
"
echo "Created file with 10000 results..."
ls -lh large-file.json | awk '{print "File size:", $5}'
time pf import large-file.json --dry-run 2>&1 | grep -E "(Import Preview|results)"
rm large-file.json

# Test 7: Duplicate ID without --force
echo -e "\n7. Testing duplicate ID handling:"
pf import test-cycle-1-export.json --new-id > /dev/null 2>&1
# Try to import again without --force
pf import test-cycle-1-export.json 2>&1 | grep -E "(already exists|--force)"

echo -e "\nAll error handling tests completed!"