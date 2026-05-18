// @vitest-environment node

import { expect, it } from 'vitest';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

describeAppApiRoutesDomain('guides', () => {
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

  it('forwards guide search log creation with account context', async () => {
    mocks.createGuideSearchLogResourceMock.mockResolvedValue({
      item: {
        id: 'log-1',
        companionId: 'user-alice',
        keyword: '京都',
        scope: 'international',
        provider: 'remote',
        page: 1,
        pageSize: 8,
        resultCount: 3,
        hasMore: false,
        durationMs: 120,
        status: 'success',
        sourceName: 'Qyer',
        sourceDomain: 'qyer.com',
        createdAt: '2026-04-22T00:00:00.000Z',
      },
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/guide-search-logs',
        payload: {
          companionId: 'user-alice',
          keyword: '京都',
          scope: 'international',
          provider: 'remote',
          page: 1,
          pageSize: 8,
          resultCount: 3,
          hasMore: false,
          durationMs: 120,
          status: 'success',
          sourceName: 'Qyer',
          sourceDomain: 'qyer.com',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.createGuideSearchLogResourceMock).toHaveBeenCalledWith('acct-1', {
        companionId: 'user-alice',
        keyword: '京都',
        scope: 'international',
        provider: 'remote',
        page: 1,
        pageSize: 8,
        resultCount: 3,
        hasMore: false,
        durationMs: 120,
        status: 'success',
        sourceName: 'Qyer',
        sourceDomain: 'qyer.com',
      });
    } finally {
      await app.close();
    }
  });

  it('forwards guide source health snapshot requests', async () => {
    mocks.listGuideSourceHealthResourceMock.mockResolvedValue({
      items: [
        {
          id: 'health-1',
          sourceName: 'Qyer',
          sourceDomain: 'qyer.com',
          recentSuccess: 4,
          recentFailure: 1,
        },
      ],
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/guide-source-health?limit=10',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.listGuideSourceHealthResourceMock).toHaveBeenCalledWith({ limit: 10 });
      expect(response.json().items[0].sourceName).toBe('Qyer');
    } finally {
      await app.close();
    }
  });

  it('forwards guide source preference updates with admin context', async () => {
    mocks.updateGuideSourcePreferenceResourceMock.mockResolvedValue({
      item: {
        id: 'health-1',
        sourceName: 'Qyer',
        sourceDomain: 'qyer.com',
        recentSuccess: 4,
        recentFailure: 1,
        priorityWeight: -1,
        demotionReason: '近期失败率偏高',
      },
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/guide-source-health/preferences',
        payload: {
          sourceName: 'Qyer',
          sourceDomain: 'qyer.com',
          priorityWeight: -1,
          demotionReason: '近期失败率偏高',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.updateGuideSourcePreferenceResourceMock).toHaveBeenCalledWith('acct-1', {
        sourceName: 'Qyer',
        sourceDomain: 'qyer.com',
        priorityWeight: -1,
        demotionReason: '近期失败率偏高',
      });
      expect(response.json().item.priorityWeight).toBe(-1);
    } finally {
      await app.close();
    }
  });
});
