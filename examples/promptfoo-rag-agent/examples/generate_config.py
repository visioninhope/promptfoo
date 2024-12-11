"""Example script for generating promptfoo configurations."""

import os
from pathlib import Path

from dotenv import load_dotenv
from promptfoo_rag.agent import PromptfooConfigAgent


def main() -> None:
    """Generate a promptfoo configuration file."""
    # Load environment variables from .env file
    load_dotenv()

    # Ensure required environment variables are set
    if not os.getenv("OPENAI_API_KEY"):
        raise ValueError("OPENAI_API_KEY environment variable is not set")

    agent = PromptfooConfigAgent()

    requirements = """
    Create a config for testing a customer service chatbot that should:
    1. Use GPT-4 as the model
    2. Test responses for common customer queries
    3. Verify that responses are always polite
    4. Check that product information is accurate
    """

    config, is_valid, errors = agent.generate_config(requirements)

    if is_valid:
        print("Generated valid promptfoo config:")
        print(config)

        # Save to file
        output_path = Path("generated_config.yaml")
        output_path.write_text(config)
        print(f"\nSaved config to {output_path}")
    else:
        print("Validation errors:", errors)


if __name__ == "__main__":
    main()
