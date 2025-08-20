# custom-provider-typescript (Custom Provider Typescript)

You can run this example with:

```bash
npx promptfoo@latest init --example custom-provider-typescript
```

This example shows how to create a custom API provider in TypeScript with **token cost tracking**.

## Features

- Custom TypeScript provider (`customProvider.ts`)
- Token cost calculation with two options:
  - **Per-token pricing**: Most accurate for usage-based billing
  - **Per-request pricing**: Simple flat rate per API call
- CSV test cases

## Cost Configuration

The provider supports cost tracking through configuration:

```yaml
providers:
  - id: file://customProvider.ts
    config:
      # Option 1: Cost per token (recommended)
      cost_per_input_token: 0.00001 # $0.01 per 1K input tokens
      cost_per_output_token: 0.00003 # $0.03 per 1K output tokens

      # Option 2: Flat cost per request
      cost_per_request: 0.05
```

The provider automatically calculates costs based on actual token usage and returns it in the response.

Run:

```
promptfoo eval
```

After evaluation, promptfoo will show cost tracking information in the results.

Full command-line equivalent:

```
promptfoo eval --prompts prompts.txt --tests vars.csv --providers customProvider.ts --output output.json
```
