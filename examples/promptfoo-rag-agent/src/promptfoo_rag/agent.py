"""Promptfoo configuration generation agent.

This module implements a RAG-based agent that generates valid promptfoo
configuration files based on user requirements and example configurations.
"""

from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from langchain.prompts import ChatPromptTemplate
from langchain.schema import BaseMessage, Document
from langchain_community.vectorstores import FAISS
from langchain_openai import ChatOpenAI

from .config import settings
from .utils.validation import load_schema, validate_yaml
from .utils.vectorstore import initialize_vectorstore, load_examples


class PromptfooConfigAgent:
    """Agent for generating promptfoo configurations.

    This class implements a RAG workflow to generate valid promptfoo
    configuration files based on user requirements and similar examples.

    Attributes:
        vectorstore: FAISS vector store containing example configs
        schema: The promptfoo JSON schema for validation
        llm: The language model for generating configs
        prompt: The prompt template for config generation
    """

    def __init__(self) -> None:
        """Initialize the promptfoo config generation agent."""
        # Load examples and initialize vectorstore
        documents = load_examples(settings.EXAMPLES_DIR)
        self.vectorstore: FAISS = initialize_vectorstore(
            documents, settings.VECTOR_STORE_PATH
        )

        # Load schema
        self.schema: Dict[str, Any] = load_schema(settings.SCHEMA_PATH)

        # Initialize LLM
        self.llm: ChatOpenAI = ChatOpenAI(model=settings.MODEL_NAME, temperature=0)

        # Setup prompt template
        self.prompt: ChatPromptTemplate = ChatPromptTemplate.from_template(
            """You are an expert at creating promptfoo configuration files. Generate a valid configuration following the official promptfoo schema.

            Key components to include:
            1. Provider configuration (API keys should use environment variables)
            2. Prompt templates with proper variable substitution
            3. Test cases with appropriate assertions (contains, similar, llm-rubric, etc.)
            4. Evaluation options for better control
            5. Output configuration for results

            Examples of similar configs:
            {examples}
            
            Schema (follow this exactly):
            {schema}
            
            Requirements:
            {requirements}
            
            Generate a valid promptfoo YAML configuration that matches these requirements and follows the schema exactly:"""
        )

    def generate_config(self, requirements: str) -> Tuple[str, bool, Dict[str, str]]:
        """Generate and validate a promptfoo config based on requirements.

        Args:
            requirements: User requirements for the configuration.

        Returns:
            A tuple containing:
                - The generated YAML configuration
                - A boolean indicating if the config is valid
                - A dictionary containing any validation errors
        """
        # Get relevant examples
        similar_docs = self.vectorstore.similarity_search(requirements, k=3)
        examples = "\n".join(doc.page_content for doc in similar_docs)

        # Generate config
        response = self.llm.invoke(
            self.prompt.format_messages(
                examples=examples, schema=self.schema, requirements=requirements
            )
        )

        # Validate generated config
        is_valid, errors = validate_yaml(response.content, self.schema)

        return response.content, is_valid, errors
