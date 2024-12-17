import { handleGEval } from '../../src/assertions/geval';
import { matchesGEval } from '../../src/matchers';
import type { Assertion, AssertionParams } from '../../src/types';

// Mock the matchesGEval function
jest.mock('../../src/matchers', () => ({
  matchesGEval: jest.fn(),
}));

describe('handleGEval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAssertionParams: AssertionParams = {
    assertion: {
      type: 'g-eval',
      dimension: 'fluency',
    } as Assertion,
    outputString: 'Test output',
    test: {
      vars: {},
      options: {},
    },
    prompt: 'Test prompt',
    baseType: 'g-eval',
    inverse: false,
    output: '',
  } as AssertionParams;

  it('should pass when score meets threshold', async () => {
    jest.mocked(matchesGEval).mockResolvedValue({
      pass: true,
      score: 0.8,
      reason: 'Good score',
    });

    const result = await handleGEval({
      ...mockAssertionParams,
      assertion: {
        ...mockAssertionParams.assertion,
        threshold: 0.7,
      },
    });

    expect(result.pass).toBe(true);
    expect(result.score).toBe(0.8);
    expect(result.reason).toBe('Good score');
  });

  it('should fail when score is below threshold', async () => {
    jest.mocked(matchesGEval).mockResolvedValue({
      pass: false,
      score: 0.6,
      reason: 'Below threshold',
    });

    const result = await handleGEval({
      ...mockAssertionParams,
      assertion: {
        ...mockAssertionParams.assertion,
        threshold: 0.7,
      },
    });

    expect(result.pass).toBe(false);
    expect(result.score).toBe(0.6);
  });

  it('should use strict mode when enabled', async () => {
    jest.mocked(matchesGEval).mockResolvedValue({
      pass: false,
      score: 0.9,
      reason: 'Good but not perfect',
    });

    const result = await handleGEval({
      ...mockAssertionParams,
      assertion: {
        ...mockAssertionParams.assertion,
        strict_mode: true,
      },
    });

    expect(result.pass).toBe(false); // Should fail in strict mode since score < 1
  });

  it('should handle custom criteria', async () => {
    jest.mocked(matchesGEval).mockResolvedValue({
      pass: true,
      score: 0.85,
      reason: 'Custom evaluation',
    });

    const result = await handleGEval({
      ...mockAssertionParams,
      assertion: {
        ...mockAssertionParams.assertion,
        criteria: 'Custom evaluation criteria',
        evaluation_steps: ['Step 1', 'Step 2'],
      },
    });

    expect(matchesGEval).toHaveBeenCalledWith(
      expect.objectContaining({
        criteria: 'Custom evaluation criteria',
        evaluationSteps: ['Step 1', 'Step 2'],
      }),
    );
    expect(result.score).toBe(0.85);
  });

  it('should use default values when not provided', async () => {
    jest.mocked(matchesGEval).mockResolvedValue({
      pass: true,
      score: 0.75,
      reason: 'Default evaluation',
    });

    await handleGEval(mockAssertionParams);

    expect(matchesGEval).toHaveBeenCalledWith(
      expect.objectContaining({
        dimension: 'fluency',
        prompt: 'Test prompt',
        output: 'Test output',
        n: 20,
        strictMode: false,
        verboseMode: false,
      }),
    );
  });
});
