import OpenAI from 'openai';
import { disableCache, fetchWithCache, clearCache } from '../../src/cache';
import {
  failApiCall,
  getTokenUsage,
  OpenAiGenericProvider,
  OpenAiEmbeddingProvider,
  OpenAiChatCompletionProvider,
  calculateOpenAICost,
} from '../../src/providers/openai';

jest.mock('../../src/cache');
jest.mock('../../src/globalConfig/globalConfig');
jest.mock('../../src/logger');

const mockFetch = jest.mocked(jest.fn());
global.fetch = mockFetch;

describe('OpenAI Provider', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    disableCache();
  });

  describe('failApiCall', () => {
    it('should format OpenAI API errors', () => {
      const error = new OpenAI.APIError(
        400,
        {
          type: 'invalid_request_error',
          message: 'Bad request',
        },
        'Bad request',
        {},
      );

      const result = failApiCall(error);
      expect(result).toEqual({
        error: `API error: invalid_request_error 400 Bad request`,
      });
    });

    it('should format generic errors', () => {
      const error = new Error('Network error');
      const result = failApiCall(error);
      expect(result).toEqual({
        error: `API error: Error: Network error`,
      });
    });
  });

  describe('getTokenUsage', () => {
    it('should return token usage for non-cached response', () => {
      const data = {
        usage: {
          total_tokens: 100,
          prompt_tokens: 40,
          completion_tokens: 60,
        },
      };

      const result = getTokenUsage(data, false);
      expect(result).toEqual({
        total: 100,
        prompt: 40,
        completion: 60,
      });
    });

    it('should return cached token usage', () => {
      const data = {
        usage: {
          total_tokens: 100,
        },
      };

      const result = getTokenUsage(data, true);
      expect(result).toEqual({
        cached: 100,
        total: 100,
      });
    });

    it('should handle missing usage data', () => {
      const data = {};
      const result = getTokenUsage(data, false);
      expect(result).toEqual({});
    });
  });

  describe('OpenAiGenericProvider', () => {
    const provider = new OpenAiGenericProvider('test-model', {
      config: {
        apiKey: 'test-key',
        organization: 'test-org',
      },
    });

    it('should generate correct API URL', () => {
      expect(provider.getApiUrl()).toBe('https://api.openai.com/v1');
    });

    it('should use custom API host', () => {
      const customProvider = new OpenAiGenericProvider('test-model', {
        config: { apiHost: 'custom.openai.com' },
      });
      expect(customProvider.getApiUrl()).toBe('https://custom.openai.com/v1');
    });

    it('should get organization', () => {
      expect(provider.getOrganization()).toBe('test-org');
    });

    it('should get API key', () => {
      expect(provider.getApiKey()).toBe('test-key');
    });
  });

  describe('OpenAiEmbeddingProvider', () => {
    const provider = new OpenAiEmbeddingProvider('text-embedding-3-large', {
      config: {
        apiKey: 'test-key',
      },
    });

    it('should call embedding API successfully', async () => {
      const mockResponse = {
        data: [
          {
            embedding: [0.1, 0.2, 0.3],
          },
        ],
        usage: {
          total_tokens: 10,
          prompt_tokens: 0,
          completion_tokens: 0,
        },
      };

      jest.mocked(fetchWithCache).mockResolvedValue({
        data: mockResponse,
        cached: false,
        status: 200,
        statusText: 'OK',
      });

      const result = await provider.callEmbeddingApi('test text');
      expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
      expect(result.tokenUsage).toEqual({
        total: 10,
        prompt: 0,
        completion: 0,
      });
    });

    it('should handle API errors', async () => {
      jest.mocked(fetchWithCache).mockRejectedValue(new Error('API error'));

      await expect(provider.callEmbeddingApi('test text')).rejects.toThrow('API error');
    });
  });

  describe('calculateOpenAICost', () => {
    it('should calculate cost correctly', () => {
      const cost = calculateOpenAICost('gpt-4', {}, 100, 50);
      expect(cost).toBeDefined();
      expect(typeof cost).toBe('number');
    });

    it('should handle unknown models', () => {
      const cost = calculateOpenAICost('unknown-model', {}, 100, 50);
      expect(cost).toBeUndefined();
    });
  });

  describe('call provider apis', () => {
    afterEach(async () => {
      jest.clearAllMocks();
      await clearCache();
    });

    describe('OpenAiChatCompletionProvider with O1 models', () => {
      it('should handle O1-specific configurations', async () => {
        const mockResponse = {
          data: {
            choices: [{ message: { content: 'Test output' } }],
            usage: { total_tokens: 10, prompt_tokens: 5, completion_tokens: 5 },
          },
          cached: false,
          status: 200,
          statusText: 'OK',
        };
        const fetchWithCacheMock = jest.mocked(fetchWithCache);
        fetchWithCacheMock.mockResolvedValue(mockResponse);

        const provider = new OpenAiChatCompletionProvider('o1-preview', {
          config: {
            developer_message: {
              content: 'Follow these instructions carefully',
              name: 'dev_assistant',
            },
            reasoning_effort: 'high',
            max_completion_tokens: 100,
            prediction: {
              content: 'Expected output',
              type: 'content',
            },
          },
        });

        await provider.callApi('Test prompt');

        expect(fetchWithCacheMock).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('"reasoning_effort":"high"'),
          }),
          expect.any(Number),
        );

        const mockCalls = fetchWithCacheMock.mock.calls;
        expect(mockCalls.length).toBeGreaterThan(0);
        const firstCall = mockCalls[0] as [string, { body: string }, number];
        const requestBody = JSON.parse(firstCall[1].body);
        expect(requestBody.messages[0]).toEqual({
          role: 'developer',
          content: 'Follow these instructions carefully',
          name: 'dev_assistant',
        });
        expect(requestBody.max_completion_tokens).toBe(100);
        expect(requestBody.prediction).toEqual({
          content: 'Expected output',
          type: 'content',
        });
        // Verify temperature and max_tokens are not set for O1 models
        expect(requestBody.temperature).toBeUndefined();
        expect(requestBody.max_tokens).toBeUndefined();
      });

      it('should handle developer message with content array', async () => {
        const mockResponse = {
          data: {
            choices: [{ message: { content: 'Test output' } }],
            usage: { total_tokens: 10, prompt_tokens: 5, completion_tokens: 5 },
          },
          cached: false,
          status: 200,
          statusText: 'OK',
        };
        const fetchWithCacheMock = jest.mocked(fetchWithCache);
        fetchWithCacheMock.mockResolvedValue(mockResponse);

        const provider = new OpenAiChatCompletionProvider('o1-preview', {
          config: {
            developer_message: {
              content: [{ text: 'Follow these instructions', type: 'text' }],
            },
          },
        });

        await provider.callApi('Test prompt');

        const mockCalls = fetchWithCacheMock.mock.calls;
        expect(mockCalls.length).toBeGreaterThan(0);
        const firstCall = mockCalls[0] as [string, { body: string }, number];
        const requestBody = JSON.parse(firstCall[1].body);
        expect(requestBody.messages[0]).toEqual({
          role: 'developer',
          content: 'Follow these instructions',
        });
      });
    });

    describe('OpenAiChatCompletionProvider with new configuration options', () => {
      it('should handle streaming configuration', async () => {
        const mockResponse = {
          data: {
            choices: [{ message: { content: 'Test output' } }],
            usage: { total_tokens: 10, prompt_tokens: 5, completion_tokens: 5 },
          },
          cached: false,
          status: 200,
          statusText: 'OK',
        };
        const fetchWithCacheMock = jest.mocked(fetchWithCache);
        fetchWithCacheMock.mockResolvedValue(mockResponse);

        const provider = new OpenAiChatCompletionProvider('gpt-4o-mini', {
          config: {
            stream: true,
            stream_options: {
              include_usage: true,
            },
          },
        });

        await provider.callApi('Test prompt');

        const mockCalls = fetchWithCacheMock.mock.calls;
        expect(mockCalls.length).toBeGreaterThan(0);
        const firstCall = mockCalls[0] as [string, { body: string }, number];
        const requestBody = JSON.parse(firstCall[1].body);
        expect(requestBody.stream).toBe(true);
        expect(requestBody.stream_options).toEqual({ include_usage: true });
      });

      it('should handle audio configuration', async () => {
        const mockResponse = {
          data: {
            choices: [{ message: { content: 'Test output' } }],
            usage: { total_tokens: 10, prompt_tokens: 5, completion_tokens: 5 },
          },
          cached: false,
          status: 200,
          statusText: 'OK',
        };
        const fetchWithCacheMock = jest.mocked(fetchWithCache);
        fetchWithCacheMock.mockResolvedValue(mockResponse);

        const provider = new OpenAiChatCompletionProvider('gpt-4o-mini', {
          config: {
            modalities: ['text', 'audio'],
            audio: {
              format: 'mp3',
              voice: 'alloy',
            },
          },
        });

        await provider.callApi('Test prompt');

        const mockCalls = fetchWithCacheMock.mock.calls;
        expect(mockCalls.length).toBeGreaterThan(0);
        const firstCall = mockCalls[0] as [string, { body: string }, number];
        const requestBody = JSON.parse(firstCall[1].body);
        expect(requestBody.modalities).toEqual(['text', 'audio']);
        expect(requestBody.audio).toEqual({
          format: 'mp3',
          voice: 'alloy',
        });
      });

      it('should handle advanced options', async () => {
        const mockResponse = {
          data: {
            choices: [{ message: { content: 'Test output' } }],
            usage: { total_tokens: 10, prompt_tokens: 5, completion_tokens: 5 },
          },
          cached: false,
          status: 200,
          statusText: 'OK',
        };
        const fetchWithCacheMock = jest.mocked(fetchWithCache);
        fetchWithCacheMock.mockResolvedValue(mockResponse);

        const provider = new OpenAiChatCompletionProvider('gpt-4o-mini', {
          config: {
            logprobs: true,
            top_logprobs: 5,
            logit_bias: { '50256': -100 },
            n: 2,
            metadata: { session_id: 'test123' },
            parallel_tool_calls: true,
            user: 'test_user',
          },
        });

        await provider.callApi('Test prompt');

        const mockCalls = fetchWithCacheMock.mock.calls;
        expect(mockCalls.length).toBeGreaterThan(0);
        const firstCall = mockCalls[0] as [string, { body: string }, number];
        const requestBody = JSON.parse(firstCall[1].body);
        expect(requestBody.logprobs).toBe(true);
        expect(requestBody.top_logprobs).toBe(5);
        expect(requestBody.logit_bias).toEqual({ '50256': -100 });
        expect(requestBody.n).toBe(2);
        expect(requestBody.metadata).toEqual({ session_id: 'test123' });
        expect(requestBody.parallel_tool_calls).toBe(true);
        expect(requestBody.user).toBe('test_user');
      });
    });
  });
});
