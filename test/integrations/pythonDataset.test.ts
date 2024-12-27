import { fetchPythonDataset, parsePythonDatasetPath } from '../../src/integrations/pythonDataset';
import { runPython } from '../../src/python/pythonUtils';

jest.mock('../../src/python/pythonUtils', () => ({
  runPython: jest.fn(),
}));

describe('pythonDataset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parsePythonDatasetPath', () => {
    it('should parse dataset path correctly', () => {
      const result = parsePythonDatasetPath('python://test.py:custom_function');
      expect(result).toEqual({
        scriptPath: 'test.py',
        functionName: 'custom_function',
      });
    });

    it('should use default function name if not specified', () => {
      const result = parsePythonDatasetPath('python://test.py');
      expect(result).toEqual({
        scriptPath: 'test.py',
        functionName: 'get_test_cases',
      });
    });
  });

  describe('fetchPythonDataset', () => {
    it('should call Python function with correct config', async () => {
      const mockTestCases = [
        {
          vars: { text: 'test', sentiment: 'positive' },
          assert: [{ type: 'equals', value: 'positive' }],
        },
      ];
      jest.mocked(runPython).mockResolvedValue(mockTestCases);

      const config = {
        scriptPath: 'test.py',
        functionName: 'custom_function',
        limit: '10',
        filter: 'positive',
      };

      await fetchPythonDataset(config);

      expect(runPython).toHaveBeenCalledWith('test.py', 'custom_function', [
        { limit: '10', filter: 'positive' },
      ]);
    });

    it('should use default function name if not specified in config', async () => {
      const mockTestCases = [
        {
          vars: { text: 'test', sentiment: 'positive' },
          assert: [{ type: 'equals', value: 'positive' }],
        },
      ];
      jest.mocked(runPython).mockResolvedValue(mockTestCases);

      await fetchPythonDataset({ scriptPath: 'test.py' });

      expect(runPython).toHaveBeenCalledWith('test.py', 'get_test_cases', [{}]);
    });

    it('should handle array response format', async () => {
      const mockTestCases = [
        {
          vars: { text: 'test', sentiment: 'positive' },
          assert: [{ type: 'equals', value: 'positive' }],
        },
      ];
      jest.mocked(runPython).mockResolvedValue(mockTestCases);

      const result = await fetchPythonDataset({ scriptPath: 'test.py' });

      expect(result).toEqual(mockTestCases);
    });

    it('should handle object response format with test_cases property', async () => {
      const mockTestCases = [
        {
          vars: { text: 'test', sentiment: 'positive' },
          assert: [{ type: 'equals', value: 'positive' }],
        },
      ];
      jest.mocked(runPython).mockResolvedValue({ test_cases: mockTestCases });

      const result = await fetchPythonDataset({ scriptPath: 'test.py' });

      expect(result).toEqual(mockTestCases);
    });

    it('should throw error for invalid response format', async () => {
      jest.mocked(runPython).mockResolvedValue({ invalid: 'format' });

      await expect(fetchPythonDataset({ scriptPath: 'test.py' })).rejects.toThrow(
        'Python function must return an array of test cases or an object with test_cases property',
      );
    });

    it('should handle Python execution errors', async () => {
      jest.mocked(runPython).mockRejectedValue(new Error('Python error'));

      await expect(fetchPythonDataset({ scriptPath: 'test.py' })).rejects.toThrow(
        '[Python Dataset] Failed to load dataset: Error: Python error',
      );
    });
  });
});
