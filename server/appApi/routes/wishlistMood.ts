import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  createWishlistMoodCardBodySchema,
  updateWishlistMoodCardBodySchema,
  wishlistMoodCardParamsSchema,
  wishlistMoodParamsSchema,
} from '../schemas/wishlistMood.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  createMoodCard,
  deleteMoodCard,
  getMoodBoard,
  readMoodCardImage,
  updateMoodCard,
} from '../services/wishlistMoodService.js';

/**
 * G1 · Wishlist Mood Board routes / 愿望灵感板路由
 */
export async function registerWishlistMoodRoutes(app: FastifyInstance) {
  app.get('/api/wishlist/:wishlistItemId/mood', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(wishlistMoodParamsSchema, request.params);
    return getMoodBoard(account, params.wishlistItemId);
  });

  app.post('/api/wishlist/:wishlistItemId/mood/cards', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(wishlistMoodParamsSchema, request.params);
    const body = parseWithSchema(createWishlistMoodCardBodySchema, request.body ?? {});
    return createMoodCard(account, params.wishlistItemId, body);
  });

  app.patch('/api/wishlist/mood/cards/:cardId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(wishlistMoodCardParamsSchema, request.params);
    const body = parseWithSchema(updateWishlistMoodCardBodySchema, request.body ?? {});
    return updateMoodCard(account, params.cardId, body);
  });

  app.delete('/api/wishlist/mood/cards/:cardId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(wishlistMoodCardParamsSchema, request.params);
    return deleteMoodCard(account, params.cardId);
  });

  app.get('/api/wishlist/mood/cards/:cardId/image', async (request, reply) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(wishlistMoodCardParamsSchema, request.params);
    const { bytes, mimeType } = await readMoodCardImage(account, params.cardId);
    reply.header('Content-Type', mimeType);
    reply.header('Cache-Control', 'private, max-age=86400');
    return reply.send(bytes);
  });
}
