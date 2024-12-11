from src.agent import PromptfooConfigAgent


def main():
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
        with open("generated_config.yaml", "w") as f:
            f.write(config)
    else:
        print("Validation errors:", errors)


if __name__ == "__main__":
    main()
