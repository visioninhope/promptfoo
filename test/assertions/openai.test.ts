import { runAssertion } from '../../src/assertions';
import { OpenAiChatCompletionProvider } from '../../src/providers/openai';
import type { AtomicTestCase, GradingResult } from '../../src/types';

describe('is-valid-openai-function-call assertion', () => {
  it('should pass for a valid function call with correct arguments', async () => {
    const output = { arguments: '{"x": 10, "y": 20}', name: 'add' };

    const provider = new OpenAiChatCompletionProvider('foo', {
      config: {
        functions: [
          {
            name: 'add',
            parameters: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
              },
              required: ['x', 'y'],
            },
          },
        ],
      },
    });
    const providerResponse = { output };
    const result: GradingResult = await runAssertion({
      prompt: 'Some prompt',
      provider,
      assertion: {
        type: 'is-valid-openai-function-call',
      },
      test: {} as AtomicTestCase,
      providerResponse,
    });

    expect(result).toMatchObject({
      pass: true,
      reason: 'Assertion passed',
    });
  });

  it('should fail for an invalid function call with incorrect arguments', async () => {
    const output = { arguments: '{"x": "10", "y": 20}', name: 'add' };

    const result: GradingResult = await runAssertion({
      prompt: 'Some prompt',
      provider: new OpenAiChatCompletionProvider('foo', {
        config: {
          functions: [
            {
              name: 'add',
              parameters: {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                },
                required: ['x', 'y'],
              },
            },
          ],
        },
      }),
      assertion: {
        type: 'is-valid-openai-function-call',
      },
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toMatchObject({
      pass: false,
      reason: expect.stringContaining('Call to "add" does not match schema'),
    });
  });
});

describe('is-valid-openai-tools-call assertion', () => {
  it('should pass for a valid tools call with correct arguments', async () => {
    const output = [
      { type: 'function', function: { arguments: '{"x": 10, "y": 20}', name: 'add' } },
    ];

    const result: GradingResult = await runAssertion({
      prompt: 'Some prompt',
      provider: new OpenAiChatCompletionProvider('foo', {
        config: {
          tools: [
            {
              type: 'function',
              function: {
                name: 'add',
                parameters: {
                  type: 'object',
                  properties: {
                    x: { type: 'number' },
                    y: { type: 'number' },
                  },
                  required: ['x', 'y'],
                },
              },
            },
          ],
        },
      }),
      assertion: {
        type: 'is-valid-openai-tools-call',
      },
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toMatchObject({
      pass: true,
      reason: 'Assertion passed',
    });
  });

  it('should fail for an invalid tools call with incorrect arguments', async () => {
    const output = [
      { type: 'function', function: { arguments: '{"x": "foobar", "y": 20}', name: 'add' } },
    ];

    const result: GradingResult = await runAssertion({
      prompt: 'Some prompt',
      provider: new OpenAiChatCompletionProvider('foo', {
        config: {
          tools: [
            {
              type: 'function',
              function: {
                name: 'add',
                parameters: {
                  type: 'object',
                  properties: {
                    x: { type: 'number' },
                    y: { type: 'number' },
                  },
                  required: ['x', 'y'],
                },
              },
            },
          ],
        },
      }),
      assertion: {
        type: 'is-valid-openai-tools-call',
      },
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toMatchObject({
      pass: false,
      reason: expect.stringContaining('Call to "add" does not match schema'),
    });
  });
});
