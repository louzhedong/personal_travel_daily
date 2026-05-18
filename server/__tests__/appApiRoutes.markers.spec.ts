// @vitest-environment node

import { expect, it } from 'vitest';
import { AppApiError } from '../appApi/errors.js';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

describeAppApiRoutesDomain('markers', () => {
  it('returns normalized DATABASE_UNAVAILABLE errors from marker routes', async () => {
    mocks.createMarkerRecordMock.mockRejectedValue(
      new AppApiError('DATABASE_UNAVAILABLE', 'database is unavailable, please start MySQL and retry', 503),
    );

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/markers',
        payload: {
          companionId: 'user-alice',
          tripId: 'trip-1',
          scope: 'international',
          scopeId: 'jp-kyoto',
          scopeName: '京都府',
          city: '京都',
          note: '春天赏樱',
          tags: ['citywalk', 'photography'],
          mood: 'excited',
          weather: 'sunny',
          transport: 'walk',
          budgetLevel: 'medium',
          visitedStartAt: '2026-04-01',
          visitedEndAt: '2026-04-05',
        },
      });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'database is unavailable, please start MySQL and retry',
        },
      });
      expect(mocks.createMarkerRecordMock).toHaveBeenCalledWith('acct-1', {
        companionId: 'user-alice',
        tripId: 'trip-1',
        scope: 'international',
        scopeId: 'jp-kyoto',
        scopeName: '京都府',
        city: '京都',
        note: '春天赏樱',
        tags: ['citywalk', 'photography'],
        mood: 'excited',
        weather: 'sunny',
        transport: 'walk',
        budgetLevel: 'medium',
        visitedStartAt: '2026-04-01',
        visitedEndAt: '2026-04-05',
      });
    } finally {
      await app.close();
    }
  });

  it('forwards marker search queries to the service layer', async () => {
    mocks.searchMarkerRecordsMock.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      hasMore: false,
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/markers/search?keyword=%E4%BA%AC%E9%83%BD&scope=international&companionId=user-alice&tag=citywalk&mood=relaxed&weather=sunny&transport=walk&budgetLevel=medium&year=2026&page=1&pageSize=20',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.searchMarkerRecordsMock).toHaveBeenCalledWith('acct-1', {
        keyword: '京都',
        scope: 'international',
        companionId: 'user-alice',
        tag: 'citywalk',
        mood: 'relaxed',
        weather: 'sunny',
        transport: 'walk',
        budgetLevel: 'medium',
        year: '2026',
        page: 1,
        pageSize: 20,
      });
    } finally {
      await app.close();
    }
  });

  it('forwards marker update payloads to the service layer', async () => {
    mocks.updateMarkerRecordMock.mockResolvedValue({
      users: [],
      markers: [],
      activeUserId: 'user-alice',
      savedGuides: [],
      guideSearchHistory: [],
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/markers/marker-1',
        payload: {
          note: '更新后的备注',
          tags: ['food', 'weekend'],
          mood: 'relaxed',
          weather: 'cloudy',
          transport: 'train',
          budgetLevel: 'high',
          imageUrls: ['https://example.com/updated.jpg'],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.updateMarkerRecordMock).toHaveBeenCalledWith('acct-1', 'marker-1', {
        note: '更新后的备注',
        tags: ['food', 'weekend'],
        mood: 'relaxed',
        weather: 'cloudy',
        transport: 'train',
        budgetLevel: 'high',
        imageUrls: ['https://example.com/updated.jpg'],
      });
    } finally {
      await app.close();
    }
  });

  it('forwards marker batch trip updates to the service layer', async () => {
    mocks.batchUpdateMarkersTripMock.mockResolvedValue({
      users: [],
      markers: [],
      activeUserId: 'user-alice',
      savedGuides: [],
      guideSearchHistory: [],
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/markers/batch-trip',
        payload: {
          markerIds: ['marker-1', 'marker-2'],
          tripId: 'trip-1',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.batchUpdateMarkersTripMock).toHaveBeenCalledWith('acct-1', {
        markerIds: ['marker-1', 'marker-2'],
        tripId: 'trip-1',
      });
    } finally {
      await app.close();
    }
  });

  it('forwards marker deletes to the service layer', async () => {
    mocks.deleteMarkerRecordMock.mockResolvedValue({
      users: [],
      markers: [],
      activeUserId: 'user-alice',
      savedGuides: [],
      guideSearchHistory: [],
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/markers/marker-1',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.deleteMarkerRecordMock).toHaveBeenCalledWith('acct-1', 'marker-1');
    } finally {
      await app.close();
    }
  });
});
