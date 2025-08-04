// Generate a large export file for testing
const fs = require('fs');

const NUM_RESULTS = 25000; // Test with 25k results

const baseExport = {
  "evalId": "eval-LARGE-2025-08-04T05:00:00",
  "results": {
    "version": 3,
    "timestamp": "2025-08-04T05:00:00.000Z",
    "prompts": [
      {
        "raw": "Test prompt {{var}}",
        "label": "Test prompt {{var}}",
        "id": "test-prompt-id",
        "provider": "echo",
        "metrics": {
          "score": NUM_RESULTS,
          "testPassCount": NUM_RESULTS,
          "testFailCount": 0,
          "testErrorCount": 0,
          "assertPassCount": NUM_RESULTS,
          "assertFailCount": 0,
          "totalLatencyMs": NUM_RESULTS * 5,
          "tokenUsage": {
            "prompt": 0,
            "completion": 0,
            "cached": 0,
            "total": 0,
            "numRequests": NUM_RESULTS
          },
          "namedScores": {},
          "namedScoresCount": {},
          "cost": 0
        }
      }
    ],
    "results": [],
    "stats": {
      "successes": NUM_RESULTS,
      "failures": 0,
      "errors": 0,
      "tokenUsage": {
        "prompt": 0,
        "completion": 0,
        "cached": 0,
        "total": 0,
        "numRequests": NUM_RESULTS
      }
    }
  },
  "config": {
    "description": "Large test eval",
    "prompts": ["Test prompt {{var}}"],
    "providers": [{"id": "echo"}],
    "tests": []
  },
  "metadata": {
    "promptfooVersion": "0.117.4",
    "exportedAt": new Date().toISOString()
  }
};

// Generate results
for (let i = 0; i < NUM_RESULTS; i++) {
  baseExport.results.results.push({
    "cost": 0,
    "gradingResult": {
      "pass": true,
      "score": 1,
      "reason": "Test passed",
      "namedScores": {},
      "tokensUsed": {
        "total": 0,
        "prompt": 0,
        "completion": 0,
        "cached": 0,
        "numRequests": 0
      }
    },
    "id": `result-${i}`,
    "latencyMs": 5,
    "namedScores": {},
    "prompt": {
      "raw": "Test prompt test" + i,
      "label": "Test prompt {{var}}"
    },
    "promptId": "test-prompt-id",
    "promptIdx": 0,
    "provider": {
      "id": "echo",
      "label": ""
    },
    "response": {
      "output": "Test output " + i,
      "raw": "Test output " + i,
      "tokenUsage": {
        "total": 0,
        "prompt": 0,
        "completion": 0
      },
      "cost": 0,
      "cached": false,
      "isRefusal": false,
      "metadata": {}
    },
    "score": 1,
    "success": true,
    "testCase": {
      "vars": {
        "var": "test" + i
      },
      "assert": [],
      "options": {},
      "metadata": {}
    },
    "testIdx": i,
    "vars": {
      "var": "test" + i
    },
    "metadata": {},
    "failureReason": 0
  });
  
  baseExport.config.tests.push({
    "vars": { "var": "test" + i }
  });
}

fs.writeFileSync('large-export.json', JSON.stringify(baseExport, null, 2));
console.log(`Generated large-export.json with ${NUM_RESULTS} results`);
console.log(`File size: ${Math.round(fs.statSync('large-export.json').size / 1024 / 1024)}MB`);