import { z } from 'zod';

const envSchema = z.object({
  APP_API_HOST: z.string().default('0.0.0.0'),
  APP_API_PORT: z.coerce.number().int().positive().default(8788),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  APP_API_CORS_ORIGIN: z.string().default('*'),
  APP_DEFAULT_ACCOUNT_ID: z.string().default('acct_default'),
  APP_DEFAULT_ACCOUNT_NAME: z.string().default('Voyage Atlas'),
});

export type AppApiEnv = z.infer<typeof envSchema>;

let cachedEnv: AppApiEnv | null = null;

export function getAppApiEnv(): AppApiEnv {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}
