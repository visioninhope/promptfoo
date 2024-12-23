# Twitter Sentiment Analysis Dataset Example

This example demonstrates how to load test cases from a pandas DataFrame into promptfoo using a real-world dataset. It uses the [Twitter Sentiment Analysis Dataset](https://huggingface.co/datasets/carblacac/twitter-sentiment-analysis) from Hugging Face, which contains tweets labeled with sentiment (positive, negative, or neutral).

## Setup

1. Install required Python packages:

```bash
pip install pandas datasets
```

2. Run the evaluation:

```bash
promptfoo eval
```

## Dataset Details

The dataset contains tweets with sentiment labels:

- 0: Negative
- 1: Neutral
- 2: Positive

The example automatically maps these numeric labels to text labels for easier testing.

## Features Demonstrated

This example shows how to:

1. Load data from Hugging Face datasets
2. Convert DataFrame rows into promptfoo test cases
3. Support query parameters:
   - `limit`: Number of test cases to return
   - `sentiment`: Filter by sentiment ('positive', 'negative', 'neutral')
4. Use multiple prompts with different formats
5. Transform JSON responses to match expected output format

## Example Usage

The config shows different ways to use the dataset:

```yaml
# Load first 10 test cases
- python://dataset/sentiment_dataset.py:get_test_cases?limit=10

# Load only positive examples
- python://dataset/sentiment_dataset.py:get_test_cases?sentiment=positive&limit=5
```

## Customization

To use your own DataFrame:

1. Modify `sentiment_dataset.py` to load your data source
2. Adjust the DataFrame to test case conversion as needed
3. Add any additional query parameters you want to support

## Example Output

The evaluation will test two different prompts against the dataset:

1. A basic prompt that requests direct sentiment classification
2. A detailed prompt that asks for sentiment with explanation in JSON format

The output will show how well the model performs at sentiment classification across different types of tweets.
