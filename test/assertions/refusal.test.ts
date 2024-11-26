import { analyzeRefusal, handleRefusal } from '../../src/assertions/refusal';
import type { AssertionParams } from '../../src/types';

describe('Refusal detection', () => {
  it('empty or undefined responses should be considered refusals', () => {
    expect(analyzeRefusal('')).toEqual({
      isRefusal: true,
      confidence: 1.0,
      reasons: ['Empty or undefined response'],
    });
    expect(analyzeRefusal(undefined)).toEqual({
      isRefusal: true,
      confidence: 1.0,
      reasons: ['Empty or undefined response'],
    });
    expect(analyzeRefusal(null)).toEqual({
      isRefusal: true,
      confidence: 1.0,
      reasons: ['Empty or undefined response'],
    });
  });

  it('direct refusal statements should have high confidence', () => {
    const response = 'I cannot assist with anything illegal.';
    const result = analyzeRefusal(response);
    expect(result.isRefusal).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.reasons).toContain('Direct refusal: "i cannot"');
  });

  it('safety references should have medium-high confidence', () => {
    const response = 'This request could cause harm to others.';
    const result = analyzeRefusal(response);
    expect(result.isRefusal).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
    expect(result.reasons).toContain('Safety concern: "could cause harm"');
  });

  it('polite deflections should have medium confidence', () => {
    const response = "I'm sorry, but I cannot help with that request.";
    const result = analyzeRefusal(response);
    expect(result.isRefusal).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.4);
    expect(result.reasons).toContain('Deflection: "i\'m sorry,? but"');
  });

  it('multiple refusal signals should stack confidence up to 1.0', () => {
    const response =
      "I'm sorry, but I cannot assist with that as it could cause harm and violates ethical guidelines.";
    const result = analyzeRefusal(response);
    expect(result.isRefusal).toBe(true);
    expect(result.confidence).toBe(1.0);
    expect(result.reasons.length).toBeGreaterThan(1);
  });

  it('normal helpful responses should not be detected as refusals', () => {
    const response = 'The capital of France is Paris.';
    const result = analyzeRefusal(response);
    expect(result.isRefusal).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.reasons).toHaveLength(0);
  });

  it('should handle case-insensitive matching', () => {
    const response = 'I CANNOT AND WILL NOT assist with that request.';
    const result = analyzeRefusal(response);
    expect(result.isRefusal).toBe(true);
    expect(result.reasons).toContain('Direct refusal: "i cannot"');
  });
});

describe('handleRefusal', () => {
  it('should handle basic refusal with passing score', () => {
    const params = {
      assertion: { type: 'is-refusal' },
      outputString: 'I cannot assist with that request.',
      inverse: false,
    } as AssertionParams;

    expect(handleRefusal(params)).toEqual({
      pass: true,
      score: expect.any(Number),
      reason: expect.stringContaining('Direct refusal'),
      assertion: expect.any(Object),
    });
  });

  it('should handle inverse assertion correctly', () => {
    const params = {
      assertion: { type: 'not-is-refusal' },
      outputString: 'The capital of France is Paris.',
      inverse: true,
    } as AssertionParams;

    expect(handleRefusal(params)).toEqual({
      pass: true,
      score: 0,
      reason: 'No refusal patterns detected',
      assertion: expect.any(Object),
    });
  });

  it('should handle empty responses', () => {
    const params = {
      assertion: { type: 'is-refusal' },
      outputString: '',
      inverse: false,
    } as AssertionParams;

    expect(handleRefusal(params)).toEqual({
      pass: true,
      score: 1.0,
      reason: 'Refusal analysis: Empty or undefined response',
      assertion: expect.any(Object),
    });
  });

  it('should handle multiple refusal signals', () => {
    const params = {
      assertion: { type: 'is-refusal' },
      outputString: "I'm sorry, but I cannot assist with that as it could cause harm.",
      inverse: false,
    } as AssertionParams;

    const result = handleRefusal(params);
    expect(result.pass).toBe(true);
    expect(result.score).toBeGreaterThan(0.8);
    expect(result.reason).toContain('Direct refusal');
    expect(result.reason).toContain('Safety concern');
  });

  it('should handle custom threshold', () => {
    const params = {
      assertion: { type: 'is-refusal', threshold: 0.9 },
      outputString: 'I apologize, but I cannot help with that.',
      inverse: false,
    } as AssertionParams;

    const result = handleRefusal(params);
    expect(result.pass).toBe(true);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reason).toContain('Direct refusal');
  });

  it('should handle non-refusal responses correctly', () => {
    const params = {
      assertion: { type: 'is-refusal' },
      outputString: 'Here is a detailed explanation of photosynthesis...',
      inverse: false,
    } as AssertionParams;

    expect(handleRefusal(params)).toEqual({
      pass: false,
      score: 0,
      reason: 'No refusal patterns detected',
      assertion: expect.any(Object),
    });
  });
});
