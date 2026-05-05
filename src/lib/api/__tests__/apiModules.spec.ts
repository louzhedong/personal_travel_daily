import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn(),
  deleteMock: vi.fn(),
  getBootstrapBaseUrlMock: vi.fn(() => '/api/app'),
  getResourceBaseUrlMock: vi.fn(() => '/api'),
}));

vi.mock('../httpClient', () => ({
  httpClient: {
    get: mocks.getMock,
    post: mocks.postMock,
    patch: mocks.patchMock,
    delete: mocks.deleteMock,
  },
  getBootstrapBaseUrl: mocks.getBootstrapBaseUrlMock,
  getResourceBaseUrl: mocks.getResourceBaseUrlMock,
}));

import { fetchAppBootstrap } from '../appBootstrapApi';
import { fetchAdminOverview } from '../adminApi';
import { fetchStatsOverview } from '../statsApi';
import { fetchSession, login, logout, register } from '../authApi';
import { createCompanion, updateCompanion } from '../companionsApi';
import { createGuideSearchHistory, fetchGuideSearchHistories } from '../guideSearchHistoryApi';
import { batchUpdateMarkersTrip, createMarker, deleteMarker, searchMarkers, updateMarker } from '../markersApi';
import { createSavedGuide, deleteSavedGuide, fetchSavedGuides } from '../savedGuidesApi';
import {
  convertWishlistToTrip,
  createWishlistItem,
  deleteWishlistItem,
  fetchWishlistItems,
  updateWishlistItem,
} from '../wishlistApi';
import {
  createTrip,
  createTripChecklistItem,
  deleteTrip,
  deleteTripChecklistItem,
  fetchTripChecklist,
  fetchTripDetail,
  generateTripChecklist,
  updateTrip,
  updateTripChecklistItem,
} from '../tripsApi';
import type { CreateMarkerInput } from '../types';

