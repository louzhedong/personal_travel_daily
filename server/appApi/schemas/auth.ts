import { z } from 'zod';

export const registerBodySchema = z.object({
  nickname: z.string().trim().min(1, 'nickname is required').max(40, 'nickname is too long'),
  username: z.string().trim().min(3, 'username is required').max(32, 'username is too long'),
  password: z.string().min(8, 'password must be at least 8 characters'),
});

export const loginBodySchema = z.object({
  username: z.string().trim().min(1, 'username is required'),
  password: z.string().min(1, 'password is required'),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
