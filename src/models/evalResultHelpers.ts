import { ResultFailureReason } from '../types';
import type { EvaluateResult } from '../types';

/**
 * Ensures that an EvaluateResult has all required fields with proper defaults.
 * This is used to handle data from imports where some fields might be optional.
 */
export function normalizeEvaluateResult(result: Partial<EvaluateResult>): EvaluateResult {
  return {
    ...result,
    // Required fields that might be missing in older exports
    failureReason: result.failureReason ?? ResultFailureReason.NONE,
    latencyMs: result.latencyMs ?? 0,
    namedScores: result.namedScores || {},
    cost: result.cost ?? 0,
    metadata: result.metadata || {},
    vars: result.vars || {},
    // These should always be present but add safety
    promptIdx: result.promptIdx ?? 0,
    testIdx: result.testIdx ?? 0,
    score: result.score ?? 0,
    success: result.success ?? false,
  } as EvaluateResult;
}

/**
 * Type guard to check if prompts have provider field
 */
export function hasProvider<T extends { provider?: string }>(
  prompt: T,
): prompt is T & { provider: string } {
  return typeof prompt.provider === 'string' && prompt.provider.length > 0;
}
