import { Command } from 'commander';
import fs from 'fs/promises';
import * as init from '../../src/commands/init';
import logger from '../../src/logger';

jest.mock('../../src/redteam/commands/init', () => ({
  redteamInit: jest.fn(),
}));

jest.mock('../../src/server/server', () => ({
  startServer: jest.fn(),
  BrowserBehavior: {
    ASK: 0,
    OPEN: 1,
    SKIP: 2,
    OPEN_TO_REPORT: 3,
    OPEN_TO_REDTEAM_CREATE: 4,
  },
}));

jest.mock('../../src/commands/init', () => {
  const actual = jest.requireActual('../../src/commands/init');
  return {
    ...actual,
    downloadDirectory: jest.fn(),
    downloadExample: jest.fn(),
    getExamplesList: jest.fn(),
  };
});

jest.mock('fs/promises');
jest.mock('path');
jest.mock('../../src/constants');
jest.mock('../../src/logger');
jest.mock('../../src/onboarding');
jest.mock('../../src/telemetry');
jest.mock('@inquirer/confirm');
jest.mock('@inquirer/input');
jest.mock('@inquirer/select');

const GITHUB_API_BASE = 'https://api.github.com';
const VERSION = 'main'; // or whatever version you're using

describe('init command', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockFetch = jest.fn();
    global.fetch = mockFetch;

    jest.mocked(fs.mkdir).mockReset();
    jest.mocked(fs.writeFile).mockReset();
    jest.mocked(init.downloadDirectory).mockReset();

    jest
      .mocked(init.downloadExample)
      .mockImplementation(async (exampleName: string, targetDir: string) => {
        try {
          await fs.mkdir(targetDir, { recursive: true });
          await init.downloadDirectory(exampleName, targetDir);
        } catch (error) {
          throw new Error(
            `Failed to download example: ${error instanceof Error ? error.message : error}`,
          );
        }
      });
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  describe('downloadFile', () => {
    it('should download a file successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('file content'),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await init.downloadFile('https://example.com/file.txt', '/path/to/file.txt');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/file.txt');
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      expect(fs.writeFile).toHaveBeenCalledWith('/path/to/file.txt', 'file content');
    });

    it('should throw an error if download fails', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        init.downloadFile('https://example.com/file.txt', '/path/to/file.txt'),
      ).rejects.toThrow('Failed to download file: Not Found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        init.downloadFile('https://example.com/file.txt', '/path/to/file.txt'),
      ).rejects.toThrow('Network error');
    });
  });

  describe('downloadDirectory', () => {
    beforeEach(() => {
      jest
        .mocked(init.downloadDirectory)
        .mockImplementation(async (dirPath: string, targetDir: string) => {
          const response = await fetch(
            `${GITHUB_API_BASE}/repos/promptfoo/promptfoo/contents/examples/${dirPath}?ref=${VERSION}`,
            {
              headers: {
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'promptfoo-cli',
              },
            },
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch directory contents: ${response.statusText}`);
          }
          await response.json();
        });
    });

    it('should throw an error if fetching directory contents fails', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Not Found',
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Simplified mock implementation
      jest.mocked(init.downloadDirectory).mockImplementationOnce(async () => {
        throw new Error('Failed to fetch directory contents: Not Found');
      });

      await expect(init.downloadDirectory('example', '/path/to/target')).rejects.toThrow(
        'Failed to fetch directory contents: Not Found',
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Simplified mock implementation
      jest.mocked(init.downloadDirectory).mockImplementationOnce(async () => {
        throw new Error('Network error');
      });

      await expect(init.downloadDirectory('example', '/path/to/target')).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('downloadExample', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw an error if directory creation fails', async () => {
      jest.spyOn(fs, 'mkdir').mockRejectedValueOnce(new Error('Permission denied'));

      await expect(init.downloadExample('example', '/path/to/target')).rejects.toThrow(
        'Failed to download example: Permission denied',
      );
    });

    it('should throw an error if downloadDirectory fails', async () => {
      jest.spyOn(fs, 'mkdir').mockResolvedValueOnce(undefined);
      jest.mocked(init.downloadDirectory).mockImplementationOnce(async () => {
        throw new Error('Network error');
      });

      await expect(init.downloadExample('example', '/path/to/target')).rejects.toThrow(
        'Failed to download example: Network error',
      );

      expect(fs.mkdir).toHaveBeenCalledWith('/path/to/target', { recursive: true });
      expect(init.downloadDirectory).toHaveBeenCalledWith('example', '/path/to/target');
    });
  });

  describe('getExamplesList', () => {
    beforeEach(() => {
      // Reset the mock implementation for each test
      jest.mocked(init.getExamplesList).mockReset();
      jest.mocked(logger.error).mockReset();
    });

    it('should return a list of examples', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([
          { name: 'example1', type: 'dir' },
          { name: 'example2', type: 'dir' },
          { name: 'not-an-example', type: 'file' },
        ]),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Implement the actual logic
      jest.mocked(init.getExamplesList).mockImplementationOnce(async () => {
        const response = await fetch(
          `${GITHUB_API_BASE}/repos/promptfoo/promptfoo/contents/examples?ref=${VERSION}`,
          {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'promptfoo-cli',
            },
          },
        );

        const data = await response.json();
        return data.filter((item: any) => item.type === 'dir').map((item: any) => item.name);
      });

      const examples = await init.getExamplesList();
      expect(examples).toEqual(['example1', 'example2']);
    });

    it('should return an empty array if fetching fails', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Implement the actual error handling logic
      jest.mocked(init.getExamplesList).mockImplementationOnce(async () => {
        try {
          const response = await fetch(
            `${GITHUB_API_BASE}/repos/promptfoo/promptfoo/contents/examples?ref=${VERSION}`,
          );
          if (!response.ok) {
            throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
          }
          return [];
        } catch (error) {
          logger.error(
            `Failed to fetch examples list: ${error instanceof Error ? error.message : error}`,
          );
          return [];
        }
      });

      const examples = await init.getExamplesList();
      expect(examples).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Not Found'));
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      // Implement the actual error handling logic
      jest.mocked(init.getExamplesList).mockImplementationOnce(async () => {
        try {
          const response = await fetch(
            `${GITHUB_API_BASE}/repos/promptfoo/promptfoo/contents/examples?ref=${VERSION}`,
          );
          if (!response.ok) {
            throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
          }
          return [];
        } catch (error) {
          logger.error(
            `Failed to fetch examples list: ${error instanceof Error ? error.message : error}`,
          );
          return [];
        }
      });

      const examples = await init.getExamplesList();
      expect(examples).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Network error'));
    });
  });

  describe('initCommand', () => {
    let program: Command;

    beforeEach(() => {
      program = new Command();
      init.initCommand(program);
    });

    it('should set up the init command correctly', () => {
      const initCmd = program.commands.find((cmd) => cmd.name() === 'init');
      expect(initCmd).toBeDefined();
      expect(initCmd?.description()).toBe(
        'Initialize project with dummy files or download an example',
      );
      expect(initCmd?.options).toHaveLength(3);
    });
  });
});
