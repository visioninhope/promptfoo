---
sidebar_position: 1
---

# OpenAI

To use the OpenAI API, set the `OPENAI_API_KEY` environment variable, specify via `apiKey` field in the configuration file or pass the API key as an argument to the constructor.

Example:

```sh
export OPENAI_API_KEY=your_api_key_here
```

The OpenAI provider supports the following model formats:

- `openai:chat` - defaults to `gpt-4o-mini`
- `openai:completion` - defaults to `text-davinci-003`
- `openai:<model name>` - uses a specific model name (mapped automatically to chat or completion endpoint)
- `openai:chat:<model name>` - uses any model name against the `/v1/chat/completions` endpoint
- `openai:chat:ft:gpt-4o-mini:company-name:ID` - example of a fine-tuned chat completion model
- `openai:completion:<model name>` - uses any model name against the `/v1/completions` endpoint
- `openai:embeddings:<model name>` - uses any model name against the `/v1/embeddings` endpoint
- `openai:assistant:<assistant id>` - use an assistant

The `openai:<endpoint>:<model name>` construction is useful if OpenAI releases a new model,
or if you have a custom model.
For example, if OpenAI releases `gpt-5` chat completion,
you could begin using it immediately with `openai:chat:gpt-5`.

The OpenAI provider supports a handful of [configuration options](https://github.com/promptfoo/promptfoo/blob/main/src/providers/openai.ts#L14-L32), such as `temperature`, `functions`, and `tools`, which can be used to customize the behavior of the model like so:

The OpenAI provider supports a comprehensive set of configuration options that can be used to customize the behavior of the model. Here are the main categories:

### Basic Configuration

| Parameter      | Description                                 |
| -------------- | ------------------------------------------- |
| `apiKey`       | Your OpenAI API key                         |
| `apiKeyEnvar`  | Environment variable containing the API key |
| `apiHost`      | Custom API host                             |
| `apiBaseUrl`   | Custom API base URL                         |
| `organization` | OpenAI organization ID                      |
| `headers`      | Additional request headers                  |

### Core Model Parameters

| Parameter           | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `temperature`       | Controls randomness (0-2). Not supported by O1 models        |
| `max_tokens`        | Maximum tokens for completion. Not compatible with O1 models |
| `top_p`             | Alternative to temperature for nucleus sampling              |
| `frequency_penalty` | Penalizes token frequency (-2.0 to 2.0)                      |
| `presence_penalty`  | Penalizes token presence (-2.0 to 2.0)                       |
| `seed`              | For deterministic sampling                                   |

### O1-Specific Options

| Parameter               | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| `developer_message`     | Instructions for O1 models (replaces system messages) |
| `reasoning_effort`      | Controls reasoning effort ('low', 'medium', 'high')   |
| `max_completion_tokens` | Token limit for O1 model completions                  |
| `prediction`            | Static predicted output for faster responses          |

### Advanced Features

| Parameter             | Description                       |
| --------------------- | --------------------------------- |
| `stream`              | Enable streaming responses        |
| `stream_options`      | Configure streaming behavior      |
| `modalities`          | Output types (text/audio)         |
| `audio`               | Audio output configuration        |
| `logprobs`            | Return token log probabilities    |
| `top_logprobs`        | Number of top log probabilities   |
| `logit_bias`          | Token likelihood modification     |
| `metadata`            | Custom tags for filtering         |
| `parallel_tool_calls` | Enable parallel function calls    |
| `n`                   | Number of completions to generate |
| `user`                | End-user identifier               |

### Response Format Options

| Parameter         | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `response_format` | Control output format (text/json_object/json_schema) |
| `service_tier`    | Latency tier selection                               |
| `store`           | Enable output storage                                |

Example configuration:

```yaml
providers:
  - id: openai:gpt-4o-mini
    config:
      temperature: 0
      max_tokens: 1024
```

### O1 Model Configuration

O1 series models have specific configuration requirements:

```yaml
providers:
  - id: openai:o1-preview
    config:
      max_completion_tokens: 25000 # Instead of max_tokens
      developer_message:
        content: 'Follow these instructions carefully'
        name: 'dev_assistant'
      reasoning_effort: 'high'
      prediction:
        content: 'Expected output'
        type: 'content'
```

Note: O1 models do not support `temperature` and use `max_completion_tokens` instead of `max_tokens`.

## Formatting chat messages

For information on setting up chat conversation, see [chat threads](/docs/configuration/chat).

## Configuring parameters

The `providers` list takes a `config` key that allows you to set parameters like `temperature`, `max_tokens`, and [others](https://platform.openai.com/docs/api-reference/chat/create#chat/create-temperature). For example:

```yaml
providers:
  - id: openai:gpt-4o-mini
    config:
      temperature: 0
      max_tokens: 128
      apiKey: sk-abc123
```

Supported parameters include:

| Parameter               | Description                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apiBaseUrl`            | The base URL of the OpenAI API, please also read `OPENAI_BASE_URL` below.                                                                                                             |
| `apiHost`               | The hostname of the OpenAI API, please also read `OPENAI_API_HOST` below.                                                                                                             |
| `apiKey`                | Your OpenAI API key, equivalent to `OPENAI_API_KEY` environment variable                                                                                                              |
| `apiKeyEnvar`           | An environment variable that contains the API key                                                                                                                                     |
| `best_of`               | Controls the number of alternative outputs to generate and select from.                                                                                                               |
| `frequency_penalty`     | Applies a penalty to frequent tokens, making them less likely to appear in the output.                                                                                                |
| `function_call`         | Controls whether the AI should call functions. Can be either 'none', 'auto', or an object with a `name` that specifies the function to call.                                          |
| `functions`             | Allows you to define custom functions. Each function should be an object with a `name`, optional `description`, and `parameters`.                                                     |
| `functionToolCallbacks` | A map of function tool names to function callbacks. Each callback should accept a string and return a string or a `Promise<string>`.                                                  |
| `headers`               | Additional headers to include in the request.                                                                                                                                         |
| `max_tokens`            | Controls the maximum length of the output in tokens.                                                                                                                                  |
| `organization`          | Your OpenAI organization key.                                                                                                                                                         |
| `passthrough`           | Additional parameters to pass through to the API.                                                                                                                                     |
| `presence_penalty`      | Applies a penalty to new tokens (tokens that haven't appeared in the input), making them less likely to appear in the output.                                                         |
| `response_format`       | Specifies the desired output format, including `json_object` and `json_schema`. Can also be specified in the prompt config. If specified in both, the prompt config takes precedence. |
| `seed`                  | Seed used for deterministic output.                                                                                                                                                   |
| `stop`                  | Defines a list of tokens that signal the end of the output.                                                                                                                           |
| `temperature`           | Controls the randomness of the AI's output. Higher values (close to 1) make the output more random, while lower values (close to 0) make it more deterministic.                       |
| `tool_choice`           | Controls whether the AI should use a tool. See [OpenAI Tools documentation](https://platform.openai.com/docs/api-reference/chat/create#chat-create-tools)                             |
| `tools`                 | Allows you to define custom tools. See [OpenAI Tools documentation](https://platform.openai.com/docs/api-reference/chat/create#chat-create-tools)                                     |
| `top_p`                 | Controls the nucleus sampling, a method that helps control the randomness of the AI's output.                                                                                         |

Here are the type declarations of `config` parameters:

```typescript
interface OpenAiConfig {
  // Completion parameters
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  best_of?: number;
  functions?: OpenAiFunction[];
  function_call?: 'none' | 'auto' | { name: string };
  tools?: OpenAiTool[];
  tool_choice?: 'none' | 'auto' | 'required' | { type: 'function'; function?: { name: string } };
  response_format?: { type: 'json_object' | 'json_schema'; json_schema?: object };
  stop?: string[];
  seed?: number;
  passthrough?: object;

  // Function tool callbacks
  functionToolCallbacks?: Record<
    OpenAI.FunctionDefinition['name'],
    (arg: string) => Promise<string>
  >;

  // General OpenAI parameters
  apiKey?: string;
  apiKeyEnvar?: string;
  apiHost?: string;
  apiBaseUrl?: string;
  organization?: string;
  headers?: { [key: string]: string };
}
```

## o1 Series Models (Beta)

The o1 series models handle tokens differently than other OpenAI models. While standard models use `max_tokens` to control output length, o1 models use `max_completion_tokens` to control both reasoning and output tokens:

```yaml
providers:
  - id: openai:o1-preview
    config:
      max_completion_tokens: 25000 # Can also be set via OPENAI_MAX_COMPLETION_TOKENS env var
```

o1 models generate internal "reasoning tokens" that:

- Are not visible in the output
- Count towards token usage and billing
- Occupy space in the context window

Both `o1-preview` and `o1-mini` models have a 128,000 token context window and work best with straightforward prompts. OpenAI recommends reserving at least 25,000 tokens for reasoning and outputs when starting with these models.

## Images

### Sending images in prompts

You can include images in the prompt by using content blocks. For example, here's an example config:

```yaml
prompts:
  - prompt.json

providers:
  - openai:gpt-4o

tests:
  - vars:
      question: 'What do you see?'
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg'
  # ...
```

And an example `prompt.json`:

```json
[
  {
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "{{question}}"
      },
      {
        "type": "image_url",
        "image_url": {
          "url": "{{url}}"
        }
      }
    ]
  }
]
```

See the [OpenAI vision example](https://github.com/promptfoo/promptfoo/tree/main/examples/openai-vision).

### Generating images

OpenAI supports Dall-E generations via `openai:image:dall-e-3`. See the [OpenAI Dall-E example](https://github.com/promptfoo/promptfoo/tree/main/examples/openai-dalle-images).

```yaml
prompts:
  - 'In the style of Van Gogh: {{subject}}'
  - 'In the style of Dali: {{subject}}'

