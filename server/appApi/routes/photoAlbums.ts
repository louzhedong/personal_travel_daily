import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { updatePhotoAlbumPreferencesBodySchema } from '../schemas/photoAlbums.js';
import { parseWithSchema } from '../schemas/utils.js';
import { getPhotoAlbums, updatePhotoAlbumPreferences } from '../services/photoAlbumService.js';

export async function registerPhotoAlbumRoutes(app: FastifyInstance) {
  app.get('/api/photo-albums', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return getPhotoAlbums(account);
  });

  app.patch('/api/photo-albums/preferences', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(updatePhotoAlbumPreferencesBodySchema, request.body);
    return updatePhotoAlbumPreferences(account, body);
  });
}
