import { z } from 'zod';
import { PromptSchema as BasePromptSchema } from '../../validators/prompts';
import { ProviderOptionsSchema } from '../../validators/providers';
import { VarsSchema } from '../index';
import { BaseTokenUsageSchema } from '../shared';
import type { GradingResult, ProviderResponse, UnifiedConfig } from '../index';

// Extended prompt schema for import/export that includes metrics
const PromptWithMetricsSchema = BasePromptSchema.extend({
  provider: z.string().optional(),
  metrics: z
    .object({
      score: z.number(),
      testPassCount: z.number(),
      testFailCount: z.number(),
      testErrorCount: z.number(),
      assertPassCount: z.number(),
      assertFailCount: z.number(),
      totalLatencyMs: z.number(),
      tokenUsage: BaseTokenUsageSchema.extend({
        assertions: BaseTokenUsageSchema.optional(),
      }).optional(),
      namedScores: z.record(z.number()).optional(),
      namedScoresCount: z.record(z.number()).optional(),
      cost: z.number().optional(),
    })
    .optional(),
});

// Schema for ProviderResponse from src/types/providers.ts
const ResponseSchema = z.object({
  cached: z.boolean().optional(),
  cost: z.number().optional(),
  error: z.string().optional(),
  logProbs: z.array(z.number()).optional(),
  metadata: z
    .object({
      redteamFinalPrompt: z.string().optional(),
      http: z
        .object({
          status: z.number(),
          statusText: z.string(),
          headers: z.record(z.string()),
        })
        .optional(),
    })
    .passthrough()
    .optional(),
  raw: z.unknown().optional(),
  output: z.unknown().optional(),
  tokenUsage: BaseTokenUsageSchema.optional(),
  isRefusal: z.boolean().optional(),
  sessionId: z.string().optional(),
  guardrails: z
    .object({
      flaggedInput: z.boolean().optional(),
      flaggedOutput: z.boolean().optional(),
      flagged: z.boolean().optional(),
      reason: z.string().optional(),
    })
    .optional(),
  finishReason: z.string().optional(),
  audio: z
    .object({
      id: z.string().optional(),
      expiresAt: z.number().optional(),
      data: z.string().optional(),
      transcript: z.string().optional(),
      format: z.string().optional(),
    })
    .optional(),
}) satisfies z.ZodType<ProviderResponse>;

// Schema for GradingResult from src/types/index.ts
// Note: We use z.any() for assertion to handle complex assertion types
const BaseGradingResultSchema = z.object({
  pass: z.boolean(),
  score: z.number(),
  reason: z.string(),
  namedScores: z.record(z.number()).optional(),
  tokensUsed: BaseTokenUsageSchema.optional(),
  assertion: z.any().optional(), // Complex Assertion type, validated elsewhere
  comment: z.string().optional(),
});

// Add recursive componentResults separately to match the interface
const GradingResultSchema: z.ZodType<GradingResult> = BaseGradingResultSchema.extend({
  componentResults: z.lazy(() => z.array(GradingResultSchema)).optional(),
});

const StatsSchema = z.object({
  successes: z.number(),
  failures: z.number(),
  tokenUsage: BaseTokenUsageSchema.optional(),
});

