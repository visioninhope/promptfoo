import * as fs from 'fs';
import yaml from 'js-yaml';
import type { GlobalConfig } from '../src/configTypes';
import {
  readGlobalConfig,
  writeGlobalConfig,
  writeGlobalConfigPartial,
} from '../src/globalConfig/globalConfig';
import { getConfigDirectoryPath } from '../src/util/config/manage';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('proxy-agent', () => ({
  ProxyAgent: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('glob', () => ({
  globSync: jest.fn(),
}));

jest.mock('../src/database');

jest.mock('../src/util/config/manage', () => ({
  getConfigDirectoryPath: jest.fn(),
}));

describe('Global Config Operations', () => {
  const mockConfigDir = '/mock/path/.promptfoo';
  const mockConfigPath = `${mockConfigDir}/promptfoo.yaml`;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(getConfigDirectoryPath).mockReturnValue(mockConfigDir);
    jest.mocked(fs.existsSync).mockImplementation(() => false);
    jest.mocked(fs.readFileSync).mockImplementation(() => '');
    jest.mocked(fs.writeFileSync).mockImplementation(() => undefined);
    jest.mocked(fs.mkdirSync).mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('readGlobalConfig', () => {
    it('should read from existing config file', () => {
      const mockConfig = { account: { email: 'test@example.com' } };
      jest.mocked(fs.existsSync).mockReturnValue(true);
      jest.mocked(fs.readFileSync).mockReturnValue(yaml.dump(mockConfig));

      const result = readGlobalConfig();

      expect(result).toEqual(mockConfig);
      expect(fs.existsSync).toHaveBeenCalledWith(mockConfigPath);
      expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should create new config if none exists', () => {
      jest.mocked(fs.existsSync).mockImplementation((path) => {
        return false;
      });

      const result = readGlobalConfig();

      expect(result).toEqual({});
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(mockConfigPath, yaml.dump({}));
    });

    it('should handle empty or invalid yaml file', () => {
      jest.mocked(fs.existsSync).mockReturnValue(true);
      jest.mocked(fs.readFileSync).mockReturnValue('');

      const result = readGlobalConfig();

      expect(result).toEqual({});
      expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
    });

    it('should handle yaml file that parses to null', () => {
      jest.mocked(fs.existsSync).mockReturnValue(true);
      jest.mocked(fs.readFileSync).mockReturnValue('null');

      const result = readGlobalConfig();

      expect(result).toEqual({});
      expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
    });

    it('should handle yaml file with only comments', () => {
      jest.mocked(fs.existsSync).mockReturnValue(true);
      jest.mocked(fs.readFileSync).mockReturnValue('# just a comment');

      const result = readGlobalConfig();

      expect(result).toEqual({});
      expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
    });
  });

  describe('writeGlobalConfig', () => {
    it('should write config to file', () => {
      const config = { account: { email: 'test@example.com' } };
      jest.mocked(getConfigDirectoryPath).mockReturnValue(mockConfigDir);

      writeGlobalConfig(config);

      expect(fs.writeFileSync).toHaveBeenCalledWith(mockConfigPath, yaml.dump(config));
    });
  });

  describe('writeGlobalConfigPartial', () => {
    it('should merge new config with existing config', () => {
      const existingConfig = {
        account: { email: 'old@example.com' },
        setting1: 'value1',
      };
      const partialConfig = {
        account: { email: 'new@example.com' },
        setting2: 'value2',
      };

      jest.mocked(fs.existsSync).mockReturnValue(true);
      jest.mocked(fs.readFileSync).mockReturnValue(yaml.dump(existingConfig));

      writeGlobalConfigPartial(partialConfig);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        yaml.dump({
          account: { email: 'new@example.com' },
          setting1: 'value1',
          setting2: 'value2',
        }),
      );
    });

    it('should remove keys with null values', () => {
      const existingConfig = {
        setting1: 'value1',
        setting2: 'value2',
      };
      const partialConfig = {
        setting1: null,
        setting3: 'value3',
      };

      jest.mocked(fs.existsSync).mockReturnValue(true);
      jest.mocked(fs.readFileSync).mockReturnValue(yaml.dump(existingConfig));

      writeGlobalConfigPartial(partialConfig as Partial<GlobalConfig>);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        yaml.dump({
          setting2: 'value2',
          setting3: 'value3',
        }),
      );
    });

    it('should handle empty partial config', () => {
      const existingConfig = {
        setting1: 'value1',
      };
      const partialConfig = {};

      jest.mocked(fs.existsSync).mockReturnValue(true);
      jest.mocked(fs.readFileSync).mockReturnValue(yaml.dump(existingConfig));

      writeGlobalConfigPartial(partialConfig);

      expect(fs.writeFileSync).toHaveBeenCalledWith(mockConfigPath, yaml.dump(existingConfig));
    });

    it('should handle undefined values', () => {
      const existingConfig = {
        setting1: 'value1',
        setting2: 'value2',
      };
      const partialConfig = {
        setting1: undefined,
        setting3: 'value3',
      };

      jest.mocked(fs.existsSync).mockReturnValue(true);
      jest.mocked(fs.readFileSync).mockReturnValue(yaml.dump(existingConfig));

      writeGlobalConfigPartial(partialConfig as Partial<GlobalConfig>);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        yaml.dump({
          setting2: 'value2',
          setting3: 'value3',
        }),
      );
    });
  });
});
