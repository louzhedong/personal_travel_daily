// @vitest-environment node

import { expect, it } from 'vitest';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

describeAppApiRoutesDomain('wishlist', () => {
  it('supports wishlist CRUD routes', async () => {
    const wishlistItem = {
      id: 'wishlist-1',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      title: '京都',
      scope: 'international',
      scopeId: 'japan',
      scopeName: '日本',
      city: '京都',
      priority: 'medium',
      targetYear: '2026',
      importedTrips: [],
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
    };
    mocks.listWishlistItemsMock.mockResolvedValue({ items: [wishlistItem] });
    mocks.createWishlistItemResourceMock.mockResolvedValue(wishlistItem);
    mocks.updateWishlistItemResourceMock.mockResolvedValue({ ...wishlistItem, priority: 'high' });
    mocks.convertWishlistItemToTripMock.mockResolvedValue({ tripId: 'trip-from-wishlist', store: { trips: [] } });
    mocks.deleteWishlistItemResourceMock.mockResolvedValue({ deletedId: 'wishlist-1' });

    const app = await buildApp();
    try {
      const listResponse = await app.inject({ method: 'GET', url: '/api/wishlist' });
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/wishlist',
        payload: {
          companionId: 'user-alice',
          title: '京都',
          scope: 'international',
          scopeId: 'japan',
          scopeName: '日本',
          city: '京都',
          targetYear: '2026',
        },
      });
      const updateResponse = await app.inject({
        method: 'PATCH',
        url: '/api/wishlist/wishlist-1',
        payload: { priority: 'high' },
      });
      const convertResponse = await app.inject({
        method: 'POST',
        url: '/api/wishlist/wishlist-1/convert-to-trip',
        payload: { name: '京都愿望行程' },
      });
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: '/api/wishlist/wishlist-1',
      });

      expect(listResponse.statusCode).toBe(200);
      expect(createResponse.statusCode).toBe(200);
      expect(updateResponse.statusCode).toBe(200);
      expect(convertResponse.statusCode).toBe(200);
      expect(deleteResponse.statusCode).toBe(200);
      expect(mocks.listWishlistItemsMock).toHaveBeenCalledWith(currentAccount.id);
      expect(mocks.createWishlistItemResourceMock).toHaveBeenCalledWith(
        currentAccount.id,
        expect.objectContaining({ title: '京都' }),
      );
      expect(mocks.updateWishlistItemResourceMock).toHaveBeenCalledWith(
        currentAccount.id,
        'wishlist-1',
        { priority: 'high' },
      );
      expect(mocks.convertWishlistItemToTripMock).toHaveBeenCalledWith(
        currentAccount.id,
        'wishlist-1',
        { name: '京都愿望行程' },
      );
      expect(mocks.deleteWishlistItemResourceMock).toHaveBeenCalledWith(currentAccount.id, 'wishlist-1');
    } finally {
      await app.close();
    }
  });
});
