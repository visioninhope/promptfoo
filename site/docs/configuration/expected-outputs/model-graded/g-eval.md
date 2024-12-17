# G-Eval

The `g-eval` assertion implements Microsoft Research's G-EVAL framework for evaluating natural language generation (NLG) outputs. It uses chain-of-thought (CoT) prompting and a form-filling paradigm to achieve better human alignment in evaluation scores.

### How to use it

To use the `g-eval` assertion type, add it to your test configuration like this:

```yaml
assert:
  - type: g-eval
    dimension: coherence # One of: fluency, coherence, consistency, relevance, engagingness, groundedness, naturalness
    threshold: 0.7 # Score between 0 and 1
```

### How it works

G-EVAL uses a form-filling paradigm where the LLM is prompted to provide numerical scores for different evaluation dimensions. For each dimension:

1. The LLM is given a specific prompt explaining the scoring criteria
2. Multiple parallel calls are made to get a distribution of scores
3. The scores are weighted by their output probabilities and averaged
4. The final score is normalized to a 0-1 range

The framework evaluates text generation across several dimensions:

- **Fluency** (1-3): Quality of grammar, spelling, punctuation, word choice, and sentence structure
- **Coherence** (1-5): How well-structured and organized the text is
- **Consistency** (1-5): Factual alignment between the output and source
- **Relevance** (1-5): Selection of important content from the source
- **Engagingness** (1-3): How interesting and engaging the response is
- **Groundedness** (1-5): How well the response uses provided knowledge/context
- **Naturalness** (1-3): How natural and human-like the response sounds

### Example Configuration

Here's a complete example showing how to use G-EVAL for summarization:

```yaml
prompts:
  - |
    Summarize this text:
    {{Document}}
providers:
  - openai:gpt-4
tests:
  - vars:
      Document: file://articles/news1.txt
    assert:
      - type: g-eval
        dimension: fluency
        threshold: 0.7
      - type: g-eval
        dimension: coherence
        threshold: 0.8
      - type: g-eval
        dimension: consistency
        threshold: 0.9
      - type: g-eval
        dimension: relevance
        threshold: 0.8
```

And for dialogue evaluation:

```yaml
prompts:
  - |
    Respond to this conversation:
    {{conversation}}
providers:
  - openai:gpt-4
tests:
  - vars:
      conversation: file://dialogues/chat1.txt
    assert:
      - type: g-eval
        dimension: engagingness
        threshold: 0.7
      - type: g-eval
        dimension: naturalness
        threshold: 0.8
      - type: g-eval
        dimension: groundedness
        threshold: 0.9
```

### Additional Examples

**Evaluating RAG System Output:**

```yaml
tests:
  - vars:
      query: "What is our company's vacation policy?"
      context: file://policies/vacation.md
      output: 'Employees get 20 days of paid vacation...'
    assert:
      - type: g-eval
        dimension: consistency
        threshold: 0.9 # Strict threshold for factual accuracy
      - type: g-eval
        dimension: relevance
        threshold: 0.8
```

**Evaluating Creative Writing:**

```yaml
tests:
  - vars:
      prompt: 'Write a story about a magical forest'
      output: 'The ancient trees whispered secrets...'
    assert:
      - type: g-eval
        dimension: fluency
        threshold: 0.8
      - type: g-eval
        dimension: coherence
        threshold: 0.7
```

### Implementation Details

G-EVAL makes multiple parallel calls (default: 20) to the language model to get a more statistically reliable score. The scores are normalized to a 0-1 range based on each dimension's scale:

- 1-3 scale dimensions (fluency, engagingness, naturalness)
- 1-5 scale dimensions (coherence, consistency, relevance, groundedness)

Key features:

- Auto-generated chain-of-thought evaluation steps
- Form-filling paradigm for structured evaluation
- Multiple parallel evaluations for reliability
- Probability-weighted scoring for finer granularity
- Minimum 50% valid responses required

