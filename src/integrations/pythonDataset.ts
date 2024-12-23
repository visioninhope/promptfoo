import path from 'path';
import logger from '../logger';
import { runPython } from '../python/pythonUtils';
import type { TestCase } from '../types';

function parsePythonDatasetPath(
  datasetPath: string,
  configDir?: string,
): {
  scriptPath: string;
  functionName: string;
  queryParams: URLSearchParams;
} {
  // Remove the python:// prefix and split into path and query
  const [pathPart, queryPart] = datasetPath.replace('python://', '').split('?');
  const [scriptPath, functionName = 'get_test_cases'] = pathPart.split(':');

  // Parse query parameters
  const queryParams = new URLSearchParams(queryPart || '');

  // Resolve script path relative to config directory if provided
  const resolvedScriptPath = configDir ? path.resolve(configDir, scriptPath) : scriptPath;

  return { scriptPath: resolvedScriptPath, functionName, queryParams };
}

export async function fetchPythonDataset(
  datasetPath: string,
  limit?: number,
  configDir?: string,
): Promise<TestCase[]> {
  const { scriptPath, functionName, queryParams } = parsePythonDatasetPath(datasetPath, configDir);

  logger.info(
    `[Python Dataset] Loading dataset from ${scriptPath} using function ${functionName}...`,
  );

  try {
    // Convert query parameters to args object
    const args: Record<string, string> = Object.fromEntries(queryParams.entries());
    if (limit) {
      args.limit = limit.toString();
    }

    // Use runPython utility to execute the Python function
    const result = await runPython(scriptPath, functionName, [args]);

    // Normalize the result into test cases
    let testCases: TestCase[];
    if (Array.isArray(result)) {
      testCases = result;
    } else if (result.test_cases) {
      testCases = result.test_cases;
    } else {
      throw new Error(
        'Python function must return an array of test cases or an object with test_cases property',
      );
    }

    logger.debug(`[Python Dataset] Successfully loaded ${testCases.length} test cases`);
    return testCases;
  } catch (err) {
    const error = `[Python Dataset] Failed to load dataset: ${err}`;
    logger.error(error);
    throw new Error(error);
  }
}
