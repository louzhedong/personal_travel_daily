import { z } from 'zod';

export const updateAccountProfileBodySchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(40, 'name is too long'),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, 'current password is required'),
  nextPassword: z.string().min(8, 'password must be at least 8 characters'),
});

export const accountSessionParamsSchema = z.object({
  sessionId: z.string().trim().min(1, 'sessionId is required'),
});

export type UpdateAccountProfileBody = z.infer<typeof updateAccountProfileBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
