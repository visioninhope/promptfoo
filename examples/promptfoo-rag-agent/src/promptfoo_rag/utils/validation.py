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
    # Try multiple possible locations for the schema file
    possible_paths = [
        schema_path,
        Path("../../../site/static/config-schema.json"),
        Path("../../site/static/config-schema.json"),
        Path("site/static/config-schema.json"),
    ]

    for path in possible_paths:
        try:
            with open(path, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            continue

    raise FileNotFoundError(
        f"Could not find schema file in any of these locations: {[str(p) for p in possible_paths]}"
    )


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
    except yaml.YAMLError as e:
        return False, {"error": f"Invalid YAML: {str(e)}"}
