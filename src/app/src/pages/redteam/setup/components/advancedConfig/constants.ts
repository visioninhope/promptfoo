export const DEFAULT_NUM_TESTS = 10;
export const MIN_TESTS = 1;
export const MAX_TESTS = 100;

export const availableStrategies = [
  { id: 'base64', name: 'Base64 Encoding' },
  { id: 'jailbreak', name: 'Jailbreak' },
  { id: 'leetspeak', name: 'Leetspeak' },
  { id: 'multilingual', name: 'Multilingual' },
  { id: 'prompt-injection', name: 'Prompt Injection' },
] as const;
