import dedent from 'dedent';
import { runAssertion } from '../../src/assertions';
import { containsXml, validateXml } from '../../src/assertions/xml';
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

describe('validateXml', () => {
  it('should validate a simple valid XML string', () => {
    expect(validateXml('<root><child>Content</child></root>')).toEqual({
      isValid: true,
      reason: 'XML is valid and contains all required elements',
    });
  });

  it('should invalidate a malformed XML string', () => {
    expect(validateXml('<root><child>Content</child></root')).toEqual({
      isValid: false,
      reason: expect.stringContaining('XML parsing failed'),
    });
  });

  it('should validate XML with attributes', () => {
    expect(validateXml('<root><child id="1">Content</child></root>')).toEqual({
      isValid: true,
      reason: 'XML is valid and contains all required elements',
    });
  });

  it('should validate XML with namespaces', () => {
    expect(
      validateXml('<root xmlns:ns="http://example.com"><ns:child>Content</ns:child></root>'),
    ).toEqual({
      isValid: true,
      reason: 'XML is valid and contains all required elements',
    });
  });

  it('should validate when all required elements are present', () => {
    expect(
      validateXml(
        '<analysis><classification>T-shirt</classification><color>Red</color></analysis>',
        ['analysis.classification', 'analysis.color'],
      ),
    ).toEqual({
      isValid: true,
      reason: 'XML is valid and contains all required elements',
    });
  });

  it('should invalidate when a required element is missing', () => {
    expect(
      validateXml('<analysis><classification>T-shirt</classification></analysis>', [
        'analysis.classification',
        'analysis.color',
      ]),
    ).toEqual({
      isValid: false,
      reason: 'XML is missing required elements: analysis.color',
    });
  });

  it('should validate nested elements correctly', () => {
    expect(
      validateXml('<root><parent><child><grandchild>Content</grandchild></child></parent></root>', [
        'root.parent.child.grandchild',
      ]),
    ).toEqual({
      isValid: true,
      reason: 'XML is valid and contains all required elements',
    });
  });

  it('should invalidate when a nested required element is missing', () => {
    expect(
      validateXml('<root><parent><child></child></parent></root>', [
        'root.parent.child.grandchild',
      ]),
    ).toEqual({
      isValid: false,
      reason: 'XML is missing required elements: root.parent.child.grandchild',
    });
  });

  it('should handle empty elements correctly', () => {
    expect(
      validateXml('<root><emptyChild></emptyChild><nonEmptyChild>Content</nonEmptyChild></root>', [
        'root.emptyChild',
        'root.nonEmptyChild',
      ]),
    ).toEqual({
      isValid: true,
      reason: 'XML is valid and contains all required elements',
    });
  });

  it('should validate XML with multiple siblings', () => {
    expect(
      validateXml('<root><child>Content1</child><child>Content2</child></root>', ['root.child']),
    ).toEqual({
      isValid: true,
      reason: 'XML is valid and contains all required elements',
    });
  });

  it('should handle XML with CDATA sections', () => {
    expect(
      validateXml('<root><child><![CDATA[<p>This is CDATA content</p>]]></child></root>', [
        'root.child',
      ]),
    ).toEqual({
      isValid: true,
      reason: 'XML is valid and contains all required elements',
    });
  });

  it('should validate XML with processing instructions', () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="style.xsl"?><root><child>Content</child></root>';
    expect(validateXml(xml, ['root.child'])).toEqual({
      isValid: true,
      reason: 'XML is valid and contains all required elements',
    });
  });

  it('should handle XML with comments', () => {
    expect(
      validateXml('<root><!-- This is a comment --><child>Content</child></root>', ['root.child']),
    ).toEqual({
      isValid: true,
      reason: 'XML is valid and contains all required elements',
    });
  });

  it('should validate the example XML structure', () => {
    const xml = dedent`
        <analysis>
          <classification>T-shirt/top</classification>
          <color>White with black print</color>
          <features>Large circular graphic design on the front, resembling a smiley face or emoji</features>
          <style>Modern, casual streetwear</style>
          <confidence>9</confidence>
          <reasoning>The image clearly shows a short-sleeved garment with a round neckline, which is characteristic of a T-shirt. The large circular graphic on the front is distinctive and appears to be a stylized smiley face or emoji design, which is popular in contemporary casual fashion. The stark contrast between the white fabric and black print is very clear, leaving little room for misinterpretation. The style is unmistakably modern and aligned with current trends in graphic tees. My confidence is high (9) because all elements of the image are clear and consistent with a typical graphic T-shirt design.</reasoning>
        </analysis>
      `;
    expect(
      validateXml(xml, [
        'analysis.classification',
        'analysis.color',
        'analysis.features',
        'analysis.style',
        'analysis.confidence',
        'analysis.reasoning',
      ]),
    ).toEqual({
      isValid: true,
      reason: 'XML is valid and contains all required elements',
    });
  });
});

describe('containsXml', () => {
  it('should return true when valid XML is present', () => {
    const input = 'Some text <root><child>Content</child></root> more text';
    const result = containsXml(input);
    expect(result.isValid).toBe(true);
  });

  it('should return false when no XML is present', () => {
    const input = 'This is just plain text';
    expect(containsXml(input)).toEqual({
      isValid: false,
      reason: 'No XML content found in the output',
    });
  });

  it('should validate required elements', () => {
    const input = 'Text <root><child>Content</child></root> more';
    const result = containsXml(input, ['root.child']);
    expect(result.isValid).toBe(true);
  });

  it('should return false when required elements are missing', () => {
    const input = 'Text <root><child>Content</child></root> more';
    expect(containsXml(input, ['root.missing'])).toEqual({
      isValid: false,
      reason: 'No valid XML content found matching the requirements',
    });
  });

  it('should handle multiple XML fragments', () => {
    const input = '<root1>Content</root1> text <root2><child>More</child></root2>';
    const result = containsXml(input, ['root2.child']);
    expect(result.isValid).toBe(true);
  });
});
