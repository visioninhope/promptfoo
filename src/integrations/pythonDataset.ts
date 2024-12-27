import path from 'path';
import cliState from '../cliState';
import logger from '../logger';
import { runPython } from '../python/pythonUtils';
import type { TestCase } from '../types';

interface PythonDatasetConfig {
  scriptPath: string;
  functionName?: string;
  [key: string]: any;
}

function resolvePythonPath(scriptPath: string, configDir?: string): string {
  // First try configDir if provided
  if (configDir) {
    return path.resolve(configDir, scriptPath);
  }
  // Then try cliState.basePath
  if (cliState.basePath) {
    return path.resolve(cliState.basePath, scriptPath);
  }
  // Finally use scriptPath as-is
  return scriptPath;
}

export function parsePythonDatasetPath(datasetPath: string): {
  scriptPath: string;
  functionName: string;
} {
  const pathPart = datasetPath.replace('python://', '');
  const [scriptPath, functionName = 'get_test_cases'] = pathPart.split(':');
  return { scriptPath, functionName };
}

function validateAndCoerceTestCases(testCases: TestCase[]): TestCase[] {
  return testCases.map((testCase) => {
    // Ensure vars is an object
    if (!testCase.vars || typeof testCase.vars !== 'object') {
      testCase.vars = {};
    }

    // Ensure assert is an array
    if (!Array.isArray(testCase.assert)) {
      testCase.assert = [];
    }

    return testCase;
  });
}

async function loadPythonTestCases(
  scriptPath: string,
  functionName: string,
  config: Record<string, any>,
): Promise<TestCase[]> {
  const result = await runPython(scriptPath, functionName, [config]);

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

  testCases = validateAndCoerceTestCases(testCases);
  logger.debug(`[Python Dataset] Successfully loaded ${testCases.length} test cases`);
  return testCases;
}

export async function fetchPythonDataset(
  config: PythonDatasetConfig,
  configDir?: string,
): Promise<TestCase[]> {
  const { scriptPath, functionName = 'get_test_cases', ...otherConfig } = config;
  const resolvedScriptPath = resolvePythonPath(scriptPath, configDir);

  logger.info(
    `[Python Dataset] Loading dataset from ${resolvedScriptPath} using function ${functionName}...`,
  );

  try {
    return await loadPythonTestCases(resolvedScriptPath, functionName, otherConfig);
  } catch (err) {
    const error = `[Python Dataset] Failed to load dataset: ${err}`;
    logger.error(error);
    throw new Error(error);
  }
}
