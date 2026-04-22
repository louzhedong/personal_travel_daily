import type { FastifyInstance } from 'fastify';
import { getAppApiEnv } from '../env.js';

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    const env = getAppApiEnv();

    return {
      ok: true,
      service: 'app-api',
      database: {
        provider: 'mysql',
        configured: Boolean(env.DATABASE_URL),
      },
      defaultAccount: {
        id: env.APP_DEFAULT_ACCOUNT_ID,
        name: env.APP_DEFAULT_ACCOUNT_NAME,
      },
      timestamp: new Date().toISOString(),
    };
  });

  app.get('/api/app/health', async () => {
    const env = getAppApiEnv();

    return {
      ok: true,
      service: 'app-api',
      port: env.APP_API_PORT,
      timestamp: new Date().toISOString(),
    };
  });
}
