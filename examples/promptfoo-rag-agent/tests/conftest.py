"""Test configuration and fixtures for the promptfoo RAG agent."""

import json
from pathlib import Path
from typing import Any, Dict

import pytest
import yaml


@pytest.fixture
def test_examples_dir(tmp_path: Path) -> Path:
    """Create a temporary directory with test example files.

    Returns:
        Path to temporary directory containing test YAML files.
    """
    examples_dir = tmp_path / "examples"
    examples_dir.mkdir()

    # Copy some real examples from the examples directory
    examples = {
        "chatbot.yaml": """
prompts:
  - provider: openai
    text: |
      You are a helpful customer service assistant.
      Customer: {{query}}
      Assistant:

tests:
  - description: Test polite greeting
    vars:
      query: Hello, how are you today?
    assert:
      - type: contains
        value: Hello
      - type: llm-rubric
        value: Response should be polite and professional
""",
        "bedrock.yaml": """
providers:
  bedrock:
    region: us-east-1
    profile: default

prompts:
  - provider: bedrock
    model: anthropic.claude-v2
    text: |
      Human: {{input}}
      Assistant:

tests:
  - description: Test code generation
    vars:
      input: Write a Python function to calculate fibonacci numbers
    assert:
      - type: contains
        value: def fibonacci
""",
    }

    for filename, content in examples.items():
        with open(examples_dir / filename, "w") as f:
            f.write(content)

    return examples_dir


@pytest.fixture
def test_schema() -> Dict[str, Any]:
    """Load the official promptfoo schema.

    Returns:
        Dictionary containing the official JSON schema.
    """
    schema_path = Path("site/static/config-schema.json")
    with open(schema_path, "r") as f:
        return json.load(f)
