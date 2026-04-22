import './loadServerEnv.js';
import { buildApp } from './appApi/buildApp.js';
import { getAppApiEnv } from './appApi/env.js';

async function start() {
  const env = getAppApiEnv();
  const app = await buildApp();

  try {
    await app.listen({
      host: env.APP_API_HOST,
      port: env.APP_API_PORT,
    });
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
}

void start();
