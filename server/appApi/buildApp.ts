import cors from '@fastify/cors';
import Fastify from 'fastify';
import { getAppApiEnv } from './env.js';
import { normalizeAppApiError } from './errors.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerBootstrapRoutes } from './routes/bootstrap.js';
import { registerCompanionRoutes } from './routes/companions.js';
import { registerGuideSearchHistoryRoutes } from './routes/guideSearchHistories.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerMarkerRoutes } from './routes/markers.js';
import { registerSavedGuideRoutes } from './routes/savedGuides.js';
import { registerStatsRoutes } from './routes/stats.js';
import { registerTripRoutes } from './routes/trips.js';

export async function buildApp() {
  const env = getAppApiEnv();
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: env.APP_API_CORS_ORIGIN === '*' ? true : env.APP_API_CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await registerAuthRoutes(app);
  await registerAdminRoutes(app);
  await registerHealthRoutes(app);
  await registerBootstrapRoutes(app);
  await registerCompanionRoutes(app);
  await registerTripRoutes(app);
  await registerStatsRoutes(app);
  await registerSavedGuideRoutes(app);
  await registerGuideSearchHistoryRoutes(app);
  await registerMarkerRoutes(app);

  app.setErrorHandler((error, _request, reply) => {
    const normalizedError = normalizeAppApiError(error);
    app.log.error(error);

    reply.status(normalizedError.statusCode).send({
      error: {
        code: normalizedError.code,
        message: normalizedError.message,
      },
    });
  });

  return app;
}
