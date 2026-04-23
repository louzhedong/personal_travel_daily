import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAdminOverview } from '../../lib/api/adminApi';
import AdminPage from '../admin/AdminPage';

vi.mock('../../lib/api/adminApi', () => ({
  fetchAdminOverview: vi.fn(),
}));

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
          },
          trips: [],
          companions: [
            {
              id: 'companion-2',
              name: '阿南',
              color: '#f97316',
              createdAt: '2026-04-23T00:00:00.000Z',
              markers: [],
              savedGuides: [],
              guideSearchHistory: [],
            },
          ],
        },
      ],
      meta: {
        fetchedAt: '2026-04-22T00:00:00.000Z',
        accountCount: 2,
      },
    });

    render(
      <AdminPage
        account={{ id: 'acct-1', name: 'Voyage Atlas', username: 'demo', role: 'admin' }}
        onLogout={vi.fn()}
        onNavigateHome={vi.fn()}
      />,
    );

    expect(await screen.findByText('系统用户总览')).toBeInTheDocument();
    expect(await screen.findByText('用户列表')).toBeInTheDocument();
    expect(await screen.findAllByText('Voyage Atlas')).toHaveLength(2);
    expect(await screen.findByRole('tab', { name: '行程' })).toBeInTheDocument();
    expect(await screen.findAllByText('2026 江南春游')).toHaveLength(2);
    expect(screen.getAllByText('小悠').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('tab', { name: '旅行记录' }));
    expect(await screen.findAllByText('2026 江南春游')).toHaveLength(2);
    expect(await screen.findByText('西湖散步')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: '收藏攻略' }));
    expect(await screen.findByText('杭州周末攻略')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: '搜索历史' }));
    expect(await screen.findByText('杭州')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /另一位用户/ }));
    expect(await screen.findByText('@other-user')).toBeInTheDocument();
    expect(await screen.findByText('暂无行程。')).toBeInTheDocument();
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
      />,
    );

    await screen.findByText('系统用户总览');
    await userEvent.click(screen.getByRole('button', { name: '返回旅行主页' }));
    await userEvent.click(screen.getByRole('button', { name: '退出登录' }));

    expect(onNavigateHome).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
