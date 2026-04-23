// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppApiError } from '../appApi/errors.js';

const mocks = vi.hoisted(() => ({
  getBootstrapPayloadMock: vi.fn(),
  getAdminOverviewMock: vi.fn(),
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
  registerAccountMock: vi.fn(),
  loginAccountMock: vi.fn(),
  logoutAccountMock: vi.fn(),
  requireAuthenticatedAccountMock: vi.fn(),
  requireAdminAccountMock: vi.fn(),
  getAuthenticatedAccountMock: vi.fn(),
}));

vi.mock('../appApi/services/bootstrapService.js', () => ({
  getBootstrapPayload: mocks.getBootstrapPayloadMock,
}));

vi.mock('../appApi/services/adminService.js', () => ({
  getAdminOverview: mocks.getAdminOverviewMock,
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

vi.mock('../appApi/services/authService.js', () => ({
  registerAccount: mocks.registerAccountMock,
  loginAccount: mocks.loginAccountMock,
  logoutAccount: mocks.logoutAccountMock,
}));

vi.mock('../appApi/auth/requestAuth.js', () => ({
  requireAuthenticatedAccount: mocks.requireAuthenticatedAccountMock,
  requireAdminAccount: mocks.requireAdminAccountMock,
  getAuthenticatedAccount: mocks.getAuthenticatedAccountMock,
}));

import { buildApp } from '../appApi/buildApp.js';

const currentAccount = {
  id: 'acct-1',
  name: 'Voyage Atlas',
  username: 'demo',
  role: 'admin' as const,
};

describe('app api routes', () => {
  beforeEach(() => {
    process.env.APP_API_HOST = '127.0.0.1';
    process.env.APP_API_PORT = '8788';
    process.env.APP_API_CORS_ORIGIN = '*';
    process.env.APP_DEFAULT_ACCOUNT_ID = 'acct_default';
    process.env.APP_DEFAULT_ACCOUNT_NAME = 'Voyage Atlas';
    process.env.APP_DEFAULT_ACCOUNT_USERNAME = 'demo';
    process.env.APP_DEFAULT_ACCOUNT_PASSWORD = 'demo123456';
    process.env.DATABASE_URL = 'mysql://travel_app:travel_app_password@127.0.0.1:3306/personal_travel_daily';

    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.requireAuthenticatedAccountMock.mockResolvedValue(currentAccount);
    mocks.requireAdminAccountMock.mockResolvedValue(currentAccount);
    mocks.getAuthenticatedAccountMock.mockResolvedValue(currentAccount);
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
        accountId: 'acct-1',
        account: currentAccount,
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
      expect(response.json().meta.account.username).toBe('demo');
      expect(mocks.getBootstrapPayloadMock).toHaveBeenCalledWith(currentAccount);
    } finally {
      await app.close();
    }
  });

  it('returns the current session account when logged in', async () => {
    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/session',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        account: currentAccount,
      });
    } finally {
      await app.close();
    }
  });

  it('returns admin overview payload for admin accounts', async () => {
    mocks.getAdminOverviewMock.mockResolvedValue({
      accounts: [
        {
          id: 'acct-1',
          name: 'Voyage Atlas',
          username: 'demo',
          role: 'admin',
          createdAt: '2026-04-22T00:00:00.000Z',
          trips: [],
          companions: [],
          stats: {
            tripCount: 0,
            companionCount: 0,
            markerCount: 0,
            savedGuideCount: 0,
            guideSearchHistoryCount: 0,
          },
        },
      ],
      meta: {
        fetchedAt: '2026-04-22T00:00:00.000Z',
        accountCount: 1,
      },
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/overview',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().accounts[0].role).toBe('admin');
      expect(mocks.getAdminOverviewMock).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });

  it('registers an account and writes a session cookie', async () => {
    mocks.registerAccountMock.mockResolvedValue({
      account: currentAccount,
      sessionToken: 'token',
      expiresAt: new Date('2026-04-29T00:00:00.000Z'),
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          nickname: 'Voyage Atlas',
          username: 'demo',
          password: 'demo123456',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.cookies[0]?.name).toBe('voyage_atlas_session');
      expect(mocks.registerAccountMock).toHaveBeenCalledWith({
        nickname: 'Voyage Atlas',
        username: 'demo',
        password: 'demo123456',
      });
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

  it('returns UNAUTHORIZED when protected routes are accessed without a session', async () => {
    mocks.requireAuthenticatedAccountMock.mockRejectedValueOnce(
      new AppApiError('UNAUTHORIZED', 'authentication required', 401),
    );

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/saved-guides',
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: 'authentication required',
        },
      });
    } finally {
      await app.close();
    }
  });

  it('returns FORBIDDEN when admin routes are accessed by non-admin accounts', async () => {
    mocks.requireAdminAccountMock.mockRejectedValueOnce(
      new AppApiError('FORBIDDEN', 'admin access required', 403),
    );

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/overview',
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual({
        error: {
          code: 'FORBIDDEN',
          message: 'admin access required',
        },
      });
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
      expect(mocks.updateCompanionRecordMock).toHaveBeenCalledWith('acct-1', 'user-bob', {
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
      expect(mocks.updateMarkerRecordMock).toHaveBeenCalledWith('acct-1', 'marker-1', {
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
      expect(mocks.deleteMarkerRecordMock).toHaveBeenCalledWith('acct-1', 'marker-1');
    } finally {
      await app.close();
    }
  });

  it('forwards saved guide resource requests with account context', async () => {
    mocks.listSavedGuidesResourceMock.mockResolvedValue({ items: [] });
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
      await app.inject({
        method: 'GET',
        url: '/api/saved-guides?companionId=user-alice&markerId=marker-1',
      });

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
      expect(mocks.listSavedGuidesResourceMock).toHaveBeenCalledWith('acct-1', {
        companionId: 'user-alice',
        markerId: 'marker-1',
      });
      expect(mocks.createSavedGuideResourceMock).toHaveBeenCalledWith('acct-1', {
        savedByUserId: 'user-alice',
        keyword: '京都',
        result: {
          id: 'guide-1',
          title: '京都三日路线',
          summary: '适合第一次去京都。',
          sourceName: '示例来源',
          sourceUrl: 'https://example.com/guides/kyoto',
        },
      });
    } finally {
      await app.close();
    }
  });

  it('forwards guide search history requests with account context', async () => {
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
      await app.inject({
        method: 'GET',
        url: '/api/guide-search-histories?companionId=user-alice&limit=6',
      });

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
      expect(mocks.listGuideSearchHistoriesResourceMock).toHaveBeenCalledWith('acct-1', {
        companionId: 'user-alice',
        limit: 6,
      });
      expect(mocks.createGuideSearchHistoryResourceMock).toHaveBeenCalledWith('acct-1', {
        companionId: 'user-alice',
        keyword: '京都',
        scope: 'international',
      });
    } finally {
      await app.close();
    }
  });
});
