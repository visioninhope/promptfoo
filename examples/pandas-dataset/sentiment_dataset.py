import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from datasets import load_dataset

def get_test_cases(args: Optional[Dict] = None) -> Dict:
    """
    Load test cases from the Sentiment140 Dataset.
    Dataset source: https://huggingface.co/datasets/sentiment140
    
    Args:
        args: Dictionary containing parameters like:
            - limit: number of test cases to return
            - split: which dataset split to use ('train', 'test', default: 'test')
            - sentiment: filter by sentiment ('positive', 'negative')
            - sample: number of random samples to take (optional)
    Returns:
        Dictionary containing test cases in promptfoo format
    """
    # Load dataset from Hugging Face
    dataset = load_dataset("sentiment140", split="test", trust_remote_code=True)
    
    # Print dataset info for debugging
    print("Dataset info:", dataset)
    print("Dataset features:", dataset.features)
    
    # Convert to pandas DataFrame for easier manipulation
    df = pd.DataFrame(dataset)
    
    # Print column names and first row for debugging
    print("Available columns:", df.columns.tolist())
    print("First row:", df.iloc[0].to_dict())
    
    # Take a random sample if specified
    if args and 'sample' in args:
        sample_size = int(args['sample'])
        df = df.sample(n=min(sample_size, len(df)))
    
    # Map sentiment labels (0: negative, 4: positive)
    sentiment_map = {0: 'negative', 4: 'positive'}
    df['sentiment'] = df['sentiment'].map(sentiment_map)
    
    # Remove rows with NaN sentiment values
    df = df.dropna(subset=['sentiment'])
    
    # Apply sentiment filter if specified
    if args and 'sentiment' in args:
        df = df[df['sentiment'] == args['sentiment']]
    
    # Apply limit if specified
    limit = args.get('limit') if args else None
    if limit:
        df = df.head(int(limit))
    
    # Convert DataFrame to promptfoo test cases, skipping any rows with NaN values
    test_cases = []
    for _, row in df.iterrows():
        # Skip rows with NaN values
        if pd.isna(row['text']) or pd.isna(row['sentiment']):
            continue
            
        test_cases.append({
            'vars': {
                'text': row['text'],
            },
            'assert': [
                {
                    'type': 'equals',
                    'value': row['sentiment']
                },
                # Add a more flexible assertion using 'contains'
                {
                    'type': 'contains',
                    'value': row['sentiment']
                }
            ]
        })
    
    # Return just the array of test cases
    return test_cases 