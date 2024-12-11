"""Setup file for the promptfoo-rag-agent package."""

from setuptools import find_namespace_packages, setup

setup(
    name="promptfoo-rag-agent",
    version="0.1.0",
    package_dir={"": "src"},
    packages=find_namespace_packages(where="src"),
    python_requires=">=3.8",
    install_requires=[
        "langchain>=0.1.0",
        "langchain-community>=0.0.10",
        "pydantic>=2.0.0",
        "pydantic-settings>=2.0.0",
        "faiss-cpu>=1.7.4",
        "sentence-transformers>=2.2.2",
        "jsonschema>=4.17.3",
        "python-dotenv>=1.0.0",
        "PyYAML>=6.0.1",
    ],
)
