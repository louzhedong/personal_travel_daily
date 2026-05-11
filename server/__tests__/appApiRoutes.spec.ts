// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppApiError } from '../appApi/errors.js';
import { getAppApiRouteMocks } from './appApiRoutes.mocks.js';

import { buildApp } from '../appApi/buildApp.js';

const mocks = getAppApiRouteMocks();

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

  it('supports account settings routes for authenticated accounts', async () => {
    mocks.getAccountSettingsMock.mockResolvedValue({
      account: currentAccount,
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-02T00:00:00.000Z',
    });
    mocks.updateAccountProfileMock.mockResolvedValue({
      account: { ...currentAccount, name: '新昵称' },
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
    });
    mocks.changeAccountPasswordMock.mockResolvedValue({ success: true });
    mocks.listAccountSessionsMock.mockResolvedValue({
      sessions: [
        {
          id: 'session-current',
          isCurrent: true,
          deviceLabel: 'Mac 浏览器',
          createdAt: '2026-05-01T00:00:00.000Z',
          lastSeenAt: '2026-05-08T00:00:00.000Z',
          expiresAt: '2026-05-15T00:00:00.000Z',
        },
      ],
    });
    mocks.revokeAccountSessionMock.mockResolvedValue({ success: true });
    mocks.logoutAllAccountSessionsMock.mockResolvedValue({ success: true });

    const app = await buildApp();
    try {
      const settingsResponse = await app.inject({ method: 'GET', url: '/api/account/settings' });
      expect(settingsResponse.statusCode).toBe(200);
      expect(mocks.getAccountSettingsMock).toHaveBeenCalledWith(currentAccount.id);

      const profileResponse = await app.inject({
        method: 'PATCH',
        url: '/api/account/profile',
        payload: { name: '新昵称' },
      });
      expect(profileResponse.statusCode).toBe(200);
      expect(mocks.updateAccountProfileMock).toHaveBeenCalledWith(currentAccount.id, { name: '新昵称' });

      const passwordResponse = await app.inject({
        method: 'PATCH',
        url: '/api/account/password',
        headers: { cookie: 'voyage_atlas_session=raw-token' },
        payload: { currentPassword: 'old-password', nextPassword: 'new-password' },
      });
      expect(passwordResponse.statusCode).toBe(200);
      expect(mocks.changeAccountPasswordMock).toHaveBeenCalledWith(currentAccount.id, 'raw-token', {
        currentPassword: 'old-password',
        nextPassword: 'new-password',
      });

      const sessionsResponse = await app.inject({
        method: 'GET',
        url: '/api/account/sessions',
        headers: { cookie: 'voyage_atlas_session=raw-token' },
      });
      expect(sessionsResponse.statusCode).toBe(200);
      expect(mocks.listAccountSessionsMock).toHaveBeenCalledWith(currentAccount.id, 'raw-token');

      const revokeResponse = await app.inject({
        method: 'DELETE',
        url: '/api/account/sessions/session-other',
        headers: { cookie: 'voyage_atlas_session=raw-token' },
      });
      expect(revokeResponse.statusCode).toBe(200);
      expect(mocks.revokeAccountSessionMock).toHaveBeenCalledWith(currentAccount.id, 'session-other', 'raw-token');

      const logoutAllResponse = await app.inject({
        method: 'POST',
        url: '/api/account/sessions/logout-all',
      });
      expect(logoutAllResponse.statusCode).toBe(200);
      expect(logoutAllResponse.headers['set-cookie']).toContain('voyage_atlas_session=');
      expect(mocks.logoutAllAccountSessionsMock).toHaveBeenCalledWith(currentAccount.id);
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
          markerSearchEvents: [],
          companions: [],
          stats: {
            tripCount: 0,
            companionCount: 0,
            markerCount: 0,
            savedGuideCount: 0,
            guideSearchHistoryCount: 0,
            markerSearchEventCount: 0,
          },
        },
      ],
      guideSearchTrends: [
        {
          date: '2026-04-22',
          totalCount: 3,
          successCount: 2,
          emptyCount: 1,
          errorCount: 0,
          topKeywords: [],
        },
      ],
      guideSearchStatusBreakdown: [{ status: 'success', count: 2 }],
      guideSourceHealth: [
        {
          id: 'health-1',
          sourceName: 'Qyer',
          sourceDomain: 'qyer.com',
          recentSuccess: 2,
          recentFailure: 0,
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
      expect(response.json().guideSourceHealth[0].sourceDomain).toBe('qyer.com');
      expect(mocks.getAdminOverviewMock).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });

  it('records and lists admin audit logs for admin accounts', async () => {
    mocks.recordAdminAuditLogMock.mockResolvedValue({
      id: 'audit-1',
      adminAccountId: 'acct-1',
      adminAccountName: 'Voyage Atlas',
      action: 'quality_issue_viewed',
      targetKind: 'marker',
      targetId: 'marker-1',
      metadata: {
        issueId: 'issue-1',
      },
      createdAt: '2026-05-09T00:00:00.000Z',
    });
    mocks.listAdminAuditTrailMock.mockResolvedValue({
      logs: [
        {
          id: 'audit-1',
          adminAccountId: 'acct-1',
          adminAccountName: 'Voyage Atlas',
          action: 'quality_issue_viewed',
          targetKind: 'marker',
          targetId: 'marker-1',
          createdAt: '2026-05-09T00:00:00.000Z',
        },
      ],
    });

    const app = await buildApp();
    try {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/admin/audit-logs',
        payload: {
          action: 'quality_issue_viewed',
          targetKind: 'marker',
          targetId: 'marker-1',
          metadata: {
            issueId: 'issue-1',
          },
        },
      });

      expect(createResponse.statusCode).toBe(200);
      expect(createResponse.json().id).toBe('audit-1');
      expect(mocks.recordAdminAuditLogMock).toHaveBeenCalledWith('acct-1', {
        action: 'quality_issue_viewed',
        targetKind: 'marker',
        targetId: 'marker-1',
        metadata: {
          issueId: 'issue-1',
        },
      });

      const listResponse = await app.inject({
        method: 'GET',
        url: '/api/admin/audit-logs?action=quality_issue_viewed&targetKind=marker&limit=20',
      });

      expect(listResponse.statusCode).toBe(200);
      expect(listResponse.json().logs[0].targetId).toBe('marker-1');
      expect(mocks.listAdminAuditTrailMock).toHaveBeenCalledWith({
        action: 'quality_issue_viewed',
        targetKind: 'marker',
        limit: 20,
      });
    } finally {
      await app.close();
    }
  });

  it('rejects invalid admin audit actions', async () => {
    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/audit-logs',
        payload: {
          action: 'invalid_action',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(mocks.recordAdminAuditLogMock).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('previews and applies admin quality auto fixes with audit logs', async () => {
    mocks.repairAdminQualityIssueMock
      .mockResolvedValueOnce({
        issueId: 'trip_missing_cover:trip-1',
        issueType: 'trip_missing_cover',
        targetKind: 'trip',
        targetId: 'trip-1',
        repairable: true,
        status: 'preview',
        title: '自动设置行程封面',
        description: '将使用第一张旅行照片作为封面。',
        changes: [{ field: 'coverImageUrl', before: null, after: 'https://example.com/cover.jpg' }],
      })
      .mockResolvedValueOnce({
        issueId: 'trip_missing_cover:trip-1',
        issueType: 'trip_missing_cover',
        targetKind: 'trip',
        targetId: 'trip-1',
        repairable: true,
        status: 'applied',
        title: '自动设置行程封面',
        description: '已设置行程封面。',
        changes: [{ field: 'coverImageUrl', before: null, after: 'https://example.com/cover.jpg' }],
        appliedAt: '2026-05-09T00:00:00.000Z',
      });
    mocks.recordAdminAuditLogMock.mockResolvedValue({
      id: 'audit-fix',
      adminAccountId: 'acct-1',
      adminAccountName: 'Voyage Atlas',
      action: 'quality_issue_auto_fixed',
      createdAt: '2026-05-09T00:00:00.000Z',
    });

    const app = await buildApp();
    try {
      const previewResponse = await app.inject({
        method: 'POST',
        url: '/api/admin/quality-issues/auto-fix',
        payload: {
          issueId: 'trip_missing_cover:trip-1',
          dryRun: true,
        },
      });
      const applyResponse = await app.inject({
        method: 'POST',
        url: '/api/admin/quality-issues/auto-fix',
        payload: {
          issueId: 'trip_missing_cover:trip-1',
          dryRun: false,
        },
      });

      expect(previewResponse.statusCode).toBe(200);
      expect(previewResponse.json().status).toBe('preview');
      expect(applyResponse.statusCode).toBe(200);
      expect(applyResponse.json().status).toBe('applied');
      expect(mocks.repairAdminQualityIssueMock).toHaveBeenCalledWith({
        issueId: 'trip_missing_cover:trip-1',
        dryRun: true,
      });
      expect(mocks.repairAdminQualityIssueMock).toHaveBeenCalledWith({
        issueId: 'trip_missing_cover:trip-1',
        dryRun: false,
      });
      expect(mocks.recordAdminAuditLogMock).toHaveBeenCalledWith(
        'acct-1',
        expect.objectContaining({
          action: 'quality_issue_auto_fix_previewed',
          targetKind: 'trip',
          targetId: 'trip-1',
        }),
      );
      expect(mocks.recordAdminAuditLogMock).toHaveBeenCalledWith(
        'acct-1',
        expect.objectContaining({
          action: 'quality_issue_auto_fixed',
          targetKind: 'trip',
          targetId: 'trip-1',
        }),
      );
    } finally {
      await app.close();
    }
  });

  it('returns stats overview payload for authenticated accounts', async () => {
    mocks.getStatsOverviewMock.mockResolvedValue({
      filters: {
        year: 'all',
        scope: 'all',
        tag: 'citywalk',
        mood: 'relaxed',
        weather: 'sunny',
        transport: 'walk',
        budgetLevel: 'medium',
      },
      availableYears: ['2026'],
      companions: [{ id: 'user-alice', name: '小悠', color: '#2563eb' }],
      trips: [],
      summary: {
        totalTrips: 1,
        totalMarkers: 2,
        totalTravelDays: 4,
        totalCities: 2,
        totalRegions: 2,
        totalCountries: 0,
        activeCompanions: 1,
        longestTripDays: 4,
      },
      yearlySeries: [{ year: '2026', markerCount: 2, travelDays: 4 }],
      monthlyDistribution: [{ month: '05', markerCount: 2, travelDays: 4 }],
      topRegions: [{ scopeId: 'zj', scopeName: '浙江', scope: 'domestic', markerCount: 2 }],
      topCities: [{ city: '杭州', scopeName: '浙江', scope: 'domestic', markerCount: 2 }],
      companionRanking: [
        {
          companionId: 'user-alice',
          companionName: '小悠',
          color: '#2563eb',
          markerCount: 2,
          travelDays: 4,
        },
      ],
      tripRanking: [],
      tripDetails: [],
      topTags: [{ value: 'citywalk', label: '城市漫游', markerCount: 2 }],
      topMoods: [{ value: 'relaxed', label: '放松', markerCount: 2 }],
      topWeather: [{ value: 'sunny', label: '晴', markerCount: 2 }],
      topTransports: [{ value: 'walk', label: '步行', markerCount: 2 }],
      topBudgetLevels: [{ value: 'medium', label: '中预算', markerCount: 2 }],
      tripHighlights: {},
      achievements: [
        {
          id: 'city-explorer',
          title: '城市探索者',
          description: '覆盖 5 座不同城市。',
          category: 'footprint',
          group: 'footprint',
          periodType: 'global',
          rarity: 'common',
          status: 'close',
          progressValue: 3,
          progressTarget: 5,
          unit: '座城市',
          nextHint: '还差 2 座城市，再多解锁几座新城市。',
        },
      ],
      heatmap: [{ scopeId: 'zj', scopeName: '浙江', scope: 'domestic', intensity: 5, markerCount: 2 }],
      generatedAt: '2026-04-22T00:00:00.000Z',
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/overview?scope=domestic&year=2026&tag=citywalk&mood=relaxed&weather=sunny&transport=walk&budgetLevel=medium',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.getStatsOverviewMock).toHaveBeenCalledWith(currentAccount, {
        scope: 'domestic',
        year: '2026',
        tag: 'citywalk',
        mood: 'relaxed',
        weather: 'sunny',
        transport: 'walk',
        budgetLevel: 'medium',
      });
      expect(response.json().summary.totalMarkers).toBe(2);
      expect(response.json().topTags[0]).toEqual({
        value: 'citywalk',
        label: '城市漫游',
        markerCount: 2,
      });
      expect(response.json().achievements[0]).toMatchObject({
        id: 'city-explorer',
        status: 'close',
      });
    } finally {
      await app.close();
    }
  });

  it('returns annual review payload for authenticated accounts', async () => {
    mocks.getAnnualReviewMock.mockResolvedValue({
      year: '2026',
      availableYears: ['2026'],
      summary: {
        totalTrips: 1,
        totalMarkers: 2,
        totalTravelDays: 4,
        totalCities: 2,
        totalRegions: 2,
        totalCountries: 0,
        activeCompanions: 1,
        longestTripDays: 4,
        photoCount: 1,
        guideCount: 1,
      },
      monthlyDistribution: [],
      topRegions: [],
      topCities: [],
      companionRanking: [],
      tripHighlights: {},
      heatmap: [],
      photos: [],
      guides: [],
      trips: [],
      achievements: [
        {
          id: 'annual-2026-travel-days',
          title: '年度出发王',
          description: '这一年旅行天数达到 20 天。',
          category: 'rhythm',
          group: 'annual',
          periodType: 'annual',
          rarity: 'rare',
          status: 'locked',
          progressValue: 4,
          progressTarget: 20,
          unit: '天',
          nextHint: '还差 16 天，继续累积更多出发日。',
        },
      ],
      generatedAt: '2026-04-22T00:00:00.000Z',
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/annual-review?year=2026',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.getAnnualReviewMock).toHaveBeenCalledWith(currentAccount, {
        year: '2026',
      });
      expect(response.json().year).toBe('2026');
    } finally {
      await app.close();
    }
  });

  it('returns trip detail payload for authenticated accounts', async () => {
    mocks.getTripDetailMock.mockResolvedValue({
      trip: {
        id: 'trip-1',
        name: '江南春游',
        note: '杭州与苏州周末行',
        startsAt: '2026-05-01',
        endsAt: '2026-05-03',
        createdAt: '2026-04-22T00:00:00.000Z',
      },
      summary: {
        markerCount: 2,
        travelDays: 3,
        cityCount: 2,
        regionCount: 2,
        companionCount: 1,
        guideCount: 1,
        photoCount: 2,
      },
      companions: [{ id: 'user-alice', name: '小悠', color: '#2563eb', markerCount: 2 }],
      markers: [],
      photos: [],
      guides: [],
      checklistSummary: {
        total: 2,
        preDepartureCount: 1,
        inTransitCount: 1,
        doneCount: 0,
      },
      checklistGroups: [
        {
          stage: 'pre_departure',
          title: '出发前准备',
          description: '把预约、路线、装备和行前确认放在这里。',
          itemCount: 1,
          items: [],
        },
        {
          stage: 'in_transit',
          title: '旅途中留意',
          description: '把路上节奏、交通衔接和现场提醒收在这里。',
          itemCount: 1,
          items: [],
        },
        {
          stage: 'done',
          title: '已经完成',
          description: '完成的事项会沉淀到这一组，方便回看。',
          itemCount: 0,
          items: [],
        },
      ],
      meta: {
        generatedAt: '2026-04-22T00:00:00.000Z',
      },
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/trips/trip-1/detail',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.getTripDetailMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1');
      expect(response.json().trip.name).toBe('江南春游');
      expect(response.json().checklistSummary.total).toBe(2);
    } finally {
      await app.close();
    }
  });

  it('updates trip photo curation for authenticated accounts', async () => {
    mocks.updateTripPhotoCurationMock.mockResolvedValue({
      trip: {
        id: 'trip-1',
        name: '江南春游',
        note: '',
        startsAt: '2026-05-01',
        endsAt: '2026-05-03',
        createdAt: '2026-04-22T00:00:00.000Z',
      },
      summary: {
        markerCount: 1,
        travelDays: 1,
        cityCount: 1,
        regionCount: 1,
        companionCount: 1,
        guideCount: 0,
        photoCount: 1,
      },
      companions: [],
      markers: [],
      photos: [
        {
          imageId: 'image-1',
          markerId: 'marker-1',
          markerTitle: '浙江 · 杭州',
          imageUrl: 'https://example.com/hangzhou.jpg',
          visitedStartAt: '2026-05-01',
          scopeName: '浙江',
          city: '杭州',
          isFeatured: true,
          caption: '西湖晚风',
          curatedSortOrder: 0,
        },
      ],
      guides: [],
      planningSummary: { total: 0, plannedCount: 0, convertedCount: 0, highPriorityCount: 0 },
      checklistSummary: { total: 0, preDepartureCount: 0, inTransitCount: 0, doneCount: 0 },
      checklistGroups: [],
      meta: {
        generatedAt: '2026-04-22T00:00:00.000Z',
      },
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/trips/trip-1/photos/curation',
        payload: {
          items: [
            {
              imageId: 'image-1',
              isFeatured: true,
              caption: '西湖晚风',
              curatedSortOrder: 0,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.updateTripPhotoCurationMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', {
        items: [
          {
            imageId: 'image-1',
            isFeatured: true,
            caption: '西湖晚风',
            curatedSortOrder: 0,
          },
        ],
      });
      expect(response.json().photos[0].isFeatured).toBe(true);
    } finally {
      await app.close();
    }
  });

  it('returns global photo curation payload for authenticated accounts', async () => {
    mocks.listPhotoCurationResourceMock.mockResolvedValue({
      summary: {
        totalPhotos: 2,
        featuredPhotos: 1,
        missingCaptionPhotos: 1,
        tripCount: 1,
        companionCount: 1,
        yearCount: 1,
      },
      filters: {
        trips: [{ id: 'trip-1', name: '杭州周末', photoCount: 2 }],
        companions: [{ id: 'user-alice', name: '小悠', color: '#2563eb', photoCount: 2 }],
        years: [{ year: 2026, photoCount: 2 }],
      },
      sections: {
        featured: [],
        missingCaptions: [],
        recent: [],
      },
      items: [],
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/photos/curation?tripId=trip-1&companionId=user-alice&year=2026&featured=featured&caption=withCaption&limit=20',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.listPhotoCurationResourceMock).toHaveBeenCalledWith(currentAccount.id, {
        tripId: 'trip-1',
        companionId: 'user-alice',
        year: 2026,
        featured: 'featured',
        caption: 'withCaption',
        limit: 20,
      });
      expect(response.json().summary.totalPhotos).toBe(2);
    } finally {
      await app.close();
    }
  });

  it('updates global photo curation metadata', async () => {
    mocks.updatePhotoCurationResourceMock.mockResolvedValue({
      summary: {
        totalPhotos: 1,
        featuredPhotos: 1,
        missingCaptionPhotos: 0,
        tripCount: 1,
        companionCount: 1,
        yearCount: 1,
      },
      filters: {
        trips: [{ id: 'trip-1', name: '杭州周末', photoCount: 1 }],
        companions: [{ id: 'user-alice', name: '小悠', color: '#2563eb', photoCount: 1 }],
        years: [{ year: 2026, photoCount: 1 }],
      },
      sections: {
        featured: [],
        missingCaptions: [],
        recent: [],
      },
      items: [],
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/photos/curation?tripId=trip-1',
        payload: {
          items: [
            {
              imageId: 'image-1',
              isFeatured: true,
              caption: '西湖晚风',
              curatedSortOrder: 0,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.updatePhotoCurationResourceMock).toHaveBeenCalledWith(
        currentAccount.id,
        {
          items: [
            {
              imageId: 'image-1',
              isFeatured: true,
              caption: '西湖晚风',
              curatedSortOrder: 0,
            },
          ],
        },
        {
          tripId: 'trip-1',
          featured: 'all',
          caption: 'all',
          limit: 120,
        },
      );
      expect(response.json().summary.featuredPhotos).toBe(1);
    } finally {
      await app.close();
    }
  });

  it('returns NOT_FOUND when global photo curation updates include inaccessible images', async () => {
    mocks.updatePhotoCurationResourceMock.mockRejectedValueOnce(
      new AppApiError('NOT_FOUND', 'photo not found', 404),
    );

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/photos/curation',
        payload: {
          items: [{ imageId: 'not-owned-image', isFeatured: true }],
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'photo not found',
        },
      });
    } finally {
      await app.close();
    }
  });

  it('supports trip checklist routes for authenticated accounts', async () => {
    mocks.listTripChecklistMock.mockResolvedValue({
      summary: { total: 1, preDepartureCount: 1, inTransitCount: 0, doneCount: 0 },
      groups: [],
    });
    mocks.generateTripChecklistMock.mockResolvedValue({
      createdCount: 3,
      deduplicatedCount: 0,
      items: [],
    });
    mocks.createTripChecklistItemResourceMock.mockResolvedValue({
      id: 'item-1',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      title: '准备机场交通',
      stage: 'pre_departure',
      sortOrder: 0,
      origin: 'manual',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
    });
    mocks.updateTripChecklistItemResourceMock.mockResolvedValue({
      id: 'item-1',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      title: '准备机场交通',
      stage: 'done',
      sortOrder: 0,
      origin: 'manual',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-02T00:00:00.000Z',
    });
    mocks.deleteTripChecklistItemResourceMock.mockResolvedValue({
      deletedId: 'item-1',
    });

    const app = await buildApp();
    try {
      const listResponse = await app.inject({
        method: 'GET',
        url: '/api/trips/trip-1/checklist',
      });
      const generateResponse = await app.inject({
        method: 'POST',
        url: '/api/trips/trip-1/checklist/generate',
        payload: {
          companionId: 'user-alice',
          guide: {
            title: '京都春日路线',
            summary: '适合第一次去京都的三天行程。',
            sourceName: 'Mock Guide',
            sourceUrl: 'https://example.com/guides/kyoto',
          },
        },
      });
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/trips/trip-1/checklist/items',
        payload: {
          companionId: 'user-alice',
          title: '准备机场交通',
          note: '优先地铁',
          stage: 'pre_departure',
        },
      });
      const updateResponse = await app.inject({
        method: 'PATCH',
        url: '/api/trips/trip-1/checklist/items/item-1',
        payload: {
          stage: 'done',
        },
      });
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: '/api/trips/trip-1/checklist/items/item-1',
      });

      expect(listResponse.statusCode).toBe(200);
      expect(generateResponse.statusCode).toBe(200);
      expect(createResponse.statusCode).toBe(200);
      expect(updateResponse.statusCode).toBe(200);
      expect(deleteResponse.statusCode).toBe(200);
      expect(mocks.listTripChecklistMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1');
      expect(mocks.generateTripChecklistMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', expect.any(Object));
      expect(mocks.createTripChecklistItemResourceMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', {
        companionId: 'user-alice',
        title: '准备机场交通',
        note: '优先地铁',
        stage: 'pre_departure',
      });
      expect(mocks.updateTripChecklistItemResourceMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', 'item-1', {
        stage: 'done',
      });
      expect(mocks.deleteTripChecklistItemResourceMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', 'item-1');
    } finally {
      await app.close();
    }
  });

  it('supports trip planning routes for authenticated accounts', async () => {
    const planningItem = {
      id: 'plan-1',
      tripId: 'trip-1',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      title: '岚山竹林',
      scope: 'international',
      scopeId: 'japan',
      scopeName: '日本',
      city: '京都',
      priority: 'high',
      status: 'planned',
      sortOrder: 0,
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
    };
    mocks.listTripPlanningMock.mockResolvedValue({
      summary: { total: 1, plannedCount: 1, convertedCount: 0, highPriorityCount: 1 },
      items: [planningItem],
    });
    mocks.createTripPlanningItemResourceMock.mockResolvedValue(planningItem);
    mocks.updateTripPlanningItemResourceMock.mockResolvedValue({ ...planningItem, priority: 'medium' });
    mocks.deleteTripPlanningItemResourceMock.mockResolvedValue({ deletedId: 'plan-1' });
    mocks.convertTripPlanningItemToMarkerMock.mockResolvedValue({ markers: [], users: [], trips: [], activeUserId: 'user-alice', savedGuides: [], guideSearchHistory: [] });

    const app = await buildApp();
    try {
      const listResponse = await app.inject({ method: 'GET', url: '/api/trips/trip-1/planning' });
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/trips/trip-1/planning/items',
        payload: {
          companionId: 'user-alice',
          title: '岚山竹林',
          scope: 'international',
          scopeId: 'japan',
          scopeName: '日本',
          city: '京都',
          priority: 'high',
        },
      });
      const updateResponse = await app.inject({
        method: 'PATCH',
        url: '/api/trips/trip-1/planning/items/plan-1',
        payload: { priority: 'medium' },
      });
      const convertResponse = await app.inject({
        method: 'POST',
        url: '/api/trips/trip-1/planning/items/plan-1/convert-to-marker',
        payload: {
          visitedStartAt: '2026-05-01',
          visitedEndAt: '2026-05-01',
        },
      });
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: '/api/trips/trip-1/planning/items/plan-1',
      });

      expect(listResponse.statusCode).toBe(200);
      expect(createResponse.statusCode).toBe(200);
      expect(updateResponse.statusCode).toBe(200);
      expect(convertResponse.statusCode).toBe(200);
      expect(deleteResponse.statusCode).toBe(200);
      expect(mocks.listTripPlanningMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1');
      expect(mocks.createTripPlanningItemResourceMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', expect.objectContaining({ title: '岚山竹林' }));
      expect(mocks.updateTripPlanningItemResourceMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', 'plan-1', { priority: 'medium' });
      expect(mocks.convertTripPlanningItemToMarkerMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', 'plan-1', expect.objectContaining({ visitedStartAt: '2026-05-01' }));
      expect(mocks.deleteTripPlanningItemResourceMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', 'plan-1');
    } finally {
      await app.close();
    }
  });

  it('imports wishlist items into trip planning', async () => {
    const planningItem = {
      id: 'planning-from-wishlist',
      tripId: 'trip-1',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      title: '京都',
      scope: 'international',
      scopeId: 'japan',
      scopeName: '日本',
      city: '京都',
      priority: 'medium',
      sourceWishlistId: 'wishlist-1',
      status: 'planned',
      sortOrder: 1,
      createdAt: '2026-05-03T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
    };
    mocks.createTripPlanningItemFromWishlistMock.mockResolvedValue(planningItem);

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/trips/trip-1/planning/from-wishlist/wishlist-1',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().id).toBe('planning-from-wishlist');
      expect(mocks.createTripPlanningItemFromWishlistMock).toHaveBeenCalledWith(
        currentAccount.id,
        'trip-1',
        'wishlist-1',
      );
    } finally {
      await app.close();
    }
  });

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
      expect(mocks.registerAccountMock).toHaveBeenCalledWith(
        {
          nickname: 'Voyage Atlas',
          username: 'demo',
          password: 'demo123456',
        },
        {
          userAgent: 'lightMyRequest',
          ipAddress: '127.0.0.1',
        },
      );
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

  it('returns UNAUTHORIZED for global photo curation when no session is available', async () => {
    mocks.requireAuthenticatedAccountMock.mockRejectedValueOnce(
      new AppApiError('UNAUTHORIZED', 'authentication required', 401),
    );

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/photos/curation',
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

  it('returns companion memory payload for the authenticated account', async () => {
    mocks.getCompanionMemoryMock.mockResolvedValue({
      companion: { id: 'user-alice', name: '小悠', color: '#2563eb' },
      summary: {
        markerCount: 1,
        travelDays: 2,
        tripCount: 1,
        cityCount: 1,
        regionCount: 1,
        photoCount: 1,
        guideCount: 0,
        headline: '你们一起留下了 1 段旅行记忆。',
      },
      yearlySeries: [],
      topRegions: [],
      topCities: [],
      themes: [],
      trips: [],
      photos: [],
      guides: [],
      milestones: [],
      snapshot: {
        generatedAt: '2026-05-08T00:00:00.000Z',
        expiresAt: '2026-05-09T00:00:00.000Z',
        stale: false,
        sourceMarkerCount: 1,
        sourcePhotoCount: 1,
        sourceGuideCount: 0,
      },
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/companions/user-alice/memories',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().companion.name).toBe('小悠');
      expect(mocks.getCompanionMemoryMock).toHaveBeenCalledWith('acct-1', 'user-alice');
    } finally {
      await app.close();
    }
  });

  it('refreshes companion memory payload explicitly', async () => {
    mocks.refreshCompanionMemoryMock.mockResolvedValue({
      companion: { id: 'user-alice', name: '小悠', color: '#2563eb' },
      summary: {
        markerCount: 0,
        travelDays: 0,
        tripCount: 0,
        cityCount: 0,
        regionCount: 0,
        photoCount: 0,
        guideCount: 0,
        headline: '还没有和小悠留下旅行记录。',
      },
      yearlySeries: [],
      topRegions: [],
      topCities: [],
      themes: [],
      trips: [],
      photos: [],
      guides: [],
      milestones: [],
      snapshot: {
        generatedAt: '2026-05-08T00:00:00.000Z',
        expiresAt: '2026-05-09T00:00:00.000Z',
        stale: false,
        sourceMarkerCount: 0,
        sourcePhotoCount: 0,
        sourceGuideCount: 0,
      },
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/companions/user-alice/memories/refresh',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.refreshCompanionMemoryMock).toHaveBeenCalledWith('acct-1', 'user-alice');
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
});
