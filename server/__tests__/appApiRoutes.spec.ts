// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppApiError } from '../appApi/errors.js';

const mocks = vi.hoisted(() => ({
  getBootstrapPayloadMock: vi.fn(),
  createCompanionRecordMock: vi.fn(),
  updateCompanionRecordMock: vi.fn(),
  createMarkerRecordMock: vi.fn(),
  updateMarkerRecordMock: vi.fn(),
  deleteMarkerRecordMock: vi.fn(),
  listSavedGuidesResourceMock: vi.fn(),
  createSavedGuideResourceMock: vi.fn(),
  deleteSavedGuideResourceMock: vi.fn(),
  listGuideSearchHistoriesResourceMock: vi.fn(),
  createGuideSearchHistoryResourceMock: vi.fn(),
}));

vi.mock('../appApi/services/bootstrapService.js', () => ({
  getBootstrapPayload: mocks.getBootstrapPayloadMock,
}));

vi.mock('../appApi/services/companionService.js', () => ({
  createCompanionRecord: mocks.createCompanionRecordMock,
  updateCompanionRecord: mocks.updateCompanionRecordMock,
}));

vi.mock('../appApi/services/markerService.js', () => ({
  createMarkerRecord: mocks.createMarkerRecordMock,
  updateMarkerRecord: mocks.updateMarkerRecordMock,
  deleteMarkerRecord: mocks.deleteMarkerRecordMock,
}));

vi.mock('../appApi/services/savedGuideService.js', () => ({
  listSavedGuidesResource: mocks.listSavedGuidesResourceMock,
  createSavedGuideResource: mocks.createSavedGuideResourceMock,
  deleteSavedGuideResource: mocks.deleteSavedGuideResourceMock,
}));

vi.mock('../appApi/services/guideSearchHistoryService.js', () => ({
  listGuideSearchHistoriesResource: mocks.listGuideSearchHistoriesResourceMock,
  createGuideSearchHistoryResource: mocks.createGuideSearchHistoryResourceMock,
}));

import { buildApp } from '../appApi/buildApp.js';

describe('app api routes', () => {
  beforeEach(() => {
    process.env.APP_API_HOST = '127.0.0.1';
    process.env.APP_API_PORT = '8788';
    process.env.APP_API_CORS_ORIGIN = '*';
    process.env.APP_DEFAULT_ACCOUNT_ID = 'acct_default';
    process.env.APP_DEFAULT_ACCOUNT_NAME = 'Voyage Atlas';
    process.env.DATABASE_URL = 'mysql://travel_app:travel_app_password@127.0.0.1:3306/personal_travel_daily';

    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns bootstrap payload from the app bootstrap route', async () => {
    mocks.getBootstrapPayloadMock.mockResolvedValue({
      store: {
        users: [{ id: 'user-alice', name: '小悠', color: '#2563eb' }],
        markers: [],
        activeUserId: 'user-alice',
        savedGuides: [],
        guideSearchHistory: [],
      },
      meta: {
        accountId: 'acct_default',
        fetchedAt: '2026-04-22T00:00:00.000Z',
      },
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/app/bootstrap',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().meta.accountId).toBe('acct_default');
      expect(mocks.getBootstrapPayloadMock).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });

  it('returns INVALID_REQUEST when companion payload fails validation', async () => {
    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/companions',
        payload: {
          name: '',
          color: 'blue',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: {
          code: 'INVALID_REQUEST',
          message: 'name is required',
        },
      });
      expect(mocks.createCompanionRecordMock).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('forwards companion update params and payload to the service layer', async () => {
    mocks.updateCompanionRecordMock.mockResolvedValue({
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
        url: '/api/companions/user-bob',
        payload: {
          color: '#ea580c',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.updateCompanionRecordMock).toHaveBeenCalledWith('user-bob', {
        color: '#ea580c',
      });
    } finally {
      await app.close();
    }
  });

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
          scope: 'international',
          scopeId: 'jp-kyoto',
          scopeName: '京都府',
          city: '京都',
          note: '春天赏樱',
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
      expect(mocks.createMarkerRecordMock).toHaveBeenCalledTimes(1);
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
          imageUrls: ['https://example.com/updated.jpg'],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.updateMarkerRecordMock).toHaveBeenCalledWith('marker-1', {
        note: '更新后的备注',
        imageUrls: ['https://example.com/updated.jpg'],
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
      expect(mocks.deleteMarkerRecordMock).toHaveBeenCalledWith('marker-1');
    } finally {
      await app.close();
    }
  });

  it('returns saved guide mutation payloads and preserves deduplicated flags', async () => {
    mocks.createSavedGuideResourceMock.mockResolvedValue({
      item: {
        id: 'saved-guide-1',
        savedByUserId: 'user-alice',
        keyword: '京都',
        result: {
          id: 'guide-1',
          title: '京都三日路线',
          summary: '适合第一次去京都。',
          sourceName: '示例来源',
          sourceUrl: 'https://example.com/guides/kyoto',
        },
        savedAt: '2026-04-22T00:00:00.000Z',
      },
      deduplicated: true,
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/saved-guides',
        payload: {
          savedByUserId: 'user-alice',
          keyword: '京都',
          result: {
            id: 'guide-1',
            title: '京都三日路线',
            summary: '适合第一次去京都。',
            sourceName: '示例来源',
            sourceUrl: 'https://example.com/guides/kyoto',
          },
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().deduplicated).toBe(true);
      expect(mocks.createSavedGuideResourceMock).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });

  it('forwards saved guide list query filters to the resource layer', async () => {
    mocks.listSavedGuidesResourceMock.mockResolvedValue({
      items: [],
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/saved-guides?companionId=user-alice&markerId=marker-1',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.listSavedGuidesResourceMock).toHaveBeenCalledWith({
        companionId: 'user-alice',
        markerId: 'marker-1',
      });
    } finally {
      await app.close();
    }
  });

  it('forwards saved guide deletes to the resource layer', async () => {
    mocks.deleteSavedGuideResourceMock.mockResolvedValue({
      deletedId: 'saved-guide-1',
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/saved-guides/saved-guide-1',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        deletedId: 'saved-guide-1',
      });
      expect(mocks.deleteSavedGuideResourceMock).toHaveBeenCalledWith('saved-guide-1');
    } finally {
      await app.close();
    }
  });

  it('forwards guide search history query params to the resource layer', async () => {
    mocks.listGuideSearchHistoriesResourceMock.mockResolvedValue({
      items: [
        {
          id: 'history-1',
          keyword: '京都',
          scope: 'international',
          createdAt: '2026-04-22T00:00:00.000Z',
        },
      ],
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/guide-search-histories?companionId=user-alice&limit=6',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().items).toHaveLength(1);
      expect(mocks.listGuideSearchHistoriesResourceMock).toHaveBeenCalledWith({
        companionId: 'user-alice',
        limit: 6,
      });
    } finally {
      await app.close();
    }
  });

  it('forwards guide search history creation payloads to the resource layer', async () => {
    mocks.createGuideSearchHistoryResourceMock.mockResolvedValue({
      item: {
        id: 'history-1',
        keyword: '京都',
        scope: 'international',
        createdAt: '2026-04-22T00:00:00.000Z',
      },
      deduplicated: false,
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/guide-search-histories',
        payload: {
          companionId: 'user-alice',
          keyword: '京都',
          scope: 'international',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.createGuideSearchHistoryResourceMock).toHaveBeenCalledWith({
        companionId: 'user-alice',
        keyword: '京都',
        scope: 'international',
      });
    } finally {
      await app.close();
    }
  });
});
