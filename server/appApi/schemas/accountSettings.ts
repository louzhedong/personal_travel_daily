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

export const updateAccountPreferenceBodySchema = z.object({
  locale: z.enum(['zh-CN', 'en-US']).optional(),
  mapStyle: z.enum(['minimal', 'magazine', 'old-map']).optional(),
  defaultCurrency: z.string().trim().min(3).max(3).optional(),
  commonCurrencies: z.array(z.string().trim().min(3).max(3)).max(8).optional(),
  exchangeRateSource: z.string().trim().min(1).max(80).optional(),
});

export type UpdateAccountProfileBody = z.infer<typeof updateAccountProfileBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
export type UpdateAccountPreferenceBody = z.infer<typeof updateAccountPreferenceBodySchema>;
