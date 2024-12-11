"""Tests for the validation utilities."""

import json
from pathlib import Path

import pytest
from promptfoo_rag.utils.validation import load_schema, validate_yaml


def test_validate_yaml_valid(test_schema) -> None:
    """Test validation of valid YAML content."""
    valid_yaml = """
    prompts:
      - provider: openai
        text: |
          You are a helpful assistant.
          User: {{input}}
          Assistant:

    tests:
      - description: Test basic response
        vars:
          input: Hello
        assert:
          - type: contains
            value: hello
          - type: similar
            value: A polite greeting
            threshold: 0.7
    """

    is_valid, errors = validate_yaml(valid_yaml, test_schema)
    assert is_valid, f"Validation failed with errors: {errors}"
    assert not errors


def test_validate_yaml_with_providers(test_schema) -> None:
    """Test validation of config with provider settings."""
    yaml_with_providers = """
    providers:
      - id: bedrock:anthropic.claude-3-sonnet-20240229-v1:0
        config:
          temperature: 0.7
          max_tokens: 256
          region: us-west-2
    
    prompts:
      - provider: bedrock
        text: Write a tweet about {{topic}}

    tests:
      - vars:
          topic: AI safety
        assert:
          - type: contains
            value: AI
    """

    is_valid, errors = validate_yaml(yaml_with_providers, test_schema)
    assert is_valid, f"Validation failed with errors: {errors}"
    assert not errors


def test_validate_yaml_invalid(test_schema) -> None:
    """Test validation of invalid YAML content."""
    invalid_yaml = """
    prompts:
      - invalid_field: this should fail
        # Missing required 'text' field
    """

    is_valid, errors = validate_yaml(invalid_yaml, test_schema)
    assert not is_valid
    assert errors
    assert "error" in errors
