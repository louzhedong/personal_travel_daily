import type { ZodType } from 'zod';
import { createValidationError } from '../errors.js';

export function parseWithSchema<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'invalid request payload';
    throw createValidationError(message);
  }

  return result.data;
}
