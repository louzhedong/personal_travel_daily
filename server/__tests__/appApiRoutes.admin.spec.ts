// @vitest-environment node

import { expect, it } from 'vitest';
import { AppApiError } from '../appApi/errors.js';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

describeAppApiRoutesDomain('admin', () => {
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
});