### Overriding the Grader

Like other model-graded assertions, you can override the default grader:

1. Using the CLI:

   ```sh
   promptfoo eval --grader openai:gpt-4
   ```

2. Using test options:

   ```yaml
   defaultTest:
     options:
       provider: openai:gpt-4
   ```

3. Using assertion-level override:
   ```yaml
   assert:
     - type: g-eval
       dimension: coherence
       threshold: 0.8
       provider: openai:gpt-4
   ```

### Reference

This implementation is based on the paper ["G-EVAL: NLG Evaluation using GPT-4 with Better Human Alignment"](https://arxiv.org/abs/2303.16634) (Liu et al., 2023). The paper demonstrates that G-EVAL achieves state-of-the-art correlation with human judgments, particularly for:

- Summarization evaluation (0.514 Spearman correlation)
- Dialogue generation evaluation
- Hallucination detection

# Further reading

See [model-graded metrics](/docs/configuration/expected-outputs/model-graded) for more options.

### Customizing the Prompt

You can customize the evaluation prompts for each dimension using the `rubricPrompt` property:

````yaml
defaultTest:
  options:
    rubricPrompt: |
      You will be given one summary written for a news article.
      Your task is to rate the summary on one metric.

      Evaluation Criteria:
      {{dimension}} ({{min}}-{{max}}) - {{criteria}}

      Example:
      Source Text: {{Document}}
      Summary: {{Summary}}

      Evaluation Form (scores ONLY):
      - {{dimension}}:

### Limitations and Considerations

- **LLM Bias**: The paper notes that G-EVAL may show bias towards LLM-generated text over human-written text
- **Resource Usage**: Making multiple parallel calls (20 by default) requires more API usage
- **Consistency**: Evaluation results may vary between runs due to the probabilistic nature of LLM outputs
- **Cost**: Using GPT-4 as the evaluator can be more expensive than simpler metrics

### Best Practices

1. **Choose Appropriate Dimensions**: Select evaluation dimensions that match your use case:
   - Use fluency/coherence for general text quality
   - Use consistency/groundedness for factual accuracy
   - Use engagingness/naturalness for dialogue systems

2. **Set Reasonable Thresholds**: Consider the dimension's scale when setting thresholds:
   - For 1-3 scales (fluency, engagingness, naturalness): start with 0.6-0.7
   - For 1-5 scales (coherence, consistency, relevance): start with 0.7-0.8

3. **Combine Multiple Dimensions**: For comprehensive evaluation, use multiple dimensions:
```yaml
assert:
  - type: g-eval
    dimension: fluency
    threshold: 0.7
  - type: g-eval
    dimension: consistency
    threshold: 0.8
````

### Comparison with Other Metrics

G-EVAL compared to other evaluation approaches:

| Metric Type              | Pros                                                                                                  | Cons                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| G-EVAL                   | - High correlation with human judgment<br>- No reference required<br>- Multiple evaluation dimensions | - Higher cost<br>- Slower due to multiple calls<br>- Potential LLM bias                     |
| Traditional (BLEU/ROUGE) | - Fast<br>- Deterministic<br>- Low cost                                                               | - Requires references<br>- Lower correlation with humans<br>- Limited to lexical similarity |
| Other LLM-based          | - No reference required<br>- Single call per evaluation                                               | - Lower correlation than G-EVAL<br>- Less structured evaluation                             |

### Custom Evaluation Criteria

You can define custom evaluation criteria instead of using predefined dimensions:

```yaml
assert:
  - type: g-eval
    criteria: 'Determine whether the output is factually correct and well-formatted'
    evaluation_steps:
      - 'Check for any factual contradictions'
      - 'Verify formatting and structure'
      - 'Assess overall accuracy'
    threshold: 0.8
    strict_mode: true # Require perfect score
```

The evaluation will return a score between 0-1, normalized based on the LLM's assessment of how well the output meets the criteria.
