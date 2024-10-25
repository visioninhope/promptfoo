import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Options as PythonShellOptions } from 'python-shell';
import { PythonShell } from 'python-shell';
import readline from 'readline';
import { getEnvString } from '../envars';
import logger from '../logger';
import { safeJsonStringify } from '../util/json';
import { execAsync } from './execAsync';

export const state: { cachedPythonPath: string | null } = { cachedPythonPath: null };

/**
 * Attempts to validate a Python executable path with enhanced checking.
 * @param path - The path to the Python executable to test.
 * @returns The validated path if successful, or null if invalid.
 */
export async function tryPath(path: string): Promise<string | null> {
  try {
    // First try simple version check
    const result = await Promise.race([
      execAsync(`"${path}" -V`),
      new Promise<never>(
        (_, reject) => setTimeout(() => reject(new Error('Command timed out')), 500), // Increased timeout
      ),
    ]);

    const versionOutput = (result as { stdout: string }).stdout.trim();
    if (versionOutput.startsWith('Python 3')) {
      return path;
    }

    // If simple check fails, try interactive Python REPL
    const pythonProcess = await new Promise<string | null>((resolve) => {
      try {
        const proc = spawn(path, ['-i']);
        const rl = readline.createInterface({ input: proc.stdout });

        let versionFound = false;

        rl.on('line', (line) => {
          if (line.includes('Python 3')) {
            versionFound = true;
          }
        });

        // Handle process exit
        proc.on('exit', () => {
          resolve(versionFound ? path : null);
        });

        // Write exit command after brief delay
        setTimeout(() => {
          proc.stdin.write('exit()\n');
        }, 100);

        // Ensure we don't hang
        setTimeout(() => {
          proc.kill();
          resolve(null);
        }, 1000);
      } catch {
        resolve(null);
      }
    });

    return pythonProcess;
  } catch {
    return null;
  }
}

/**
 * Get common Python executable paths for the current platform
 */
function getPythonPaths(): string[] {
  const paths = [];

  if (process.platform === 'win32') {
    paths.push(
      'py -3',
      'python3',
      'python',
      ...Array.from({ length: 6 }, (_, i) => `py -3.${13 - i}`), // Try Python 3.13 down to 3.8
      'C:\\Python39\\python.exe',
      'C:\\Python310\\python.exe',
      'C:\\Python311\\python.exe',
    );
  } else {
    paths.push(
      'python3',
      'python',
      '/usr/bin/python3',
      '/usr/local/bin/python3',
      '/opt/homebrew/bin/python3',
      ...Array.from({ length: 6 }, (_, i) => `python3.${13 - i}`), // Try Python 3.13 down to 3.8
    );
  }

  return paths;
}

/**
 * Validates and caches the Python executable path.
 *
 * @param pythonPath - Path to the Python executable.
 * @param isExplicit - If true, only tries the provided path.
 * @returns Validated Python executable path.
 * @throws {Error} If no valid Python executable is found.
 */
export async function validatePythonPath(pythonPath: string, isExplicit: boolean): Promise<string> {
  if (state.cachedPythonPath) {
    return state.cachedPythonPath;
  }

  const primaryPath = await tryPath(pythonPath);
  if (primaryPath) {
    state.cachedPythonPath = primaryPath;
    return primaryPath;
  }

  if (isExplicit) {
    throw new Error(
      `Python 3 not found at "${pythonPath}". ` +
        `Please ensure Python 3 is installed and set the PROMPTFOO_PYTHON environment variable correctly.`,
    );
  }

  // Try multiple paths in order
  const pythonPaths = getPythonPaths();
  for (const path of pythonPaths) {
    const validPath = await tryPath(path);
    if (validPath) {
      state.cachedPythonPath = validPath;
      return validPath;
    }
  }

  throw new Error(
    `Python 3 not found. Tried multiple paths including "${pythonPath}". ` +
      `Please ensure Python 3 is installed and set the PROMPTFOO_PYTHON environment variable ` +
      `to your Python 3 executable path.`,
  );
}

/**
 * Runs a Python script with the specified method and arguments.
 *
 * @param scriptPath - The path to the Python script to run.
 * @param method - The name of the method to call in the Python script.
 * @param args - An array of arguments to pass to the Python script.
 * @param options - Optional settings for running the Python script.
 * @param options.pythonExecutable - Optional path to the Python executable.
 * @returns A promise that resolves to the output of the Python script.
 * @throws An error if there's an issue running the Python script or parsing its output.
 */
export async function runPython(
  scriptPath: string,
  method: string,
  args: (string | number | object | undefined)[],
  options: { pythonExecutable?: string } = {},
): Promise<any> {
  const absPath = path.resolve(scriptPath);
  const tempJsonPath = path.join(
    os.tmpdir(),
    `promptfoo-python-input-json-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
  );
  const outputPath = path.join(
    os.tmpdir(),
    `promptfoo-python-output-json-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
  );
  const customPath = options.pythonExecutable || getEnvString('PROMPTFOO_PYTHON');
  let pythonPath = customPath || 'python';

  pythonPath = await validatePythonPath(pythonPath, typeof customPath === 'string');

  const pythonOptions: PythonShellOptions = {
    args: [absPath, method, tempJsonPath, outputPath],
    env: process.env,
    mode: 'binary',
    pythonPath,
    scriptPath: __dirname,
  };

  try {
    await fs.writeFileSync(tempJsonPath, safeJsonStringify(args), 'utf-8');
    logger.debug(`Running Python wrapper with args: ${safeJsonStringify(args)}`);

    await new Promise<void>((resolve, reject) => {
      try {
        const pyshell = new PythonShell('wrapper.py', pythonOptions);

        pyshell.stdout.on('data', (chunk: Buffer) => {
          logger.debug(chunk.toString('utf-8').trim());
        });

        pyshell.stderr.on('data', (chunk: Buffer) => {
          logger.error(chunk.toString('utf-8').trim());
        });

        pyshell.end((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });

    const output = await fs.readFileSync(outputPath, 'utf-8');
    logger.debug(`Python script ${absPath} returned: ${output}`);

    let result: { type: 'final_result'; data: any } | undefined;
    try {
      result = JSON.parse(output);
    } catch (error) {
      throw new Error(
        `Invalid JSON: ${(error as Error).message} when parsing result: ${
          output
        }\nStack Trace: ${(error as Error).stack}`,
      );
    }
    if (result?.type !== 'final_result') {
      throw new Error('The Python script `call_api` function must return a dict with an `output`');
    }
    return result.data;
  } catch (error) {
    logger.error(
      `Error running Python script: ${(error as Error).message}\nStack Trace: ${
        (error as Error).stack?.replace('--- Python Traceback ---', 'Python Traceback: ') ||
        'No Python traceback available'
      }`,
    );
    throw new Error(
      `Error running Python script: ${(error as Error).message}\nStack Trace: ${
        (error as Error).stack?.replace('--- Python Traceback ---', 'Python Traceback: ') ||
        'No Python traceback available'
      }`,
    );
  } finally {
    await Promise.all(
      [tempJsonPath, outputPath].map((file) => {
        try {
          fs.unlinkSync(file);
        } catch (error) {
          logger.error(`Error removing ${file}: ${error}`);
        }
      }),
    );
  }
}
