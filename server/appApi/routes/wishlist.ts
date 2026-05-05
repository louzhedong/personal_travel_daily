import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  convertWishlistToTripBodySchema,
  createWishlistItemBodySchema,
  updateWishlistItemBodySchema,
  wishlistItemParamsSchema,
} from '../schemas/wishlist.js';
import {
  convertWishlistItemToTrip,
  createWishlistItemResource,
  deleteWishlistItemResource,
  listWishlistItems,
  updateWishlistItemResource,
} from '../services/wishlistService.js';

export async function registerWishlistRoutes(app: FastifyInstance) {
  app.get('/api/wishlist', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return listWishlistItems(account.id);
  });

  app.post('/api/wishlist', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createWishlistItemBodySchema, request.body);
    return createWishlistItemResource(account.id, body);
  });

  app.patch('/api/wishlist/:itemId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(wishlistItemParamsSchema, request.params);
    const body = parseWithSchema(updateWishlistItemBodySchema, request.body);
    return updateWishlistItemResource(account.id, params.itemId, body);
  });

  app.post('/api/wishlist/:itemId/convert-to-trip', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(wishlistItemParamsSchema, request.params);
    const body = parseWithSchema(convertWishlistToTripBodySchema, request.body);
    return convertWishlistItemToTrip(account.id, params.itemId, body);
  });

  app.delete('/api/wishlist/:itemId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(wishlistItemParamsSchema, request.params);
    return deleteWishlistItemResource(account.id, params.itemId);
  });
}
