"""Vector store utilities for the promptfoo RAG agent.

This module provides functions to load example configurations and manage the
FAISS vector store for similarity search.
"""

from pathlib import Path
from typing import List, Optional

import yaml
from langchain.schema import Document
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from promptfoo_rag.config import settings


def load_examples(examples_dir: Path) -> List[Document]:
    """Load YAML examples from a directory into Documents.

    Args:
        examples_dir: Directory containing YAML example files.

    Returns:
        A list of Document objects containing the YAML content.

    Raises:
        FileNotFoundError: If the examples directory doesn't exist.
    """
    if not examples_dir.exists():
        raise FileNotFoundError(f"Examples directory not found: {examples_dir}")

    documents: List[Document] = []
    for yaml_file in examples_dir.rglob("promptfooconfig*.yaml"):
        with open(yaml_file, "r") as f:
            content = f.read()
            documents.append(
                Document(page_content=content, metadata={"source": str(yaml_file)})
            )

    if not documents:
        raise ValueError(f"No YAML files found in {examples_dir}")

    return documents


def initialize_vectorstore(
    documents: List[Document], store_path: Optional[Path] = None
) -> FAISS:
    """Initialize or load a FAISS vector store.

    Args:
        documents: List of documents to add to the vector store.
        store_path: Optional path to save/load the vector store.

    Returns:
        An initialized FAISS vector store.

    Raises:
        ValueError: If the embedding model fails to initialize.
    """
    if not documents:
        raise ValueError("Cannot initialize vector store with empty document list")

    embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)

    if store_path and store_path.exists():
        try:
            return FAISS.load_local(
                str(store_path), embeddings, allow_dangerous_deserialization=True
            )
        except Exception as e:
            print(f"Warning: Failed to load existing vectorstore: {e}")
            print("Creating new vectorstore...")

    vectorstore = FAISS.from_documents(documents, embeddings)

    if store_path:
        store_path.parent.mkdir(parents=True, exist_ok=True)
        vectorstore.save_local(str(store_path))

    return vectorstore
