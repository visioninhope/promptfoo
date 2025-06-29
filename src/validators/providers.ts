import { z } from 'zod/v4';
import { ProviderEnvOverridesSchema } from '../types/env';
import type {
  CallApiFunction,
  ProviderClassificationResponse,
  ProviderEmbeddingResponse,
  ProviderId,
  ProviderLabel,
  ProviderOptions,
  ProviderResponse,
  ProviderSimilarityResponse,
} from '../types/providers';
import { TokenUsageSchema } from '../types/shared';
import { PromptSchema } from './prompts';
import { NunjucksFilterMapSchema, createFunctionSchema } from './shared';

export const ProviderOptionsSchema = z.strictObject({
  id: z.custom<ProviderId>().optional(),
  label: z.custom<ProviderLabel>().optional(),
  config: z.any().optional(),
  prompts: z.array(z.string()).optional(),
  transform: z.string().optional(),
  delay: z.number().optional(),
  env: ProviderEnvOverridesSchema.optional(),
});

export const CallApiContextParamsSchema = z.object({
  fetchWithCache: z.optional(z.any()),
  filters: NunjucksFilterMapSchema.optional(),
  getCache: z.optional(z.any()),
  logger: z.optional(z.any()),
  originalProvider: z.optional(z.any()),
  prompt: PromptSchema,
  vars: z.record(z.string(), z.union([z.string(), z.object({})])),
});

export const CallApiOptionsParamsSchema = z.object({
  includeLogProbs: z.optional(z.boolean()),
});

// Use standardized function validation
const CallApiFunctionSchema = createFunctionSchema<CallApiFunction>('API call');

export const ApiProviderSchema = z.object({
  id: createFunctionSchema<() => string>('provider ID'),
  callApi: z.custom<CallApiFunction>(),
  callEmbeddingApi:
    createFunctionSchema<(text: string) => Promise<ProviderEmbeddingResponse>>(
      'embedding API',
    ).optional(),
  callClassificationApi:
    createFunctionSchema<(text: string) => Promise<ProviderClassificationResponse>>(
      'classification API',
    ).optional(),
  label: z.custom<ProviderLabel>().optional(),
  transform: z.string().optional(),
  delay: z.number().optional(),
  config: z.any().optional(),
});

export const ProviderResponseSchema = z.object({
  cached: z.boolean().optional(),
  cost: z.number().optional(),
  error: z.string().optional(),
  logProbs: z.array(z.number()).optional(),
  metadata: z
    .object({
      redteamFinalPrompt: z.string().optional(),
    })
    .catchall(z.any())
    .optional(),
  // output can be string or any complex object depending on provider response
  output: z.union([z.string(), z.any()]).optional(),
  tokenUsage: TokenUsageSchema.optional(),
});

export const ProviderEmbeddingResponseSchema = z.object({
  error: z.string().optional(),
  embedding: z.array(z.number()).optional(),
  tokenUsage: TokenUsageSchema.partial().optional(),
});

export const ProviderSimilarityResponseSchema = z.object({
  error: z.string().optional(),
  similarity: z.number().optional(),
  tokenUsage: TokenUsageSchema.partial().optional(),
});

export const ProviderClassificationResponseSchema = z.object({
  error: z.string().optional(),
  classification: z.record(z.string(), z.number()).optional(),
});

export const ProvidersSchema = z.union([
  z.string(),
  CallApiFunctionSchema,
  z.array(
    z.union([
      z.string(),
      z.record(z.string(), ProviderOptionsSchema),
      ProviderOptionsSchema,
      CallApiFunctionSchema,
    ]),
  ),
]);

export const ProviderSchema = z.union([z.string(), ProviderOptionsSchema, ApiProviderSchema]);

// Ensure that schemas match their corresponding types
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assert<T extends never>() {}
type TypeEqualityGuard<A, B> = Exclude<A, B> | Exclude<B, A>;

// assert<TypeEqualityGuard<CallApiFunction, z.infer<typeof CallApiFunctionSchema>>>(); // Disabled for v4 migration
assert<TypeEqualityGuard<ProviderOptions, z.infer<typeof ProviderOptionsSchema>>>();
assert<TypeEqualityGuard<ProviderResponse, z.infer<typeof ProviderResponseSchema>>>();
assert<
  TypeEqualityGuard<ProviderEmbeddingResponse, z.infer<typeof ProviderEmbeddingResponseSchema>>
>();
assert<
  TypeEqualityGuard<ProviderSimilarityResponse, z.infer<typeof ProviderSimilarityResponseSchema>>
>();
assert<
  TypeEqualityGuard<
    ProviderClassificationResponse,
    z.infer<typeof ProviderClassificationResponseSchema>
  >
>();
// assert<TypeEqualityGuard<ApiProvider, z.infer<typeof ApiProviderSchema>>>(); // Disabled for v4 migration
