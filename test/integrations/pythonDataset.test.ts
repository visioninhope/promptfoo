import { fetchPythonDataset } from '../../src/integrations/pythonDataset';
import { runPython } from '../../src/python/pythonUtils';

jest.mock('../../src/python/pythonUtils', () => ({
  runPython: jest.fn(),
}));

describe('pythonDataset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchPythonDataset', () => {
    it('should parse dataset path correctly', async () => {
      const mockTestCases = [
        {
          vars: { text: 'test', sentiment: 'positive' },
          assert: [{ type: 'equals', value: 'positive' }],
        },
      ];
      jest.mocked(runPython).mockResolvedValue(mockTestCases);

      await fetchPythonDataset('python://test.py:custom_function?limit=10&filter=positive');

      expect(runPython).toHaveBeenCalledWith('test.py', 'custom_function', [
        { limit: '10', filter: 'positive' },
      ]);
    });

    it('should use default function name if not specified', async () => {
      const mockTestCases = [
        {
          vars: { text: 'test', sentiment: 'positive' },
          assert: [{ type: 'equals', value: 'positive' }],
        },
      ];
      jest.mocked(runPython).mockResolvedValue(mockTestCases);

      await fetchPythonDataset('python://test.py');

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

      const result = await fetchPythonDataset('python://test.py');

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

      const result = await fetchPythonDataset('python://test.py');

      expect(result).toEqual(mockTestCases);
    });

    it('should throw error for invalid response format', async () => {
      jest.mocked(runPython).mockResolvedValue({ invalid: 'format' });

      await expect(fetchPythonDataset('python://test.py')).rejects.toThrow(
        'Python function must return an array of test cases or an object with test_cases property',
      );
    });

    it('should handle Python execution errors', async () => {
      jest.mocked(runPython).mockRejectedValue(new Error('Python error'));

      await expect(fetchPythonDataset('python://test.py')).rejects.toThrow(
        '[Python Dataset] Failed to load dataset: Python error',
      );
    });
  });
});
