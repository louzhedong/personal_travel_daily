import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { parseWithSchema } from '../schemas/utils.js';
import { buildArchiveMediaBundle, isMediaArchiveEnabled } from '../services/archiveMediaService.js';

const archiveMediaRequestSchema = z.object({
  urls: z.array(z.string().url()).max(500),
});

/**
 * F1 · Archive media endpoint / 离线纪念册原图打包接口
 * Front-end calls before generating ZIP to get the cached binary references.
 */
export async function registerArchiveMediaRoutes(app: FastifyInstance) {
  app.post('/api/archive/media/prepare', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(archiveMediaRequestSchema, request.body ?? {});
    const bundle = await buildArchiveMediaBundle(account.id, body.urls);
    return {
      enabled: bundle.included,
      manifest: bundle.manifest,
    };
  });

  app.get('/api/archive/media/status', async (request) => {
    await requireAuthenticatedAccount(request);
    return {
      enabled: isMediaArchiveEnabled(),
      maxMb: Number(process.env.ARCHIVE_MEDIA_MAX_MB ?? 500),
    };
  });
}