describe('app api modules', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getBootstrapBaseUrlMock.mockReturnValue('/api/app');
    mocks.getResourceBaseUrlMock.mockReturnValue('/api');
  });

  it('routes bootstrap requests through the bootstrap base url', async () => {
    mocks.getMock.mockResolvedValueOnce({ store: { users: [] } });

    await fetchAppBootstrap();

    expect(mocks.getMock).toHaveBeenCalledWith('/api/app', '/bootstrap');
  });

  it('routes auth requests through the resource base url', async () => {
    await fetchSession();
    await login({ username: 'demo', password: 'demo123456' });
    await register({ nickname: 'Voyage Atlas', username: 'demo', password: 'demo123456' });
    await logout();

    expect(mocks.getMock).toHaveBeenCalledWith('/api', '/auth/session');
    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/auth/login', {
      username: 'demo',
      password: 'demo123456',
    });
    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/auth/register', {
      nickname: 'Voyage Atlas',
      username: 'demo',
      password: 'demo123456',
    });
    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/auth/logout');
  });

  it('routes admin overview requests through the resource base url', async () => {
    await fetchAdminOverview();

    expect(mocks.getMock).toHaveBeenCalledWith('/api', '/admin/overview');
  });

  it('routes stats overview requests through the resource base url with query params', async () => {
    await fetchStatsOverview({
      year: '2026',
      scope: 'domestic',
      companionId: 'user-alice',
      tripId: 'trip-1',
    });

    expect(mocks.getMock).toHaveBeenCalledWith(
      '/api',
      '/stats/overview?year=2026&scope=domestic&companionId=user-alice&tripId=trip-1',
    );
  });

  it('routes trip detail requests through the resource base url', async () => {
    await fetchTripDetail('trip-1');
    await fetchTripChecklist('trip-1');

    expect(mocks.getMock).toHaveBeenCalledWith('/api', '/trips/trip-1/detail');
    expect(mocks.getMock).toHaveBeenCalledWith('/api', '/trips/trip-1/checklist');
  });

  it('forwards trip checklist generation and item mutations', async () => {
    await generateTripChecklist('trip-1', {
      companionId: 'user-alice',
      guide: {
        title: '京都春日路线',
        summary: '适合第一次去京都的三天行程。',
        sourceName: 'Mock Guide',
        sourceUrl: 'https://example.com/guides/kyoto',
      },
    });
    await createTripChecklistItem('trip-1', {
      companionId: 'user-alice',
      title: '提前预约清水寺周边时段',
      note: '尽量避开中午高峰',
      stage: 'pre_departure',
    });
    await updateTripChecklistItem('trip-1', 'item-1', {
      stage: 'done',
      note: '已预约完成',
    });
    await deleteTripChecklistItem('trip-1', 'item-1');

    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/trips/trip-1/checklist/generate', {
      companionId: 'user-alice',
      guide: {
        title: '京都春日路线',
        summary: '适合第一次去京都的三天行程。',
        sourceName: 'Mock Guide',
        sourceUrl: 'https://example.com/guides/kyoto',
      },
    });
    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/trips/trip-1/checklist/items', {
      companionId: 'user-alice',
      title: '提前预约清水寺周边时段',
      note: '尽量避开中午高峰',
      stage: 'pre_departure',
    });
    expect(mocks.patchMock).toHaveBeenCalledWith('/api', '/trips/trip-1/checklist/items/item-1', {
      stage: 'done',
      note: '已预约完成',
    });
    expect(mocks.deleteMock).toHaveBeenCalledWith('/api', '/trips/trip-1/checklist/items/item-1');
  });

  it('forwards companion create and update payloads', async () => {
    const createPayload = { name: '阿泽', color: '#f97316' };
    const updatePayload = { color: '#ea580c' };

    await createCompanion(createPayload);
    await updateCompanion('user-bob', updatePayload);

    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/companions', createPayload);
    expect(mocks.patchMock).toHaveBeenCalledWith('/api', '/companions/user-bob', updatePayload);
  });

  it('forwards trip create, update and delete requests', async () => {
    const createPayload = {
      name: '江南春游',
      startsAt: '2026-05-01',
      endsAt: '2026-05-03',
      note: '杭州与苏州周末行',
    };
    const updatePayload = {
      note: '补充苏州段',
    };

    await createTrip(createPayload);
    await updateTrip('trip-1', updatePayload);
    await deleteTrip('trip-1');

    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/trips', createPayload);
    expect(mocks.patchMock).toHaveBeenCalledWith('/api', '/trips/trip-1', updatePayload);
    expect(mocks.deleteMock).toHaveBeenCalledWith('/api', '/trips/trip-1');
  });

  it('forwards marker create, update, batch trip update and delete requests', async () => {
    const markerPayload: CreateMarkerInput = {
      companionId: 'user-alice',
      scope: 'international' as const,
      scopeId: 'jp-kyoto',
      scopeName: '京都府',
      city: '京都',
      note: '春天赏樱',
      tags: ['citywalk', 'photography'],
      mood: 'excited' as const,
      weather: 'sunny' as const,
      transport: 'walk' as const,
      budgetLevel: 'medium' as const,
      visitedStartAt: '2026-04-01',
      visitedEndAt: '2026-04-05',
    };

    await createMarker(markerPayload);
    await updateMarker('marker-1', {
      note: '更新后的备注',
      tags: ['citywalk'],
      mood: 'relaxed',
      weather: 'cloudy',
      transport: 'train',
      budgetLevel: 'high',
    });
    await batchUpdateMarkersTrip({ markerIds: ['marker-1', 'marker-2'], tripId: 'trip-1' });
    await deleteMarker('marker-1');

    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/markers', markerPayload);
    expect(mocks.patchMock).toHaveBeenCalledWith('/api', '/markers/marker-1', {
      note: '更新后的备注',
      tags: ['citywalk'],
      mood: 'relaxed',
      weather: 'cloudy',
      transport: 'train',
      budgetLevel: 'high',
    });
    expect(mocks.patchMock).toHaveBeenCalledWith('/api', '/markers/batch-trip', {
      markerIds: ['marker-1', 'marker-2'],
      tripId: 'trip-1',
    });
    expect(mocks.deleteMock).toHaveBeenCalledWith('/api', '/markers/marker-1');
  });

  it('forwards marker search query parameters', async () => {
    await searchMarkers({
      keyword: '京都',
      scope: 'international',
      companionId: 'user-alice',
      year: '2026',
      tag: 'citywalk',
      mood: 'relaxed',
      weather: 'sunny',
      transport: 'walk',
      budgetLevel: 'medium',
      page: 1,
      pageSize: 20,
    });

    expect(mocks.getMock).toHaveBeenCalledWith('/api', '/markers/search', {
      keyword: '京都',
      scope: 'international',
      companionId: 'user-alice',
      year: '2026',
      tag: 'citywalk',
      mood: 'relaxed',
      weather: 'sunny',
      transport: 'walk',
      budgetLevel: 'medium',
      page: 1,
      pageSize: 20,
    });
  });

  it('forwards saved guide resource requests with query and payload', async () => {
    const savedGuidePayload = {
      savedByUserId: 'user-alice',
      markerId: 'marker-1',
      keyword: '京都',
      result: {
        id: 'guide-1',
        title: '京都三日路线',
        summary: '适合第一次去京都。',
        sourceName: '示例来源',
        sourceUrl: 'https://example.com/guides/kyoto',
      },
    };

    await fetchSavedGuides({ companionId: 'user-alice', markerId: 'marker-1' });
    await createSavedGuide(savedGuidePayload);
    await deleteSavedGuide('saved-guide-1');

    expect(mocks.getMock).toHaveBeenCalledWith('/api', '/saved-guides', {
      companionId: 'user-alice',
      markerId: 'marker-1',
    });
    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/saved-guides', savedGuidePayload);
    expect(mocks.deleteMock).toHaveBeenCalledWith('/api', '/saved-guides/saved-guide-1');
  });

  it('forwards wishlist resource requests and trip conversion', async () => {
    const payload = {
      companionId: 'user-alice',
      title: '京都',
      scope: 'international' as const,
      scopeId: 'japan',
      scopeName: '日本',
      city: '京都',
      priority: 'high' as const,
      targetYear: '2026',
    };

    await fetchWishlistItems();
    await createWishlistItem(payload);
    await updateWishlistItem('wishlist-1', { priority: 'medium', note: '赏樱' });
    await convertWishlistToTrip('wishlist-1', { name: '京都赏樱' });
    await deleteWishlistItem('wishlist-1');

    expect(mocks.getMock).toHaveBeenCalledWith('/api', '/wishlist');
    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/wishlist', payload);
    expect(mocks.patchMock).toHaveBeenCalledWith('/api', '/wishlist/wishlist-1', { priority: 'medium', note: '赏樱' });
    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/wishlist/wishlist-1/convert-to-trip', { name: '京都赏樱' });
    expect(mocks.deleteMock).toHaveBeenCalledWith('/api', '/wishlist/wishlist-1');
  });

  it('forwards guide search history requests with query and payload', async () => {
    const payload = {
      companionId: 'user-alice',
      keyword: '京都',
      scope: 'international' as const,
    };

    await fetchGuideSearchHistories({ companionId: 'user-alice', limit: 6 });
    await createGuideSearchHistory(payload);

    expect(mocks.getMock).toHaveBeenCalledWith('/api', '/guide-search-histories', {
      companionId: 'user-alice',
      limit: 6,
    });
    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/guide-search-histories', payload);
  });
});