providers:
  - openai:image:dall-e-3

tests:
  - vars:
      subject: bananas
  - vars:
      subject: new york city
```

To display images in the web viewer, wrap vars or outputs in markdown image tags like so:

```markdown
![](/path/to/myimage.png)
```

Then, enable 'Render markdown' under Table Settings.

## Using tools and functions

### Using tools

Tools are the preferred way to enable function calling capabilities. The model may return tool calls in two formats:

1. An array of tool calls: `[{type: 'function', function: {...}}]`
2. A message with tool calls: `{content: '...', tool_calls: [{type: 'function', function: {...}}]}`

Example configuration:

```yaml
providers:
  - id: openai:chat:gpt-4o-mini
    config:
      tools:
        - type: 'function'
          function:
            name: 'get_current_weather'
            description: 'Get the current weather'
            parameters:
              type: 'object'
              properties:
                location:
                  type: 'string'
                  description: 'City and state'
                unit:
                  type: 'string'
                  enum: ['celsius', 'fahrenheit']
              required: ['location']
      tool_choice: 'auto' # Options: 'none', 'auto', 'required', or {type: 'function', function: {name: 'specific_function'}}
      parallel_tool_calls: true # Enable parallel function calling
```

### Using functions (Deprecated)

The `functions` and `function_call` options are deprecated in favor of `tools` and `tool_choice`. They are still supported but we recommend using tools instead:

```yaml
prompts:
  - file://prompt.txt
