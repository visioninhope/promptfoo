import { z } from 'zod/v4';

// for reasoning models
export const CompletionTokenDetailsSchema = z.object({
  reasoning: z.number().optional(),
  acceptedPrediction: z.number().optional(),
  rejectedPrediction: z.number().optional(),
});

export type CompletionTokenDetails = z.infer<typeof CompletionTokenDetailsSchema>;

/**
 * Base schema for token usage statistics with all fields optional
 */
export const BaseTokenUsageSchema = z.object({
  // Core token counts
  prompt: z.number().optional(),
  completion: z.number().optional(),
  cached: z.number().optional(),
  total: z.number().optional(),

  // Request metadata
  numRequests: z.number().optional(),

  // Detailed completion information
  completionDetails: CompletionTokenDetailsSchema.optional(),

  // Assertion token usage (model-graded assertions)
  assertions: z
    .object({
      total: z.number().optional(),
      prompt: z.number().optional(),
      completion: z.number().optional(),
      cached: z.number().optional(),
    })
    .optional(),
});

/**
 * Complete token usage statistics, including assertion data
 */
export const TokenUsageSchema = BaseTokenUsageSchema.extend({
  assertions: BaseTokenUsageSchema.optional(),
});

// TypeScript types derived from schemas
export type BaseTokenUsage = z.infer<typeof BaseTokenUsageSchema>;
export type TokenUsage = z.infer<typeof TokenUsageSchema>;

export type NunjucksFilterMap = Record<string, (...args: any[]) => string>;

export const VarsSchema = z
  .record(
    z.string(),
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.union([z.string(), z.number(), z.boolean()])),
      z.record(z.string(), z.any()),
      z.array(z.any()),
    ]),
  )
  .meta({
    title: 'Variables Schema',
    description: 'Flexible variable system supporting strings, numbers, booleans, arrays, and objects',
    examples: [
      {
        name: 'John Doe',
        age: 30,
        isActive: true,
        skills: ['JavaScript', 'Python'],
        preferences: { theme: 'dark', notifications: true },
      },
    ],
  });

export type Vars = z.infer<typeof VarsSchema>;
