import { matchesGEval } from '../matchers';
import type { GEVAL_PROMPTS } from '../prompts/geval';
import type { AssertionParams, GradingResult } from '../types';

export const handleGEval = async ({
  assertion,
  outputString,
  test,
  prompt,
}: AssertionParams): Promise<GradingResult> => {
  const dimension = (assertion as any).dimension as keyof typeof GEVAL_PROMPTS;
  const n = (assertion as any).n || 20;
  const threshold = assertion.threshold || 0.5;
  const criteria = assertion.criteria;
  const evaluationSteps = assertion.evaluation_steps;
  const strictMode = assertion.strict_mode || false;
  const verboseMode = assertion.verbose_mode || false;

  const result = await matchesGEval({
    dimension,
    prompt: prompt || '',
    output: outputString,
    n,
    options: test.options,
    criteria,
    evaluationSteps,
    strictMode,
    verboseMode,
  });

  return {
    ...result,
    pass: strictMode ? result.score === 1 : result.score >= threshold,
    assertion,
  };
};