providers:
  - id: openai:chat:gpt-4o-mini
    // highlight-start
    config:
      functions:
        [
          {
            'name': 'get_current_weather',
            'description': 'Get the current weather in a given location',
            'parameters':
              {
                'type': 'object',
                'properties':
                  {
                    'location':
                      {
                        'type': 'string',
                        'description': 'The city and state, e.g. San Francisco, CA',
                      },
                    'unit': { 'type': 'string', 'enum': ['celsius', 'fahrenheit'] },
                  },
                'required': ['location'],
              },
          },
        ]
    // highlight-end
tests:
  - vars:
      city: Boston
    assert:
      // highlight-next-line
      - type: is-valid-openai-function-call
  - vars:
      city: New York
  # ...
```

Sometimes OpenAI function calls don't match `functions` schemas. Use [`is-valid-openai-function-call`](/docs/configuration/expected-outputs/deterministic#is-valid-openai-function-call) assertions to enforce an exact schema match between function calls and the function definition.

To further test function call definitions, you can use the `javascript` assertion and/or `transform` directives. For example:

```yaml
tests:
  - vars:
      city: Boston
    assert:
      - type: is-valid-openai-function-call
      - type: javascript
        value: output.name === 'get_current_weather'
      - type: javascript
        value: JSON.parse(output.arguments).location === 'Boston, MA'

  - vars:
      city: New York
    # transform returns only the 'name' property for this test case
    transform: output.name
    assert:
      - type: is-json
      - type: similar
        value: NYC
