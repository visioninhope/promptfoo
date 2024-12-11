"""Tests for the vector store utilities."""

from pathlib import Path

import pytest
from promptfoo_rag.utils.vectorstore import initialize_vectorstore, load_examples


def test_load_examples(test_examples_dir: Path) -> None:
    """Test loading example files into documents."""
    documents = load_examples(test_examples_dir)

    assert len(documents) == 1
    assert documents[0].metadata["source"].endswith("test.yaml")
    assert "prompts" in documents[0].page_content
    assert "tests" in documents[0].page_content


def test_initialize_vectorstore(test_examples_dir: Path, tmp_path: Path) -> None:
    """Test initializing and saving a vector store."""
    documents = load_examples(test_examples_dir)
    store_path = tmp_path / "vectorstore"

    # Initialize new store
    vectorstore = initialize_vectorstore(documents, store_path)
    assert vectorstore is not None

    # Test similarity search
    results = vectorstore.similarity_search("test basic response", k=1)
    assert len(results) == 1
    assert "prompts" in results[0].page_content

    # Test loading existing store
    loaded_store = initialize_vectorstore(documents, store_path)
    assert loaded_store is not None


def test_initialize_vectorstore_no_path(test_examples_dir: Path) -> None:
    """Test initializing vector store without persistence."""
    documents = load_examples(test_examples_dir)
    vectorstore = initialize_vectorstore(documents)
    assert vectorstore is not None
