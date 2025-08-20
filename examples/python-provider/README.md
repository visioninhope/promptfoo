# python-provider

This example demonstrates how to create a custom Python provider for promptfoo that integrates with the OpenAI API.

You can run this example with:

```bash
npx promptfoo@latest init --example python-provider
```

## Overview

The Python provider allows you to use Python code as a provider in promptfoo evaluations. This is useful when you need to:

1. Call APIs from Python libraries
2. Implement custom logic before or after calling LLMs
3. Process responses in specific ways
4. **Track token usage and costs**
5. Implement complex pricing models

## Environment Variables

This example requires the following environment variable:

- `OPENAI_API_KEY` - Your OpenAI API key

You can set this in a `.env` file or directly in your environment.

## Requirements

- Python with the OpenAI package installed (`pip install openai`)

## Files

- `provider.py` - The Python provider implementation that calls OpenAI's API
- `promptfooconfig.yaml` - Configuration for promptfoo evaluation with proper YAML schema reference
- `configs/` directory:
  - `fileConfig.yaml` - YAML configuration for model settings
  - `fileConfig.js` - JavaScript configuration for formatting options
  - `fileConfig.py` - Python configuration for additional parameters

## Implementation Details

The Python provider is defined in `provider.py` and includes:

1. A `call_api` function that makes API calls to OpenAI
2. Token usage extraction from the API response
3. **Cost calculation based on configuration**
4. Multiple sample functions showing different ways to call the API

By default, the example is configured to use `gpt-4.1-mini` model, but you can modify it to use other models as needed.

## Cost Tracking

This example demonstrates how to implement cost tracking in Python providers. The provider supports two pricing models:

### Option 1: Per-token pricing (most accurate)

```yaml
providers:
  - id: file://provider.py
    config:
      cost_per_input_token: 0.00001 # $0.01 per 1K input tokens
      cost_per_output_token: 0.00003 # $0.03 per 1K output tokens
```

### Option 2: Flat rate per request

```yaml
providers:
  - id: file://provider.py
    config:
      cost_per_request: 0.05 # $0.05 per API call
```

The provider calculates costs automatically and includes them in the response:

```python
def call_api(prompt, options, context):
    # ... make API call ...

    # Calculate cost based on config
    config = options.get("config", {})
    if "cost_per_request" in config:
        cost = config["cost_per_request"]
    elif "cost_per_input_token" in config and token_usage:
        cost = (token_usage["prompt"] * config["cost_per_input_token"] +
                token_usage["completion"] * config["cost_per_output_token"])

    return {
        "output": response_text,
        "tokenUsage": token_usage,
        "cost": cost  # promptfoo will track this
    }
```

## Expected Output

When you run this example, you'll see:

1. The prompts being submitted to your Python provider
2. Responses from the OpenAI API
3. Token usage statistics for each completion
4. Evaluation results in a table format

## File Reference Configuration

The example demonstrates how to load configuration values from external files using the `file://` protocol directly in the `promptfooconfig.yaml` file. It shows three main file types:

1. **YAML file** (`configs/fileConfig.yaml`): Contains model settings like temperature and max tokens
2. **JavaScript file** (`configs/fileConfig.js`): Provides formatting options through a function export
3. **Python file** (`configs/fileConfig.py`): Supplies additional parameters through a Python function

The provider supports loading from:

- JSON files (`.json`)
- YAML files (`.yaml`, `.yml`)
- JavaScript files (`.js`, `.mjs`, `.ts`, `.cjs`)
- Python files (`.py`)
- Text files (`.txt`, `.md`)

You can see how this works in the `promptfooconfig.yaml` file:

```yaml
providers:
  - id: 'file://provider.py:call_api'
    config:
      # YAML
      settings: 'file://configs/fileConfig.yaml'
      # JavaScript file
      formatting: 'file://configs/fileConfig.js:getFormatConfig'
      nested: # Python file
        parameters: 'file://configs/fileConfig.py:get_params'
```

Run the example with:

```bash
npx promptfoo@latest evaluate -c examples/python-provider/promptfooconfig.yaml
```

## Learn More

For more information on creating custom providers, see the [promptfoo documentation](https://promptfoo.dev/docs/providers/python/).
