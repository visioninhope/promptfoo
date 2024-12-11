# Promptfoo RAG Agent Example

This example demonstrates how to use LangChain to create a RAG (Retrieval Augmented Generation) agent that generates valid promptfoo configuration files. The agent includes both a FastAPI server and a chat interface for interactive config generation.

## Features

- Uses LangChain's latest LCEL (LangChain Expression Language) syntax
- Implements RAG workflow with FAISS vector store
- Validates configurations against the official promptfoo schema
- Supports all promptfoo configuration options and providers
- Includes comprehensive test suite
- Provides FastAPI server for config generation
- Includes a web-based chat interface
- Supports multi-turn conversations with memory

## Prerequisites

1. Set up your environment variables:

```bash
export OPENAI_API_KEY="your_api_key"
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

## Project Structure

```
examples/promptfoo-rag-agent/
├── src/
│   ├── agent.py           # Main RAG agent implementation
│   ├── config.py          # Configuration settings
│   ├── server.py          # FastAPI server implementation
│   └── utils/
│       ├── validation.py  # Schema validation utilities
│       └── vectorstore.py # Vector store management
├── static/
│   └── index.html         # Web-based chat interface
├── tests/                 # Comprehensive test suite
└── requirements.txt       # Python dependencies
```

## Usage

### 1. Start the Server

```bash
# Start the FastAPI server
python run.py
```

### 2. Launch the Chat Interface

```bash
# Serve the static files (in a new terminal)
python -m http.server 8080 --directory static
```

Then open `http://localhost:8080` in your browser.

### 3. Generate Configs via Chat

To generate a config, start your message with "generate config" followed by your requirements. For example:

```
generate config for a customer service chatbot that:
1. Uses GPT-4 as the model
2. Tests responses for common customer queries
3. Verifies that responses are always polite
4. Checks that product information is accurate
```

### 4. Programmatic Usage

```python
from src.agent import PromptfooConfigAgent

agent = PromptfooConfigAgent()

# Generate a config
config, is_valid, errors = agent.generate_config(requirements)

if is_valid:
    print("Generated valid config:", config)
else:
    print("Validation errors:", errors)
```

### 5. API Endpoints

- `POST /chat`
  ```json
  {
    "session_id": "unique_session_id",
    "message": "Your message here"
  }
  ```

- `GET /chat/{session_id}/history`
  - Returns chat history for the given session

## How It Works

1. **Retrieval**: The agent indexes example promptfoo configurations using FAISS vector store and sentence transformers for embeddings.

2. **Generation**: When given requirements, the agent:
   - Retrieves relevant example configurations
   - Uses GPT-4 to generate a new configuration based on the examples and requirements
   - Validates the generated config against the official promptfoo schema

3. **Chat Interface**: The web interface provides:
   - Real-time config generation
   - Syntax highlighting for YAML
   - Validation status display
   - Multi-turn conversation support

## Example Configurations

The agent learns from various example configurations in the promptfoo repository, including:

- Basic prompt testing
- Provider configurations (OpenAI, Anthropic, Bedrock, etc.)
- Advanced assertions and evaluations
- Tool usage and structured outputs
- Vision and multimodal examples

## Advanced Features

1. Custom provider configuration:

```python
requirements = """
Create a config using AWS Bedrock with Claude 3 Sonnet:
1. Set temperature to 0.7
2. Use us-west-2 region
3. Include factuality checks
"""
```

2. Complex test scenarios:

```python
requirements = """
Create an evaluation suite that:
1. Tests multiple model providers
2. Uses embedding-based similarity checks
3. Includes red team testing
4. Validates structured JSON outputs
"""
```

## Development

1. Run tests:

```bash
pytest
```

2. Format code:

```bash
ruff format src tests
```

3. Run linting:

```bash
ruff check src tests
```

## Contributing

Feel free to:

- Add more example configurations
- Enhance the RAG retrieval logic
- Add support for new promptfoo features
- Improve the validation system
- Enhance the chat interface

## See Also

- [Promptfoo Documentation](https://www.promptfoo.dev/docs)
- [Configuration Schema](https://www.promptfoo.dev/docs/configuration/schema)
- [Provider Configuration](https://www.promptfoo.dev/docs/providers)
