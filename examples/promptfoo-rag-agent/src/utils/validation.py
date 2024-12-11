"""Validation utilities for promptfoo configurations.

This module provides functions to load and validate YAML configurations against
the promptfoo JSON schema.
"""

import json
from pathlib import Path
from typing import Any, Dict, Tuple

import yaml
from jsonschema import ValidationError, validate


def load_schema(schema_path: Path) -> Dict[str, Any]:
    """Load and parse a JSON schema file.

    Args:
        schema_path: Path to the JSON schema file.

    Returns:
        The parsed JSON schema as a dictionary.

    Raises:
        JSONDecodeError: If the schema file contains invalid JSON.
        FileNotFoundError: If the schema file doesn't exist.
    """
    with open(schema_path, "r") as f:
        return json.load(f)


def validate_yaml(
    yaml_content: str, schema: Dict[str, Any]
) -> Tuple[bool, Dict[str, str]]:
    """Validate YAML content against a JSON schema.

    Args:
        yaml_content: The YAML content to validate.
        schema: The JSON schema to validate against.

    Returns:
        A tuple containing:
            - A boolean indicating if the validation passed
            - A dictionary containing any validation errors
    """
    try:
        config = yaml.safe_load(yaml_content)
        validate(instance=config, schema=schema)
        return True, {}
    except ValidationError as e:
        return False, {"error": str(e)}
