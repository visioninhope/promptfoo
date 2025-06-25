import { z } from 'zod/v4';

export const NunjucksFilterMapSchema = z.record(z.string(), z.custom<(...args: any[]) => string>());