// V2 Eval Result Schema
const EvalResultV2Schema = z.object({
  prompt: BasePromptSchema,
  vars: VarsSchema,
  response: ResponseSchema.optional(),
  error: z.string().optional(),
  success: z.boolean(),
  score: z.number(),
  latencyMs: z.number().optional(),
  gradingResult: GradingResultSchema.optional(),
  namedScores: z.record(z.number()).optional(),
  cost: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

// V2 Eval Table Schema
const EvalTableSchema = z.object({
  head: z.object({
    prompts: z.array(BasePromptSchema),
    vars: z.array(z.string()),
  }),
  body: z.array(
    z.object({
      outputs: z.array(z.any()), // Can be strings, objects, or ProviderResponse
      vars: z.array(z.string()),
      test: z.any().optional(), // References AtomicTestCase
    }),
  ),
});

// V2 Summary Schema
export const EvaluateSummaryV2Schema = z.object({
  version: z.literal(2),
  timestamp: z.string(),
  results: z.array(EvalResultV2Schema),
  table: EvalTableSchema,
  stats: StatsSchema,
});

// V3 Eval Result Schema (as exported)
const EvalResultV3Schema = z.object({
  id: z.string().optional(), // Result ID
  provider: ProviderOptionsSchema.pick({
    id: true,
    label: true,
  }).required({ id: true }),
  prompt: BasePromptSchema,
  promptId: z.string(), // Reference to prompt
  promptIdx: z.number(),
  testIdx: z.number(),
  testCase: z.object({
    vars: VarsSchema.optional(),
    assert: z.array(z.any()).optional(),
    options: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional(),
    description: z.string().optional(),
    provider: z
      .union([
        z.string(),
        ProviderOptionsSchema,
      ])
      .optional(),
    providerOutput: z.union([z.string(), z.object({})]).optional(),
  }),
  vars: VarsSchema,
  response: ResponseSchema.optional(),
  error: z.string().optional(),
  success: z.boolean(),
  score: z.number(),
  latencyMs: z.number().optional(),
  gradingResult: GradingResultSchema.optional(),
  namedScores: z.record(z.number()).optional(),
  cost: z.number().optional(),
  metadata: z.record(z.any()).optional(),
  failureReason: z.number().optional(), // May not be present in older exports
});

// V3 Summary Schema
export const EvaluateSummaryV3Schema = z.object({
  version: z.literal(3),
  timestamp: z.string(),
  prompts: z.array(PromptWithMetricsSchema),
  results: z.array(EvalResultV3Schema),
  stats: StatsSchema,
});

// Import file schemas
export const ImportFileV2Schema = z.object({
  id: z.string().optional(),
  createdAt: z.string().optional(),
  author: z.string().optional(),
  description: z.string().optional(),
  results: EvaluateSummaryV2Schema,
  config: z.record(z.any()), // UnifiedConfig is complex, validated elsewhere
  metadata: z
    .object({
      promptfooVersion: z.string().optional(),
      nodeVersion: z.string().optional(),
      platform: z.string().optional(),
      arch: z.string().optional(),
      exportedAt: z.string().optional(),
      evaluationCreatedAt: z.string().optional(),
      author: z.string().optional(),
    })
    .optional(),
  shareableUrl: z.string().nullable().optional(),
});

export const ImportFileV3Schema = z.object({
  evalId: z.string().optional(), // Note: exports use evalId, not id
  id: z.string().optional(), // But support both for compatibility
  createdAt: z.string().optional(),
  author: z.string().optional(),
  results: EvaluateSummaryV3Schema,
  config: z.record(z.any()), // UnifiedConfig is complex, validated elsewhere
  metadata: z
    .object({
      promptfooVersion: z.string().optional(),
      nodeVersion: z.string().optional(),
      platform: z.string().optional(),
      arch: z.string().optional(),
      exportedAt: z.string().optional(),
      evaluationCreatedAt: z.string().optional(),
      author: z.string().optional(),
    })
    .optional(),
  shareableUrl: z.string().nullable().optional(),
  relationships: z
    .object({
      tags: z.array(z.string()).optional(),
      datasets: z.array(z.any()).optional(),
      prompts: z.array(z.any()).optional(),
    })
    .optional(),
});

// Union schema that accepts either version
export const ImportFileSchema = z.union([ImportFileV2Schema, ImportFileV3Schema]);

// Type exports
export type ImportFileV2 = z.infer<typeof ImportFileV2Schema>;
export type ImportFileV3 = z.infer<typeof ImportFileV3Schema>;
export type ImportFile = z.infer<typeof ImportFileSchema>;