```

### Loading tools/functions from a file

Instead of duplicating function definitions across multiple configurations, you can reference an external YAML (or JSON) file that contains your functions. This allows you to maintain a single source of truth for your functions, which is particularly useful if you have multiple versions or regular changes to definitions.

To load your functions from a file, specify the file path in your provider configuration like so:

```yaml
providers:
  - file://./path/to/provider_with_function.yaml
```

You can also use a pattern to load multiple files:

```yaml
providers:
  - file://./path/to/provider_*.yaml
```

Here's an example of how your `provider_with_function.yaml` might look:

```yaml
id: openai:chat:gpt-4o-mini
config:
  functions:
    - name: get_current_weather
      description: Get the current weather in a given location
      parameters:
        type: object
        properties:
          location:
            type: string
            description: The city and state, e.g. San Francisco, CA
          unit:
            type: string
            enum:
              - celsius
              - fahrenheit
            description: The unit in which to return the temperature
        required:
          - location
```

## Using `response_format`

Promptfoo supports the `response_format` parameter, which allows you to specify the expected output format.

`response_format` can be included in the provider config, or in the prompt config.

#### Prompt config example

```yaml
prompts:
  - label: 'Prompt #1'
    raw: 'You are a helpful math tutor. Solve {{problem}}'
    config:
      response_format:
        type: json_schema
        json_schema: ...
```

#### Provider config example

```yaml
providers:
  - id: openai:chat:gpt-4o-mini
    config:
      response_format:
        type: json_schema
        json_schema: ...
```

#### External file references

To make it easier to manage large JSON schemas, external file references are supported:

```yaml
config:
  response_format: file://./path/to/response_format.json
```

## Supported environment variables

These OpenAI-related environment variables are supported:

| Variable                       | Description                | Default |
| ------------------------------ | -------------------------- | ------- |
| `OPENAI_API_KEY`               | API key                    | -       |
| `OPENAI_ORGANIZATION`          | Organization ID            | -       |
| `OPENAI_API_HOST`              | Custom API host            | -       |
| `OPENAI_BASE_URL`              | Custom base URL            | -       |
| `OPENAI_TEMPERATURE`           | Temperature setting        | 0       |
| `OPENAI_MAX_TOKENS`            | Max tokens (non-O1)        | 1024    |
| `OPENAI_MAX_COMPLETION_TOKENS` | Max completion tokens (O1) | -       |
| `OPENAI_TOP_P`                 | Top-p setting              | 1       |
| `OPENAI_PRESENCE_PENALTY`      | Presence penalty           | 0       |
| `OPENAI_FREQUENCY_PENALTY`     | Frequency penalty          | 0       |
| `PROMPTFOO_DELAY_MS`           | Delay between API calls    | 0       |
| `PROMPTFOO_REQUEST_BACKOFF_MS` | Request retry backoff      | 5000    |

## Evaluating assistants

To test out an Assistant via OpenAI's Assistants API, first create an Assistant in the [API playground](https://platform.openai.com/playground).

Set functions, code interpreter, and files for retrieval as necessary.

Then, include the assistant in your config:

```yaml
prompts:
  - 'Write a tweet about {{topic}}'
