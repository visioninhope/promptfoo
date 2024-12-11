"""Tests for the promptfoo configuration generation agent."""

from unittest.mock import Mock, patch

import pytest
from promptfoo_rag.agent import PromptfooConfigAgent


@pytest.fixture
def mock_llm_response() -> str:
    """Provide a mock LLM response based on real examples."""
    return """
    description: "Customer Service Chatbot Test Suite"
    providers:
      openai:
        api_key: ${OPENAI_API_KEY}

    prompts:
      - provider: openai
        text: |
          You are a helpful customer service assistant.
          Customer: {{query}}
          Assistant:

    tests:
      - description: "Test polite greeting"
        vars:
          query: "Hello, how are you today?"
        assert:
          - type: contains
            value: "Hello"
          - type: llm-rubric
            value: "Response should be polite and professional"
          - type: similar
            value: "A polite greeting that acknowledges the customer"

    evaluateOptions:
      maxConcurrency: 5
      showProgressBar: true
      cache: true
    """


@patch("promptfoo_rag.agent.ChatOpenAI")
def test_generate_config_with_real_requirements(
    mock_chat, test_examples_dir, test_schema, mock_llm_response
) -> None:
    """Test configuration generation with real-world requirements."""
    # Setup mock LLM response
    mock_message = Mock()
    mock_message.content = mock_llm_response
    mock_chat.return_value.invoke.return_value = mock_message

    with patch("promptfoo_rag.config.settings") as mock_settings:
        mock_settings.EXAMPLES_DIR = test_examples_dir
        mock_settings.SCHEMA_PATH.exists.return_value = True
        mock_settings.SCHEMA_PATH.open.return_value.__enter__.return_value.read.return_value = test_schema

        agent = PromptfooConfigAgent()
        requirements = """
        Create a config for testing a customer service chatbot that should:
        1. Use GPT-4 as the model
        2. Test responses for common customer queries
        3. Verify that responses are always polite
        4. Check that product information is accurate
        """

        config, is_valid, errors = agent.generate_config(requirements)

        assert config == mock_llm_response
        assert is_valid, f"Validation failed with errors: {errors}"
        assert not errors
