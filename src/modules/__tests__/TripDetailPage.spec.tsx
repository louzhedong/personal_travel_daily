import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchTripDetail } from '../../lib/api/tripsApi';
import TripDetailPage from '../trips/TripDetailPage';

vi.mock('../../lib/api/tripsApi', () => ({
  fetchTripDetail: vi.fn(),
}));

describe('TripDetailPage', () => {
  const account = {
    id: 'acct-1',
    name: 'Voyage Atlas',
    username: 'demo',
    role: 'member' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trip detail blocks after loading', async () => {
    vi.mocked(fetchTripDetail).mockResolvedValue({
      trip: {
        id: 'trip-1',
        name: '江南春游',
        note: '杭州与苏州周末行',
        startsAt: '2026-05-01',
        endsAt: '2026-05-03',
        createdAt: '2026-04-20T00:00:00.000Z',
      },
      summary: {
        markerCount: 2,
        travelDays: 3,
        cityCount: 2,
        regionCount: 2,
        companionCount: 1,
        guideCount: 1,
        photoCount: 1,
      },
      companions: [{ id: 'user-alice', name: '小悠', color: '#2563eb', markerCount: 2 }],
      markers: [
        {
          id: 'marker-1',
          companionId: 'user-alice',
          companionName: '小悠',
          companionColor: '#2563eb',
          scope: 'domestic',
          scopeId: 'zj',
          scopeName: '浙江',
          city: '杭州',
          note: '西湖晚风',
          imageUrls: ['https://example.com/hangzhou.jpg'],
          visitedStartAt: '2026-05-01',
          visitedEndAt: '2026-05-02',
        },
      ],
      photos: [
        {
          markerId: 'marker-1',
          markerTitle: '浙江 · 杭州',
          imageUrl: 'https://example.com/hangzhou.jpg',
          visitedStartAt: '2026-05-01',
          scopeName: '浙江',
          city: '杭州',
        },
      ],
      guides: [
        {
          id: 'guide-1',
          markerId: 'marker-1',
          keyword: '杭州周末',
          savedAt: '2026-05-05T00:00:00.000Z',
          result: {
            id: 'guide-doc-1',
            title: '杭州周末攻略',
            summary: '逛西湖、灵隐寺',
            sourceName: 'Qyer',
            sourceUrl: 'https://example.com/guide',
          },
        },
      ],
      checklistSummary: {
        total: 1,
        preDepartureCount: 1,
        inTransitCount: 0,
        doneCount: 0,
      },
      checklistGroups: [
        {
          stage: 'pre_departure',
          title: '出发前准备',
          description: '把预约、路线、装备和行前确认放在这里。',
          itemCount: 1,
          items: [
            {
              id: 'item-1',
              companionId: 'user-alice',
              companionName: '小悠',
              companionColor: '#2563eb',
              title: '提前确认西湖周边预约',
              stage: 'pre_departure',
              sortOrder: 0,
              origin: 'generated',
              createdAt: '2026-05-05T00:00:00.000Z',
              updatedAt: '2026-05-05T00:00:00.000Z',
            },
          ],
        },
        {
          stage: 'in_transit',
          title: '旅途中留意',
          description: '把路上节奏、交通衔接和现场提醒收在这里。',
          itemCount: 0,
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
        generatedAt: '2026-05-06T12:30:00.000Z',
      },
    });

    render(
      <TripDetailPage account={account} tripId="trip-1" onNavigateBack={vi.fn()} onLogout={vi.fn()} />,
    );

    expect(await screen.findByRole('heading', { name: '江南春游' })).toBeInTheDocument();
    expect(screen.getByText('旅行记录')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '行程记录' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '行程照片' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '关联攻略' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: '行前清单' })[0]).toBeInTheDocument();
    expect(screen.getByText('杭州周末攻略')).toBeInTheDocument();
  });

  it('renders a not found style state when the request fails', async () => {
    vi.mocked(fetchTripDetail).mockRejectedValue(new Error('trip not found'));

    render(
      <TripDetailPage account={account} tripId="missing-trip" onNavigateBack={vi.fn()} onLogout={vi.fn()} />,
    );

    expect(await screen.findByText('行程不存在或无权访问')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '返回统计中心' })).toHaveLength(2);
  });
});
