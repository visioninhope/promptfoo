import type {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommandInput,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { RetrieveAndGenerateCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import type { Agent } from 'http';
import { getCache, isCacheEnabled } from '../cache';
import logger from '../logger';
import telemetry from '../telemetry';
import type { EnvOverrides } from '../types/env';
import type { ApiProvider, ProviderResponse } from '../types/providers';
import { AwsBedrockGenericProvider } from './bedrock';

/**
 * Enum of supported model IDs for Amazon Bedrock Knowledge Base.
 * These models are compatible with RAG (Retrieval Augmented Generation) use cases.
 *
 * Note: Not all models support on-demand throughput for Knowledge Base.
 * Models known to work with on-demand throughput include:
 * - anthropic.claude-v2:1
 * - anthropic.claude-instant-v1
 *
 * Most newer models require inference profiles:
 * - Claude 3 series models (Haiku, Sonnet, Opus)
 * - Claude 3.5 series models
 * - Claude 3.7 series models
 * - Amazon Nova models (nova-pro, nova-micro)
 */
export enum BedrockKnowledgeBaseModels {
  // Anthropic Models
  CLAUDE_V2 = 'anthropic.claude-v2:1',
  CLAUDE_INSTANT_V1 = 'anthropic.claude-instant-v1',
  CLAUDE_3_HAIKU = 'anthropic.claude-3-haiku-20240307-v1:0',
  CLAUDE_3_SONNET = 'anthropic.claude-3-sonnet-20240229-v1:0',
  CLAUDE_3_OPUS = 'anthropic.claude-3-opus-20240229-v1:0',
  CLAUDE_3_5_HAIKU = 'anthropic.claude-3-5-haiku-20241022-v1:0',
  CLAUDE_3_5_SONNET = 'anthropic.claude-3-5-sonnet-20240620-v1:0',
  CLAUDE_3_5_SONNET_V2 = 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  CLAUDE_3_7_SONNET = 'anthropic.claude-3-7-sonnet-20250219-v1:0',

  // Amazon Titan Models
  TITAN_TEXT_EXPRESS = 'amazon.titan-text-express-v1',
  TITAN_TEXT_PREMIER = 'amazon.titan-text-premier-v1:0',
  TITAN_TEXT_LITE = 'amazon.titan-text-lite-v1',
  NOVA_MICRO = 'amazon.nova-micro-v1:0',
  NOVA_PRO = 'amazon.nova-pro-v1:0',

  // Cohere Models
  COHERE_COMMAND = 'cohere.command-text-v14',
  COHERE_COMMAND_LIGHT = 'cohere.command-light-text-v14',
  COHERE_COMMAND_R = 'cohere.command-r-v1:0',
  COHERE_COMMAND_R_PLUS = 'cohere.command-r-plus-v1:0',

  // AI21 Labs Models
  AI21_JAMBA_LARGE = 'ai21.jamba-1-5-large-v1:0',
  AI21_JAMBA_MINI = 'ai21.jamba-1-5-mini-v1:0',

  // Meta Llama Models
  META_LLAMA3_8B = 'meta.llama3-8b-instruct-v1:0',
  META_LLAMA3_70B = 'meta.llama3-70b-instruct-v1:0',
  META_LLAMA3_1_8B = 'meta.llama3-1-8b-instruct-v1:0',
  META_LLAMA3_1_70B = 'meta.llama3-1-70b-instruct-v1:0',
  META_LLAMA3_1_405B = 'meta.llama3-1-405b-instruct-v1:0',
  META_LLAMA3_2_1B = 'meta.llama3-2-1b-instruct-v1:0',
  META_LLAMA3_2_3B = 'meta.llama3-2-3b-instruct-v1:0',
  META_LLAMA3_2_11B = 'meta.llama3-2-11b-instruct-v1:0',
  META_LLAMA3_2_90B = 'meta.llama3-2-90b-instruct-v1:0',
  META_LLAMA3_3_70B = 'meta.llama3-3-70b-instruct-v1:0',

  // Mistral AI Models
  MISTRAL_7B = 'mistral.mistral-7b-instruct-v0:2',
  MISTRAL_LARGE_2402 = 'mistral.mistral-large-2402-v1:0',
  MISTRAL_LARGE_2407 = 'mistral.mistral-large-2407-v1:0',
  MISTRAL_SMALL_2402 = 'mistral.mistral-small-2402-v1:0',
  MISTRAL_MIXTRAL = 'mistral.mixtral-8x7b-instruct-v0:1',

  // DeepSeek Models
  DEEPSEEK_R1 = 'deepseek.r1-v1:0',
}

export interface BedrockKnowledgeBaseOptions {
  accessKeyId?: string;
  profile?: string;
  region?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  knowledgeBaseId: string;
  /**
   * The model to use for knowledge base queries.
   * Can be:
   * 1. A model ID from the BedrockKnowledgeBaseModels enum (e.g., 'anthropic.claude-v2:1')
   * 2. A full ARN for an inference profile (e.g., 'arn:aws:bedrock:region:account:inference-profile/model-id')
   *
   * Note: Not all models support on-demand throughput for Knowledge Base.
   * Only older models like 'anthropic.claude-v2:1' work with on-demand throughput.
   * Newer models (Claude 3/3.5/3.7) require an inference profile.
   *
   * If not specified, defaults to 'anthropic.claude-v2:1'
   */
  modelArn?: string;
  // Retrieval configuration options
  numberOfResults?: number;
  searchType?: 'HYBRID' | 'SEMANTIC';
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  // Metadata filter options
  metadataFilter?: {
    [key: string]: any;
  };
}

// Define citation types to extend ProviderResponse
export interface CitationReference {
  content?: {
    text?: string;
    [key: string]: any;
  };
  location?: {
    type?: string;
    s3Location?: {
      uri?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

export interface Citation {
  retrievedReferences?: CitationReference[];
  generatedResponsePart?: {
    textResponsePart?: {
      text?: string;
      span?: {
        start?: number;
        end?: number;
      };
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

export interface BedrockKnowledgeBaseResponse extends ProviderResponse {
  citations?: Citation[];
}

/**
 * AWS Bedrock Knowledge Base provider for RAG (Retrieval Augmented Generation).
 * Allows querying an existing AWS Bedrock Knowledge Base with text queries.
 */
export class AwsBedrockKnowledgeBaseProvider
  extends AwsBedrockGenericProvider
  implements ApiProvider
{
  knowledgeBaseClient?: BedrockAgentRuntimeClient;
  kbConfig: BedrockKnowledgeBaseOptions;

  constructor(
    modelName: string,
    options: { config?: BedrockKnowledgeBaseOptions; id?: string; env?: EnvOverrides } = {},
  ) {
    super(modelName, options);

    // Ensure knowledgeBaseId is provided in config
    if (!options.config?.knowledgeBaseId) {
      throw new Error(
        'Knowledge Base ID is required. Please provide a knowledgeBaseId in the provider config.',
      );
    }

    this.kbConfig = options.config;
    logger.debug(`Using knowledge base ID: ${this.kbConfig.knowledgeBaseId}`);

    // Log information about the model being used
    if (this.kbConfig.modelArn) {
      logger.debug(`Using specified model: ${this.kbConfig.modelArn}`);
    } else {
      logger.debug(`No model specified, will use default: ${BedrockKnowledgeBaseModels.CLAUDE_V2}`);
      logger.debug(`To specify a model, set modelArn in the config to one of the BedrockKnowledgeBaseModels values.`);
    }

    telemetry.recordAndSendOnce('feature_used', {
      feature: 'knowledge_base',
      provider: 'bedrock',
    });
  }

  id(): string {
    // Use the simplified ID format
    return 'bedrock:kb';
  }

  toString(): string {
    return `[Amazon Bedrock Knowledge Base Provider ${this.kbConfig.knowledgeBaseId}]`;
  }

  async getKnowledgeBaseClient() {
    if (!this.knowledgeBaseClient) {
      let handler;
      // set from https://www.npmjs.com/package/proxy-agent
      if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
        try {
          const { NodeHttpHandler } = await import('@smithy/node-http-handler');
          const { ProxyAgent } = await import('proxy-agent');
          handler = new NodeHttpHandler({
            httpsAgent: new ProxyAgent() as unknown as Agent,
          });
        } catch {
          throw new Error(
            `The @smithy/node-http-handler package is required as a peer dependency. Please install it in your project or globally.`,
          );
        }
      }

      try {
        const { BedrockAgentRuntimeClient } = await import('@aws-sdk/client-bedrock-agent-runtime');
        const credentials = await this.getCredentials();
        const client = new BedrockAgentRuntimeClient({
          region: this.getRegion(),
          maxAttempts: Number(process.env.AWS_BEDROCK_MAX_RETRIES || '10'),
          retryMode: 'adaptive',
          ...(credentials ? { credentials } : {}),
          ...(handler ? { requestHandler: handler } : {}),
        });
        this.knowledgeBaseClient = client;
      } catch (err) {
        throw new Error(
          `The @aws-sdk/client-bedrock-agent-runtime package is required as a peer dependency. Please install it in your project or globally. Error: ${err}`,
        );
      }
    }

    return this.knowledgeBaseClient;
  }

  async callApi(prompt: string): Promise<BedrockKnowledgeBaseResponse> {
    try {
      // Validate knowledge base ID is provided
      if (!this.kbConfig.knowledgeBaseId) {
        throw new Error('Knowledge base ID is required. Set knowledgeBaseId in your config.');
      }

      const client = await this.getKnowledgeBaseClient();

      // Use model ID from getModelId method
      const modelId = this.getModelId();
      logger.debug(`Using model: ${modelId}`);

      // Build the request configuration
      const retrieveAndGenerateConfiguration: any = {
        type: 'KNOWLEDGE_BASE',
        knowledgeBaseConfiguration: {
          knowledgeBaseId: this.kbConfig.knowledgeBaseId,
          modelArn: modelId,
        },
      };

      // Add vector search configuration if needed
      if (
        this.kbConfig.numberOfResults ||
        this.kbConfig.searchType ||
        this.kbConfig.metadataFilter
      ) {
        const vectorSearchConfig: any = {};

        if (this.kbConfig.numberOfResults) {
          vectorSearchConfig.numberOfResults = this.kbConfig.numberOfResults;
        }

        if (this.kbConfig.searchType) {
          vectorSearchConfig.overrideSearchType = this.kbConfig.searchType;
        }

        if (this.kbConfig.metadataFilter) {
          vectorSearchConfig.filter = this.kbConfig.metadataFilter;
        }

        if (Object.keys(vectorSearchConfig).length > 0) {
          if (!retrieveAndGenerateConfiguration.knowledgeBaseConfiguration.retrievalConfiguration) {
            retrieveAndGenerateConfiguration.knowledgeBaseConfiguration.retrievalConfiguration = {};
          }
          retrieveAndGenerateConfiguration.knowledgeBaseConfiguration.retrievalConfiguration.vectorSearchConfiguration =
            vectorSearchConfig;
        }
      }

      // Add inference configuration if needed
      if (this.kbConfig.temperature || this.kbConfig.maxTokens || this.kbConfig.topP) {
        const inferenceConfig: any = {
          textInferenceConfig: {},
        };

        if (this.kbConfig.temperature !== undefined) {
          inferenceConfig.textInferenceConfig.temperature = this.kbConfig.temperature;
        }

        if (this.kbConfig.maxTokens !== undefined) {
          inferenceConfig.textInferenceConfig.maxTokenCount = this.kbConfig.maxTokens;
        }

        if (this.kbConfig.topP !== undefined) {
          inferenceConfig.textInferenceConfig.topP = this.kbConfig.topP;
        }

        if (Object.keys(inferenceConfig.textInferenceConfig).length > 0) {
          retrieveAndGenerateConfiguration.knowledgeBaseConfiguration.generationConfiguration = {
            inferenceConfig,
          };
        }
      }

      const params: RetrieveAndGenerateCommandInput = {
        input: { text: prompt },
        retrieveAndGenerateConfiguration,
      };

      logger.debug(`Calling Amazon Bedrock Knowledge Base API with modelArn: ${modelId}`);
      logger.debug(`Full API params: ${JSON.stringify(params, null, 2)}`);

      const cache = await getCache();
      const cacheKey = `bedrock-kb:${this.kbConfig.knowledgeBaseId}:${this.modelName}:${prompt}`;

      if (isCacheEnabled()) {
        // Try to get the cached response
        const cachedResponse = await cache.get(cacheKey);
        if (cachedResponse) {
          logger.debug(`Returning cached response for ${prompt}`);
          const parsedResponse = JSON.parse(cachedResponse as string);
          return {
            output: parsedResponse.output,
            citations: parsedResponse.citations,
            tokenUsage: {},
            cached: true,
          };
        }
      }

      // Make the Knowledge Base API call
      const command = new RetrieveAndGenerateCommand(params);

      logger.debug(
        `Sending command to Bedrock Knowledge Base API with params: ${JSON.stringify(params)}`,
      );
      const response = await client.send(command);

      logger.debug(`Amazon Bedrock Knowledge Base API response: ${JSON.stringify(response)}`);

      // Extract output from response
      let output = '';
      if (response && response.output && response.output.text) {
        output = response.output.text;
      }

      // Extract citations from response
      let citations: Citation[] = [];
      if (response && response.citations && Array.isArray(response.citations)) {
        citations = response.citations;
      }

      // Cache the response
      if (isCacheEnabled()) {
        try {
          await cache.set(
            cacheKey,
            JSON.stringify({
              output,
              citations,
            }),
          );
        } catch (err) {
          logger.error(`Failed to cache knowledge base response: ${String(err)}`);
        }
      }

      return {
        output,
        citations,
        tokenUsage: {},
      };
    } catch (err: any) {
      // More detailed error handling
      logger.error(`Bedrock Knowledge Base API error: ${String(err)}`);

      // Check for specific error types
      if (err.name === 'ValidationException') {
        if (err.message.includes('Invalid model identifier')) {
          return {
            error: `Bedrock Knowledge Base API error: Invalid model identifier format. ${String(err)}`,
          };
        }

        // For on-demand throughput not supported errors
        if (err.message.includes("on-demand throughput isn't supported")) {
          return {
            error: `Bedrock Knowledge Base API error: The specified model does not support on-demand throughput. ${String(err)}`,
          };
        }
        
        // For other validation errors
        return {
          error: `Bedrock Knowledge Base API validation error: ${String(err)}`,
        };
      } else if (err.name === 'AccessDeniedException') {
        // Return just the original error message without additional suggestions
        return {
          error: `Access denied for Bedrock Knowledge Base API: ${String(err)}`,
        };
      } else {
        // For other error cases
        return {
          error: `Bedrock Knowledge Base API error: ${String(err)}`,
        };
      }
    }
  }

  /**
   * Get the model ID for the request
   */
  private getModelId(): string {
    return this.kbConfig.modelArn ?? BedrockKnowledgeBaseModels.CLAUDE_V2;
  }
}
