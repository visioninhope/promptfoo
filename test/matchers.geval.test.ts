import { matchesGEval } from '../src/matchers';
import { getDefaultProviders } from '../src/providers/defaults';
import type { ApiProvider } from '../src/types';

jest.mock('../src/providers/defaults', () => ({
  getDefaultProviders: jest.fn(),
}));

describe('matchesGEval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockProvider: ApiProvider = {
    id: () => 'mock-provider',
    callApi: jest.fn(),
  };

  beforeEach(() => {
    jest.mocked(getDefaultProviders).mockResolvedValue({
      datasetGenerationProvider: mockProvider,
      embeddingProvider: mockProvider,
      gradingProvider: mockProvider,
      gradingJsonProvider: mockProvider,
      moderationProvider: mockProvider,
      suggestionsProvider: mockProvider,
      synthesizeProvider: mockProvider,
    });
  });

  it('should handle standard dimension evaluation', async () => {
    jest.mocked(mockProvider.callApi).mockResolvedValue({
      output: '3',
      tokenUsage: { total: 100 },
    });

    const result = await matchesGEval({
      dimension: 'fluency',
      prompt: 'Test prompt',
      output: 'Test output',
      n: 2,
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.pass).toBe(true);
    expect(mockProvider.callApi).toHaveBeenCalledTimes(2);
  });

  it('should handle custom criteria evaluation', async () => {
    // Mock all API calls that will be made during the test
    const mockCallApi = jest.mocked(mockProvider.callApi);

    // Mock multiple calls to return valid scores
    mockCallApi
      .mockResolvedValueOnce({ output: '5', tokenUsage: { total: 100 } })
      .mockResolvedValueOnce({ output: '5', tokenUsage: { total: 100 } })
      // Add more mocks if needed for additional calls
      .mockResolvedValue({ output: '5', tokenUsage: { total: 100 } });

    const result = await matchesGEval({
      dimension: 'fluency',
      prompt: 'Test prompt',
      output: 'Test output',
      criteria: 'Custom criteria',
      evaluationSteps: ['Step 1'],
      n: 2,
    });

    // Verify the result
    expect(result.score).toBeGreaterThan(0);
    expect(mockProvider.callApi).toHaveBeenCalledWith(expect.stringContaining('Custom criteria'));

    // Additional verification
    expect(mockProvider.callApi).toHaveBeenCalledTimes(2);
  });

  it('should fail when no valid scores are returned', async () => {
    jest.mocked(mockProvider.callApi).mockResolvedValue({
      output: 'invalid score',
      tokenUsage: { total: 100 },
    });

    const result = await matchesGEval({
      dimension: 'fluency',
      prompt: 'Test prompt',
      output: 'Test output',
      n: 2,
    });

    expect(result.pass).toBe(false);
    expect(result.score).toBe(0);
    expect(result.reason).toContain('Could not parse any valid scores');
  });

  it('should fail when too few valid responses', async () => {
    // Only 1 valid response out of 4 attempts (25% < 50% minimum)
    jest
      .mocked(mockProvider.callApi)
      .mockResolvedValueOnce({ output: '3', tokenUsage: { total: 100 } })
      .mockResolvedValueOnce({ output: 'invalid', tokenUsage: { total: 100 } })
      .mockResolvedValueOnce({ output: 'invalid', tokenUsage: { total: 100 } })
      .mockResolvedValueOnce({ output: 'invalid', tokenUsage: { total: 100 } });

    const result = await matchesGEval({
      dimension: 'fluency',
      prompt: 'Test prompt',
      output: 'Test output',
      n: 4,
    });

    expect(result.pass).toBe(false);
    expect(result.reason).toContain('Too few valid responses');
  });

  it('should handle provider errors gracefully', async () => {
    jest.mocked(mockProvider.callApi).mockRejectedValue(new Error('API error'));

    const result = await matchesGEval({
      dimension: 'fluency',
      prompt: 'Test prompt',
      output: 'Test output',
    });

    expect(result.pass).toBe(false);
    expect(result.score).toBe(0);
    expect(result.reason).toContain('G-Eval failed');
  });
});
