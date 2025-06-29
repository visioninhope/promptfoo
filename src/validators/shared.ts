import { z } from 'zod/v4';

export const NunjucksFilterMapSchema = z.record(
  z.string(),
  z.any(), // Simplified to avoid complex function schema for now
);
