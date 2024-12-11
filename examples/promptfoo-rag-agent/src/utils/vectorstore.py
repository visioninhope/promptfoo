"""Vector store utilities for the promptfoo RAG agent.

This module provides functions to load example configurations and manage the
FAISS vector store for similarity search.
"""

from pathlib import Path
from typing import List, Optional

import yaml
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.schema import Document
from langchain.vectorstores import FAISS

from ..config import settings


def load_examples(examples_dir: Path) -> List[Document]:
    """Load YAML examples from a directory into Documents.

    Args:
        examples_dir: Directory containing YAML example files.

    Returns:
        A list of Document objects containing the YAML content.

    Raises:
        FileNotFoundError: If the examples directory doesn't exist.
    """
    documents: List[Document] = []
    for yaml_file in examples_dir.glob("*.yaml"):
        with open(yaml_file, "r") as f:
            content = f.read()
            documents.append(
                Document(page_content=content, metadata={"source": str(yaml_file)})
            )
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
    embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)

    if store_path and store_path.exists():
        return FAISS.load_local(str(store_path), embeddings)

    vectorstore = FAISS.from_documents(documents, embeddings)

    if store_path:
        vectorstore.save_local(str(store_path))

    return vectorstore
