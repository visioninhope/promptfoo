import { z } from 'zod/v4';

// Reusable function validator factory
export function createFunctionSchema<T extends Function>(description?: string) {
  return z.custom<T>((val) => typeof val === 'function', {
    message: description ? `Expected ${description} function` : 'Expected function',
  });
}

export const NunjucksFilterMapSchema = z.record(
  z.string(),
  createFunctionSchema<(input: any, ...args: any[]) => string>('Nunjucks filter'),
);
