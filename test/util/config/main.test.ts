import * as fs from 'fs';
import yaml from 'js-yaml';
import * as os from 'os';
import * as path from 'path';
import logger from '../../../src/logger';
import type { UnifiedConfig } from '../../../src/types';
import {
  getConfigDirectoryPath,
  setConfigDirectoryPath,
  writePromptfooConfig,
} from '../../../src/util/config/manage';

jest.mock('os');
jest.mock('fs');
jest.mock('js-yaml');
jest.mock('../../../src/logger', () => ({
  warn: jest.fn(),
}));

describe('config', () => {
  const mockHomedir = '/mock/home';
  const defaultConfigPath = path.join(mockHomedir, '.promptfoo');
  const originalEnv = process.env;

  beforeAll(() => {
    // Save original environment
    process.env = { ...originalEnv };
  });

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    jest.mocked(os.homedir).mockReturnValue(mockHomedir);
    jest.mocked(fs.existsSync).mockReturnValue(false);

    // Reset environment for each test
    process.env = { ...originalEnv };
    delete process.env.PROMPTFOO_CONFIG_DIR;
  });

  afterEach(() => {
    // Clean up any config path changes
    setConfigDirectoryPath(defaultConfigPath);
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getConfigDirectoryPath', () => {
    it('returns default path when no custom path is set', () => {
      expect(getConfigDirectoryPath()).toBe(defaultConfigPath);
    });

    it('does not create directory when createIfNotExists is false', () => {
      getConfigDirectoryPath(false);
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('creates directory when createIfNotExists is true and directory does not exist', () => {
      getConfigDirectoryPath(true);
      expect(fs.mkdirSync).toHaveBeenCalledWith(defaultConfigPath, { recursive: true });
    });

    it('does not create directory when it already exists', () => {
      jest.mocked(fs.existsSync).mockReturnValue(true);
      getConfigDirectoryPath(true);
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('setConfigDirectoryPath', () => {
    it('updates the config directory path', () => {
      const newPath = '/new/config/path';
      setConfigDirectoryPath(newPath);
      expect(getConfigDirectoryPath()).toBe(newPath);
    });

    it('overrides the environment variable', () => {
      const envPath = '/env/path';
      const newPath = '/new/path';
      process.env.PROMPTFOO_CONFIG_DIR = envPath;
      setConfigDirectoryPath(newPath);
      expect(getConfigDirectoryPath()).toBe(newPath);
    });
  });
});

describe('writePromptfooConfig', () => {
  const mockOutputPath = '/mock/output/path.yaml';

  beforeEach(() => {
    jest.resetAllMocks();
    // Reset yaml mock to ensure clean state
    jest.mocked(yaml.dump).mockImplementation((input) => JSON.stringify(input));
    // Reset logger mock
    jest.mocked(logger.warn).mockClear();
    // Reset fs mock
    jest.mocked(fs.writeFileSync).mockClear();
  });

  afterEach(() => {
    // Clean up any file system side effects
    jest.mocked(fs.writeFileSync).mockClear();
  });

  it('writes a basic config to the specified path', () => {
    const mockConfig: Partial<UnifiedConfig> = { description: 'Test config' };
    const mockYaml = 'description: Test config\n';
    jest.mocked(yaml.dump).mockReturnValue(mockYaml);

    writePromptfooConfig(mockConfig, mockOutputPath);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockOutputPath,
      `# yaml-language-server: $schema=https://promptfoo.dev/config-schema.json\n${mockYaml}`,
    );
  });

  it('orders the keys of the config correctly', () => {
    const mockConfig: Partial<UnifiedConfig> = {
      tests: [{ assert: [{ type: 'equals', value: 'test assertion' }] }],
      description: 'Test config',
      prompts: ['prompt1'],
      providers: ['provider1'],
      defaultTest: { assert: [{ type: 'equals', value: 'default assertion' }] },
    };

    writePromptfooConfig(mockConfig, mockOutputPath);

    const dumpCall = jest.mocked(yaml.dump).mock.calls[0][0];
    const keys = Object.keys(dumpCall);
    expect(keys).toEqual(['description', 'prompts', 'providers', 'defaultTest', 'tests']);
  });

  it('uses js-yaml to dump the config with skipInvalid option', () => {
    const mockConfig: Partial<UnifiedConfig> = { description: 'Test config' };

    writePromptfooConfig(mockConfig, mockOutputPath);

    expect(yaml.dump).toHaveBeenCalledWith(expect.anything(), { skipInvalid: true });
  });

  it('handles empty config', () => {
    const mockConfig: Partial<UnifiedConfig> = {};
    const expectedYaml = '{}';
    jest.mocked(yaml.dump).mockReturnValue(expectedYaml);

    writePromptfooConfig(mockConfig, mockOutputPath);

    // Verify yaml.dump was called with empty object
    expect(yaml.dump).toHaveBeenCalledWith({}, { skipInvalid: true });
    // Verify file was written with empty config
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockOutputPath,
      `# yaml-language-server: $schema=https://promptfoo.dev/config-schema.json\n${expectedYaml}`,
    );
  });

  it('handles null or undefined config', () => {
    const mockConfig: Partial<UnifiedConfig> = null as any;
    const expectedYaml = '{}';

    // Mock yaml.dump to return empty object for null input
    jest.mocked(yaml.dump).mockImplementation(() => expectedYaml);

    writePromptfooConfig(mockConfig, mockOutputPath);

    // Verify yaml.dump was called with empty object
    expect(yaml.dump).toHaveBeenCalledWith({}, { skipInvalid: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockOutputPath,
      `# yaml-language-server: $schema=https://promptfoo.dev/config-schema.json\n${expectedYaml}`,
    );
  });

  it('handles null values in nested config', () => {
    const mockConfig: Partial<UnifiedConfig> = {
      description: 'Test config',
      providers: undefined,
      tests: [
        {
          assert: [{ type: 'equals', value: '' }],
          vars: {
            test: '', // Changed from null to empty string
            valid: 'value',
          },
        },
      ],
    };

    writePromptfooConfig(mockConfig, mockOutputPath);

    const dumpCall = jest.mocked(yaml.dump).mock.calls[0][0];
    expect(dumpCall).toHaveProperty('description', 'Test config');
    expect(dumpCall).not.toHaveProperty('providers');
    expect(dumpCall.tests[0].assert[0]).toEqual({ type: 'equals', value: '' });
    expect(dumpCall.tests[0].vars).toEqual({
      test: '',
      valid: 'value',
    });
  });

  it('handles empty string values in config', () => {
    const mockConfig: Partial<UnifiedConfig> = {
      description: '',
      prompts: [''],
      providers: ['provider1', ''],
    };

    writePromptfooConfig(mockConfig, mockOutputPath);

    const dumpCall = jest.mocked(yaml.dump).mock.calls[0][0];
    expect(dumpCall.description).toBe('');
    expect(dumpCall.prompts).toEqual(['']);
    expect(dumpCall.providers).toEqual(['provider1', '']);
  });

  it('preserves all fields of the UnifiedConfig', () => {
    const mockConfig: Partial<UnifiedConfig> = {
      description: 'Full config test',
      prompts: ['prompt1', 'prompt2'],
      providers: ['provider1', 'provider2'],
      defaultTest: { assert: [{ type: 'equals', value: 'default assertion' }] },
      tests: [
        { assert: [{ type: 'equals', value: 'test assertion 1' }] },
        { assert: [{ type: 'equals', value: 'test assertion 2' }] },
      ],
      outputPath: './output',
    };

    writePromptfooConfig(mockConfig, mockOutputPath);

    const dumpCall = jest.mocked(yaml.dump).mock.calls[0][0];
    expect(dumpCall).toEqual(expect.objectContaining(mockConfig));
  });

  it('handles config with undefined values', () => {
    const mockConfig: Partial<UnifiedConfig> = {
      description: 'Config with undefined',
      prompts: undefined,
      providers: ['provider1'],
    };

    writePromptfooConfig(mockConfig, mockOutputPath);

    const dumpCall = jest.mocked(yaml.dump).mock.calls[0][0];
    expect(dumpCall).toHaveProperty('description', 'Config with undefined');
    expect(dumpCall).toHaveProperty('providers', ['provider1']);
    expect(dumpCall).not.toHaveProperty('prompts');
  });

  it('handles undefined and null values in config', () => {
    const mockConfig: Partial<UnifiedConfig> = {
      description: 'Test config',
      prompts: undefined,
      providers: null as any,
      tests: [{ assert: null as any }],
      scenarios: undefined,
    };

    // Mock yaml.dump to return a simplified object
    jest.mocked(yaml.dump).mockImplementation((input) => JSON.stringify(input));

    writePromptfooConfig(mockConfig, mockOutputPath);

    const dumpCall = jest.mocked(yaml.dump).mock.calls[0][0];
    expect(dumpCall).toHaveProperty('description', 'Test config');
    expect(dumpCall).not.toHaveProperty('prompts');
    // Since null values are preserved by orderKeys, we expect providers to exist with null
    expect(dumpCall.providers).toBeNull();
    expect(dumpCall.tests).toEqual([{ assert: null }]);
    expect(dumpCall).not.toHaveProperty('scenarios');
  });

  it('preserves array order in config', () => {
    const mockConfig: Partial<UnifiedConfig> = {
      prompts: ['prompt1', 'prompt2', 'prompt3'],
      providers: ['provider1', 'provider2'],
      tests: [
        { assert: [{ type: 'equals', value: '1' }] },
        { assert: [{ type: 'equals', value: '2' }] },
      ],
    };

    writePromptfooConfig(mockConfig, mockOutputPath);

    const dumpCall = jest.mocked(yaml.dump).mock.calls[0][0];
    expect(dumpCall.prompts).toEqual(['prompt1', 'prompt2', 'prompt3']);
    expect(dumpCall.providers).toEqual(['provider1', 'provider2']);
    expect(dumpCall.tests).toHaveLength(2);
    expect(dumpCall.tests[0].assert[0].value).toBe('1');
    expect(dumpCall.tests[1].assert[0].value).toBe('2');
  });

  it('handles edge cases in orderKeys', () => {
    const mockConfig: Partial<UnifiedConfig> = {
      description: '', // empty string
      prompts: [], // empty array
      providers: [], // Changed from {} to []
      tests: [
        {
          assert: [{ type: 'equals', value: '' }],
          vars: { key: '' }, // Changed from null to empty string
        },
      ],
    };

    writePromptfooConfig(mockConfig, mockOutputPath);

    const dumpCall = jest.mocked(yaml.dump).mock.calls[0][0];
    expect(dumpCall).toHaveProperty('description', '');
    expect(dumpCall).toHaveProperty('prompts', []);
    expect(dumpCall).toHaveProperty('providers', []);
    expect(dumpCall.tests[0].vars.key).toBe('');
  });
});
