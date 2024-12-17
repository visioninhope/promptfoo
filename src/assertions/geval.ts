import { matchesGEval } from '../matchers';
import type { AssertionParams, GradingResult } from '../types';

export const handleGEval = async ({
  assertion,
  outputString,
  test,
  prompt,
}: AssertionParams): Promise<GradingResult> => {
  const dimension = (assertion as any).dimension;
  const n = (assertion as any).n || 20;
  const threshold = assertion.threshold || 0;

  const result = await matchesGEval(dimension, prompt || '', outputString, n, test.options);

  return {
    ...result,
    pass: result.score >= threshold,
    assertion,
  };
};