providers:
  - openai:assistant:asst_fEhNN3MClMamLfKLkIaoIpgZ
tests:
  - vars:
      topic: bananas
  # ...
```

Code interpreter, function calls, and retrievals will be included in the output alongside chat messages. Note that the evaluator creates a new thread for each eval.

The following properties can be overwritten in provider config:

- `model` - OpenAI model to use
- `instructions` - System prompt
- `tools` - Enabled [tools](https://platform.openai.com/docs/api-reference/runs/createRun)
- `thread.messages` - A list of message objects that the thread is created with.
- `temperature` - Temperature for the model
- `toolChoice` - Controls whether the AI should use a tool
- `tool_resources` - Tool resources to include in the thread - see [Assistant v2 tool resources](https://platform.openai.com/docs/assistants/migration)
- `attachments` - File attachments to include in messages - see [Assistant v2 attachments](https://platform.openai.com/docs/assistants/migration)

Here's an example of a more detailed config:

```yaml
prompts:
  - 'Write a tweet about {{topic}}'
providers:
  // highlight-start
  - id: openai:assistant:asst_fEhNN3MClMamLfKLkIaoIpgZ
    config:
      model: gpt-4o
      instructions: "You always speak like a pirate"
      temperature: 0.2
      toolChoice:
        type: file_search
      tools:
        - type: code_interpreter
        - type: file_search
      thread:
        messages:
          - role: user
            content: "Hello world"
          - role: assistant
            content: "Greetings from the high seas"
  // highlight-end
tests:
  - vars:
      topic: bananas
  # ...
```

### Automatically handling function tool calls

You can specify JavaScript callbacks that are automatically called to create
the output of a function tool call.

This requires defining your config in a JavaScript file instead of YAML.

```js
module.exports = /** @type {import('promptfoo').TestSuiteConfig} */ ({
  prompts: 'Please add the following numbers together: {{a}} and {{b}}',
  providers: [
    {
      id: 'openai:assistant:asst_fEhNN3MClMamLfKLkIaoIpgZ',
      config:
        /** @type {InstanceType<import('promptfoo')["providers"]["OpenAiAssistantProvider"]>["config"]} */ ({
          model: 'gpt-4o',
          instructions: 'You can add two numbers together using the `addNumbers` tool',
          tools: [
            {
              type: 'function',
              function: {
                name: 'addNumbers',
                description: 'Add two numbers together',
                parameters: {
                  type: 'object',
                  properties: {
                    a: { type: 'number' },
                    b: { type: 'number' },
                  },
                  required: ['a', 'b'],
                },
              },
            },
          ],
          /**
           * Map of function tool names to function callback.
           */
          functionToolCallbacks: {
            // this function should accept a string, and return a string
            // or a `Promise<string>`.
            addNumbers: (parametersJsonString) => {
              const { a, b } = JSON.parse(parametersJsonString);
              return JSON.stringify(a + b);
            },
          },
        }),
    },
  ],
  tests: [
    {
      vars: { a: 5, b: 6 },
    },
  ],
});
```

## Troubleshooting

### OpenAI rate limits

There are a few things you can do if you encounter OpenAI rate limits (most commonly with GPT-4):

1. **Reduce concurrency to 1** by setting `--max-concurrency 1` in the CLI, or by setting `evaluateOptions.maxConcurrency` in the config.
2. **Set a delay between requests** by setting `--delay 3000` (3000 ms) in the CLI,
   or by setting `evaluateOptions.delay` in the config,
   or with the environment variable `PROMPTFOO_DELAY_MS` (all values are in milliseconds).
3. **Adjust the exponential backoff for failed requests** by setting the environment variable `PROMPTFOO_REQUEST_BACKOFF_MS`. This defaults to 5000 milliseconds and retries exponential up to 4 times. You can increase this value if requests are still failing, but note that this can significantly increase end-to-end test time.

### OpenAI flakiness

To retry HTTP requests that are Internal Server errors, set the `PROMPTFOO_RETRY_5XX` environment variable to `1`.
