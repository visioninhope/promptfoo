"""Configuration settings for the promptfoo RAG agent.

This module defines the settings used throughout the application, including paths,
model configurations, and API keys. It uses pydantic for settings management and
environment variable loading.
"""

from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings


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
    EXAMPLES_DIR: Path = Path("data/examples")
    SCHEMA_PATH: Path = Path("site/static/config-schema.json")
    MODEL_NAME: str = "gpt-4"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    VECTOR_STORE_PATH: Optional[Path] = Path("data/vectorstore")

    class Config:
        """Pydantic configuration."""

        env_file = ".env"


settings: Settings = Settings()
