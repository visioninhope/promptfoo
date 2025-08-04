import { z } from 'zod';

// Base schemas for common structures
const PromptSchema = z.object({
  raw: z.string(),
  label: z.string(),
  function: z.any().optional(),
  provider: z.string().optional(),
  id: z.string().optional(),
  metrics: z.object({
    score: z.number(),
    testPassCount: z.number(),
    testFailCount: z.number(),
    testErrorCount: z.number(),
    assertPassCount: z.number(),
    assertFailCount: z.number(),
    totalLatencyMs: z.number(),
    tokenUsage: z.object({
      prompt: z.number(),
      completion: z.number(),
      cached: z.number(),
      total: z.number(),
      numRequests: z.number(),
      completionDetails: z.object({
        reasoning: z.number(),
        acceptedPrediction: z.number(),
        rejectedPrediction: z.number(),
      }).optional(),
      assertions: z.object({
        total: z.number(),
        prompt: z.number(),
        completion: z.number(),
        cached: z.number(),
        numRequests: z.number(),
        completionDetails: z.object({
          reasoning: z.number(),
          acceptedPrediction: z.number(),
          rejectedPrediction: z.number(),
        }).optional(),
      }).optional(),
    }).optional(),
    namedScores: z.record(z.number()).optional(),
    namedScoresCount: z.record(z.number()).optional(),
    cost: z.number().optional(),
  }).optional(),
});

const VarsSchema = z.record(z.any());

const ResponseSchema = z.object({
  output: z.any().optional(),
  raw: z.any().optional(), // Raw response text
  error: z.string().optional(),
  tokenUsage: z
    .object({
      total: z.number().optional(),
      prompt: z.number().optional(),
      completion: z.number().optional(),
      cached: z.number().optional(),
    })
    .optional(),
  cost: z.number().optional(),
  cached: z.boolean().optional(),
  logProbs: z.any().optional(),
  isRefusal: z.boolean().optional(), // Whether the response was a refusal
  metadata: z.record(z.any()).optional(), // Additional metadata
});

const GradingResultSchema = z.object({
  pass: z.boolean(),
  score: z.number(),
  reason: z.string(),
  namedScores: z.record(z.number()).optional(),
  tokensUsed: z
    .object({
      total: z.number().optional(),
      prompt: z.number().optional(),
      completion: z.number().optional(),
      cached: z.number().optional(),
      numRequests: z.number().optional(),
    })
    .optional(),
  componentResults: z.array(z.any()).optional(),
  assertion: z.any().optional(),
  comment: z.string().optional(),
});

const TokenUsageSchema = z
  .object({
    total: z.number().default(0),
    prompt: z.number().default(0),
    completion: z.number().default(0),
    cached: z.number().default(0),
  })
  .optional();

const StatsSchema = z.object({
  successes: z.number(),
  failures: z.number(),
  tokenUsage: TokenUsageSchema,
});

// V2 Eval Result Schema
const EvalResultV2Schema = z.object({
  prompt: PromptSchema,
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
    prompts: z.array(PromptSchema),
    vars: z.array(z.string()),
  }),
  body: z.array(
    z.object({
      outputs: z.array(z.any()),
      vars: z.array(z.string()),
      test: z.any().optional(),
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
  provider: z.object({
    id: z.string(),
    label: z.string().optional(),
  }),
  prompt: PromptSchema,
  promptId: z.string(), // Reference to prompt
  promptIdx: z.number(),
  testIdx: z.number(),
  testCase: z.object({
    vars: VarsSchema,
    assert: z.array(z.any()).optional(),
    options: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional(),
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
  prompts: z.array(PromptSchema),
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
  config: z.record(z.any()),
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
  config: z.record(z.any()),
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
