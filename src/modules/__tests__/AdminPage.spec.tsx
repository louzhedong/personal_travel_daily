import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyAdminQualityAutoFix,
  fetchAdminAuditLogs,
  fetchAdminOverview,
  previewAdminQualityAutoFix,
  recordAdminAuditLog,
} from '../../lib/api/adminApi';
import AdminPage from '../admin/AdminPage';

vi.mock('../../lib/api/adminApi', () => ({
  fetchAdminOverview: vi.fn(),
  fetchAdminAuditLogs: vi.fn(),
  recordAdminAuditLog: vi.fn(),
  previewAdminQualityAutoFix: vi.fn(),
  applyAdminQualityAutoFix: vi.fn(),
}));

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchAdminAuditLogs).mockResolvedValue({ logs: [] });
    vi.mocked(recordAdminAuditLog).mockResolvedValue({
      id: 'audit-new',
      adminAccountId: 'acct-1',
      adminAccountName: 'Voyage Atlas',
      action: 'quality_issue_viewed',
      createdAt: '2026-04-22T00:00:00.000Z',
    });
    vi.mocked(previewAdminQualityAutoFix).mockResolvedValue({
      issueId: 'trip_missing_cover:trip-1',
      issueType: 'trip_missing_cover',
      targetKind: 'trip',
      targetId: 'trip-1',
      repairable: true,
      status: 'preview',
      title: '自动设置行程封面',
      description: '将使用第一张旅行照片作为封面。',
      changes: [{ field: 'coverImageUrl', before: null, after: 'https://example.com/cover.jpg' }],
    });
    vi.mocked(applyAdminQualityAutoFix).mockResolvedValue({
      issueId: 'trip_missing_cover:trip-1',
      issueType: 'trip_missing_cover',
      targetKind: 'trip',
      targetId: 'trip-1',
      repairable: true,
      status: 'applied',
      title: '自动设置行程封面',
      description: '已设置行程封面。',
      changes: [{ field: 'coverImageUrl', before: null, after: 'https://example.com/cover.jpg' }],
      appliedAt: '2026-04-22T00:00:00.000Z',
    });
  });

  it('renders the admin overview payload', async () => {
    vi.mocked(fetchAdminOverview).mockResolvedValue({
      accounts: [
        {
          id: 'acct-1',
          name: 'Voyage Atlas',
          username: 'demo',
          role: 'admin',
          createdAt: '2026-04-22T00:00:00.000Z',
          stats: {
            tripCount: 1,
            companionCount: 1,
            markerCount: 1,
            savedGuideCount: 1,
            guideSearchHistoryCount: 1,
            markerSearchEventCount: 1,
            planningItemCount: 1,
            convertedPlanningItemCount: 0,
          },
          trips: [
            {
              id: 'trip-1',
              name: '2026 江南春游',
              note: '春天出行',
              startsAt: '2026-04-20',
              endsAt: '2026-04-21',
              createdAt: '2026-04-22T00:00:00.000Z',
            },
          ],
          markerSearchEvents: [
            {
              id: 'marker-search-1',
              companionId: 'companion-1',
              keyword: '西湖',
              scope: 'domestic',
              year: '2026',
              resultCount: 7,
              page: 1,
              pageSize: 20,
              createdAt: '2026-04-22T00:00:00.000Z',
            },
          ],
          companions: [
            {
              id: 'companion-1',
              name: '小悠',
              color: '#2563eb',
              createdAt: '2026-04-22T00:00:00.000Z',
              markers: [
                {
                  id: 'marker-1',
                  tripId: 'trip-1',
                  scope: 'domestic',
                  scopeId: 'zj',
                  scopeName: '浙江',
                  city: '杭州',
                  note: '西湖散步',
                  visitedStartAt: '2026-04-20',
                  visitedEndAt: '2026-04-21',
                  createdAt: '2026-04-22T00:00:00.000Z',
                },
              ],
              savedGuides: [
                {
                  id: 'guide-save-1',
                  keyword: '杭州',
                  savedAt: '2026-04-22T00:00:00.000Z',
                  result: {
                    id: 'guide-1',
                    title: '杭州周末攻略',
                    summary: '适合两天一夜。',
                    sourceName: '示例来源',
                    sourceUrl: 'https://example.com/guides/hangzhou',
                  },
                },
              ],
              guideSearchHistory: [
                {
                  id: 'history-1',
                  keyword: '杭州',
                  scope: 'domestic',
                  createdAt: '2026-04-22T00:00:00.000Z',
                },
              ],
              planningItems: [
                {
                  id: 'planning-1',
                  tripId: 'trip-1',
                  tripName: '2026 江南春游',
                  companionId: 'companion-1',
                  companionName: '小悠',
                  companionColor: '#2563eb',
                  title: '灵隐寺',
                  scope: 'domestic',
                  scopeId: 'zj',
                  scopeName: '浙江',
                  city: '杭州',
                  priority: 'high',
                  status: 'planned',
                  sortOrder: 0,
                  createdAt: '2026-04-22T00:00:00.000Z',
                  updatedAt: '2026-04-22T00:00:00.000Z',
                },
              ],
            },
          ],
        },
        {
          id: 'acct-2',
          name: '另一位用户',
          username: 'other-user',
          role: 'member',
          createdAt: '2026-04-23T00:00:00.000Z',
          stats: {
            tripCount: 0,
            companionCount: 1,
            markerCount: 0,
            savedGuideCount: 0,
            guideSearchHistoryCount: 0,
            markerSearchEventCount: 0,
            planningItemCount: 0,
            convertedPlanningItemCount: 0,
          },
          trips: [],
          markerSearchEvents: [],
          companions: [
            {
              id: 'companion-2',
              name: '阿南',
              color: '#f97316',
              createdAt: '2026-04-23T00:00:00.000Z',
              markers: [],
              savedGuides: [],
              guideSearchHistory: [],
              planningItems: [],
            },
          ],
        },
      ],
      quality: {
        summary: {
          criticalCount: 1,
          warningCount: 1,
          infoCount: 1,
          affectedAccountCount: 1,
          checkedAt: '2026-04-22T00:00:00.000Z',
        },
        issues: [
          {
            id: 'guide_source_degraded:source-1',
            severity: 'critical',
            type: 'guide_source_degraded',
            title: '攻略来源异常',
            description: '示例来源 最近失败 3 次，成功 1 次。',
            targetKind: 'guideSource',
            targetId: 'source-1',
            targetLabel: '示例来源',
            detectedAt: '2026-04-22T00:00:00.000Z',
            suggestedAction: '检查来源适配器或降级该来源权重。',
            navigationKind: 'adminOnly',
            canNavigate: false,
          },
          {
            id: 'marker_missing_photo:marker-1',
            severity: 'warning',
            type: 'marker_missing_photo',
            title: '记录缺少照片',
            description: '浙江 · 杭州 没有关联照片。',
            accountId: 'acct-1',
            accountName: 'Voyage Atlas',
            targetKind: 'marker',
            targetId: 'marker-1',
            targetLabel: '浙江 · 杭州',
            detectedAt: '2026-04-22T00:00:00.000Z',
            suggestedAction: '在记录详情中补充照片。',
            navigationKind: 'tripDetail',
            navigationPayload: {
              tripId: 'trip-1',
              markerId: 'marker-1',
            },
            canNavigate: true,
          },
          {
            id: 'trip_missing_cover:trip-1',
            severity: 'info',
            type: 'trip_missing_cover',
            title: '行程缺少封面',
            description: '2026 江南春游 还没有封面图。',
            accountId: 'acct-1',
            accountName: 'Voyage Atlas',
            targetKind: 'trip',
            targetId: 'trip-1',
            targetLabel: '2026 江南春游',
            detectedAt: '2026-04-22T00:00:00.000Z',
            suggestedAction: '在行程详情中设置封面。',
            navigationKind: 'tripDetail',
            navigationPayload: {
              tripId: 'trip-1',
            },
            canNavigate: true,
            autoFix: {
              repairable: true,
              label: '自动设置封面',
              description: '从该行程已有旅行照片中选择第一张作为封面。',
              riskLevel: 'low',
            },
          },
        ],
      },
      meta: {
        fetchedAt: '2026-04-22T00:00:00.000Z',
        accountCount: 2,
      },
    });

    const onNavigateToPath = vi.fn();

    render(
      <AdminPage
        account={{ id: 'acct-1', name: 'Voyage Atlas', username: 'demo', role: 'admin' }}
        onLogout={vi.fn()}
        onNavigateHome={vi.fn()}
        onNavigateToPath={onNavigateToPath}
      />,
    );

    expect(await screen.findByText('系统用户总览')).toBeInTheDocument();
    expect(await screen.findByText('用户列表')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '质量巡检' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '问题筛选' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '审计日志' })).toBeInTheDocument();
    expect((await screen.findAllByText('攻略来源异常')).length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText('账号质量')).toBeInTheDocument();
    expect((await screen.findAllByText('Voyage Atlas')).length).toBeGreaterThanOrEqual(2);
    expect(await screen.findByRole('tab', { name: '行程' })).toBeInTheDocument();
    expect((await screen.findAllByText('2026 江南春游')).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('小悠').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('tab', { name: '旅行记录' }));
    expect((await screen.findAllByText('2026 江南春游')).length).toBeGreaterThanOrEqual(2);
    expect(await screen.findByText('西湖散步')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: '收藏攻略' }));
    expect(await screen.findByText('杭州周末攻略')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: '攻略搜索' }));
    expect(await screen.findByText('杭州')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: '记录搜索' }));
    expect(await screen.findByText('西湖')).toBeInTheDocument();
    expect(await screen.findByText('7')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /另一位用户/ }));
    expect(await screen.findByText('@other-user')).toBeInTheDocument();
    expect(await screen.findByText('暂无质量问题')).toBeInTheDocument();
    expect(await screen.findByText('暂无行程。')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: /记录缺少照片/ })[1]);
    expect(await screen.findByRole('dialog', { name: '质量问题详情' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '打开行程' }));
    expect(onNavigateToPath).toHaveBeenCalledWith('/trips/trip-1');
    expect(recordAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'quality_issue_navigated',
        targetKind: 'marker',
        targetId: 'marker-1',
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: '关闭' }));
    await userEvent.click(screen.getAllByRole('button', { name: /行程缺少封面/ })[1]);
    await userEvent.click(await screen.findByRole('button', { name: '预览修复' }));
    expect(await screen.findByText('coverImageUrl')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '确认修复' }));
    expect(previewAdminQualityAutoFix).toHaveBeenCalledWith('trip_missing_cover:trip-1');
    expect(applyAdminQualityAutoFix).toHaveBeenCalledWith('trip_missing_cover:trip-1');
  });

  it('calls navigation and logout actions', async () => {
    const onLogout = vi.fn();
    const onNavigateHome = vi.fn();
    vi.mocked(fetchAdminOverview).mockResolvedValue({
      accounts: [],
      meta: {
        fetchedAt: '2026-04-22T00:00:00.000Z',
        accountCount: 0,
      },
    });

    render(
      <AdminPage
        account={{ id: 'acct-1', name: 'Voyage Atlas', username: 'demo', role: 'admin' }}
        onLogout={onLogout}
        onNavigateHome={onNavigateHome}
        onNavigateToPath={vi.fn()}
      />,
    );

    await screen.findByText('系统用户总览');
    await userEvent.click(screen.getByRole('button', { name: '返回旅行主页' }));
    await userEvent.click(screen.getByRole('button', { name: '退出登录' }));

    expect(onNavigateHome).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
