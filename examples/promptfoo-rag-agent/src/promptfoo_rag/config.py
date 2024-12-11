"""Configuration settings for the promptfoo RAG agent.

This module defines the settings used throughout the application, including paths,
model configurations, and API keys. It uses pydantic for settings management and
environment variable loading.
"""

import os
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings

# Set tokenizer parallelism to avoid fork warnings
os.environ["TOKENIZERS_PARALLELISM"] = "false"


def find_repo_root() -> Path:
    """Find the root of the promptfoo repository."""
    current = Path.cwd()
    while current != current.parent:
        if (current / "site" / "static" / "config-schema.json").exists():
            return current
        current = current.parent
    raise FileNotFoundError("Could not find promptfoo repository root")


class Settings(BaseSettings):
    """Application settings with environment variable support.

    Attributes:
        OPENAI_API_KEY: OpenAI API key for model access
        EXAMPLES_DIR: Directory containing example promptfoo configs
        SCHEMA_PATH: Path to the promptfoo JSON schema file
        MODEL_NAME: Name of the LLM model to use
        EMBEDDING_MODEL: Name of the embedding model for vectorization
        VECTOR_STORE_PATH: Path to store/load the FAISS vector store
    """

    OPENAI_API_KEY: str
    EXAMPLES_DIR: Path = Path("../")
    SCHEMA_PATH: Path = find_repo_root() / "site" / "static" / "config-schema.json"
    MODEL_NAME: str = "gpt-4"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    VECTOR_STORE_PATH: Optional[Path] = Path("data/vectorstore/faiss_index")

    class Config:
        """Pydantic configuration."""

        env_file = ".env"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Create data directory if it doesn't exist
        if self.VECTOR_STORE_PATH:
            self.VECTOR_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)


settings: Settings = Settings()
