import { runAssertion } from '../../src/assertions';
import type { Assertion, ApiProvider, AtomicTestCase } from '../../src/types';

describe('is-xml', () => {
  const provider = {
    callApi: jest.fn().mockResolvedValue({ cost: 0.001 }),
  } as unknown as ApiProvider;

  it('should pass when the output is valid XML', async () => {
    const output = '<root><child>Content</child></root>';
    const assertion: Assertion = { type: 'is-xml' };

    const result = await runAssertion({
      prompt: 'Generate XML',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toEqual({
      pass: true,
      score: 1,
      reason: 'Assertion passed',
      assertion,
    });
  });

  it('should fail when the output is not valid XML', async () => {
    const output = '<root><child>Content</child></root';
    const assertion: Assertion = { type: 'is-xml' };

    const result = await runAssertion({
      prompt: 'Generate XML',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toMatchObject({
      pass: false,
      score: 0,
      reason: expect.stringMatching(/XML parsing failed/),
      assertion,
    });
  });

  it('should pass when required elements are present', async () => {
    const output =
      '<analysis><classification>T-shirt</classification><color>Red</color></analysis>';
    const assertion: Assertion = {
      type: 'is-xml',
      value: 'analysis.classification,analysis.color',
    };

    const result = await runAssertion({
      prompt: 'Generate XML',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toEqual({
      pass: true,
      score: 1,
      reason: 'Assertion passed',
      assertion,
    });
  });

  it('should fail when required elements are missing', async () => {
    const output = '<analysis><classification>T-shirt</classification></analysis>';
    const assertion: Assertion = {
      type: 'is-xml',
      value: 'analysis.classification,analysis.color',
    };

    const result = await runAssertion({
      prompt: 'Generate XML',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toEqual({
      pass: false,
      score: 0,
      reason: 'XML is missing required elements: analysis.color',
      assertion,
    });
  });

  it('should pass when nested elements are present', async () => {
    const output = '<root><parent><child><grandchild>Content</grandchild></child></parent></root>';
    const assertion: Assertion = {
      type: 'is-xml',
      value: 'root.parent.child.grandchild',
    };

    const result = await runAssertion({
      prompt: 'Generate XML',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toEqual({
      pass: true,
      score: 1,
      reason: 'Assertion passed',
      assertion,
    });
  });

  it('should handle inverse assertion correctly', async () => {
    const output = 'This is not XML';
    const assertion: Assertion = { type: 'not-is-xml' };

    const result = await runAssertion({
      prompt: 'Generate non-XML',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toEqual({
      pass: true,
      score: 1,
      reason: 'Assertion passed',
      assertion,
    });
  });

  it('should pass when required elements are specified as an array', async () => {
    const output = '<root><element1>Content1</element1><element2>Content2</element2></root>';
    const assertion: Assertion = {
      type: 'is-xml',
      value: ['root.element1', 'root.element2'],
    };

    const result = await runAssertion({
      prompt: 'Generate XML',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toEqual({
      pass: true,
      score: 1,
      reason: 'Assertion passed',
      assertion,
    });
  });

  it('should pass when required elements are specified as an object', async () => {
    const output = '<root><element1>Content1</element1><element2>Content2</element2></root>';
    const assertion: Assertion = {
      type: 'contains-xml',
      value: {
        requiredElements: ['root.element1', 'root.element2'],
      },
    };

    const result = await runAssertion({
      prompt: 'Generate XML',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toEqual({
      pass: true,
      score: 1,
      reason: 'Assertion passed',
      assertion,
    });
  });

  it('should throw an error when xml assertion value is invalid', async () => {
    const output = '<root><element1>Content1</element1><element2>Content2</element2></root>';
    const assertion: Assertion = {
      type: 'is-xml',
      value: { invalidKey: ['root.element1', 'root.element2'] },
    };

    await expect(
      runAssertion({
        prompt: 'Generate XML',
        provider,
        assertion,
        test: {} as AtomicTestCase,
        providerResponse: { output },
      }),
    ).rejects.toThrow('xml assertion must contain a string, array value, or no value');
  });

  it('should handle multiple XML blocks in contains-xml assertion', async () => {
    const output = 'Some text <xml1>content1</xml1> more text <xml2>content2</xml2>';
    const assertion: Assertion = {
      type: 'contains-xml',
      value: ['xml1', 'xml2'],
    };

    const result = await runAssertion({
      prompt: 'Generate text with multiple XML blocks',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toEqual({
      pass: true,
      score: 1,
      reason: 'Assertion passed',
      assertion,
    });
  });
});

describe('contains-xml', () => {
  const provider = {
    callApi: jest.fn().mockResolvedValue({ cost: 0.001 }),
  } as unknown as ApiProvider;
  it('should pass when the output contains valid XML', async () => {
    const output = 'Some text before <root><child>Content</child></root> and after';
    const assertion: Assertion = { type: 'contains-xml' };

    const result = await runAssertion({
      prompt: 'Generate text with XML',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toEqual({
      pass: true,
      score: 1,
      reason: 'Assertion passed',
      assertion,
    });
  });

  it('should fail when the output does not contain valid XML', async () => {
    const output = 'This is just plain text without any XML';
    const assertion: Assertion = { type: 'contains-xml' };

    const result = await runAssertion({
      prompt: 'Generate text without XML',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toEqual({
      pass: false,
      score: 0,
      reason: 'No XML content found in the output',
      assertion,
    });
  });

  it('should pass when required elements are present in the XML', async () => {
    const output =
      'Before <analysis><classification>T-shirt</classification><color>Red</color></analysis> After';
    const assertion: Assertion = {
      type: 'contains-xml',
      value: 'analysis.classification,analysis.color',
    };

    const result = await runAssertion({
      prompt: 'Generate text with specific XML',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toEqual({
      pass: true,
      score: 1,
      reason: 'Assertion passed',
      assertion,
    });
  });

  it('should fail when required elements are missing in the XML', async () => {
    const output = 'Before <analysis><classification>T-shirt</classification></analysis> After';
    const assertion: Assertion = {
      type: 'contains-xml',
      value: 'analysis.classification,analysis.color',
    };

    const result = await runAssertion({
      prompt: 'Generate text with specific XML',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toEqual({
      pass: false,
      score: 0,
      reason: 'No valid XML content found matching the requirements',
      assertion,
    });
  });

  it('should pass when nested elements are present in the XML', async () => {
    const output =
      'Start <root><parent><child><grandchild>Content</grandchild></child></parent></root> End';
    const assertion: Assertion = {
      type: 'contains-xml',
      value: 'root.parent.child.grandchild',
    };

    const result = await runAssertion({
      prompt: 'Generate text with nested XML',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toEqual({
      pass: true,
      score: 1,
      reason: 'Assertion passed',
      assertion,
    });
  });

  it('should handle inverse assertion correctly', async () => {
    const output = 'This is just plain text without any XML';
    const assertion: Assertion = { type: 'not-contains-xml' };

    const result = await runAssertion({
      prompt: 'Generate text without XML',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toEqual({
      pass: true,
      score: 1,
      reason: 'Assertion passed',
      assertion,
    });
  });

  it('should fail inverse assertion when XML is present', async () => {
    const output = 'Some text with <xml>content</xml> in it';
    const assertion: Assertion = { type: 'not-contains-xml' };

    const result = await runAssertion({
      prompt: 'Generate text without XML',
      provider,
      assertion,
      test: {} as AtomicTestCase,
      providerResponse: { output },
    });

    expect(result).toEqual({
      pass: false,
      score: 0,
      reason: 'XML is valid and contains all required elements',
      assertion,
    });
  });
});
