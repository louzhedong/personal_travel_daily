import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchStatsOverview } from '../../lib/api/statsApi';
import TripStatsCenter from '../stats/TripStatsCenter';

vi.mock('../../lib/api/statsApi', () => ({
  fetchStatsOverview: vi.fn(),
}));

vi.mock('../../geo/loader', () => ({
  loadGeoForScope: vi.fn().mockResolvedValue([]),
  normalizeChinaName: (value: string) => value,
}));

describe('TripStatsCenter', () => {
  const statsResponse = {
    filters: {
      year: 'all',
      scope: 'all' as const,
      tag: 'all' as const,
      mood: 'all' as const,
      weather: 'all' as const,
      transport: 'all' as const,
      budgetLevel: 'all' as const,
    },
    availableYears: ['2026', '2025'],
    companions: [{ id: 'user-alice', name: '小悠', color: '#2563eb' }],
    trips: [
      {
        id: 'trip-1',
        name: '江南春游',
        startsAt: '2026-05-01',
        endsAt: '2026-05-03',
      },
    ],
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
    monthlyDistribution: Array.from({ length: 12 }, (_, index) => ({
      month: String(index + 1).padStart(2, '0'),
      markerCount: index === 4 ? 2 : 0,
      travelDays: index === 4 ? 4 : 0,
    })),
    topRegions: [{ scopeId: 'zj', scopeName: '浙江', scope: 'domestic' as const, markerCount: 2 }],
    topCities: [{ city: '杭州', scopeName: '浙江', scope: 'domestic' as const, markerCount: 2 }],
    companionRanking: [
      {
        companionId: 'user-alice',
        companionName: '小悠',
        color: '#2563eb',
        markerCount: 2,
        travelDays: 4,
      },
    ],
    tripRanking: [
      {
        tripId: 'trip-1',
        tripName: '江南春游',
        markerCount: 2,
        travelDays: 4,
        startsAt: '2026-05-01',
        endsAt: '2026-05-03',
      },
    ],
    tripDetails: [
      {
        tripId: 'trip-1',
        tripName: '江南春游',
        markerCount: 2,
        travelDays: 4,
        startsAt: '2026-05-01',
        endsAt: '2026-05-03',
        note: '杭州与苏州周末行',
      },
    ],
    topTags: [{ value: 'food', label: '美食', markerCount: 2 }],
    topMoods: [{ value: 'relaxed', label: '放松', markerCount: 1 }],
    topWeather: [{ value: 'sunny', label: '晴', markerCount: 2 }],
    topTransports: [{ value: 'walk', label: '步行', markerCount: 2 }],
    topBudgetLevels: [{ value: 'medium', label: '中预算', markerCount: 2 }],
    tripHighlights: {
      longestTrip: {
        tripId: 'trip-1',
        tripName: '江南春游',
        days: 4,
      },
      mostMarkersTrip: {
        tripId: 'trip-1',
        tripName: '江南春游',
        markerCount: 2,
      },
    },
    achievements: [
      {
        id: 'city-explorer',
        title: '城市探索者',
        description: '覆盖 5 座不同城市。',
        category: 'footprint' as const,
        status: 'close' as const,
        progressValue: 3,
        progressTarget: 5,
        unit: '座城市',
      },
      {
        id: 'first-international-trip',
        title: '世界初体验',
        description: '留下至少 1 条国际旅行记录。',
        category: 'footprint' as const,
        status: 'unlocked' as const,
        progressValue: 1,
        progressTarget: 1,
        unit: '条国际记录',
      },
      {
        id: 'country-collector',
        title: '国家收藏家',
        description: '覆盖 3 个国际国家或地区。',
        category: 'footprint' as const,
        status: 'locked' as const,
        progressValue: 0,
        progressTarget: 3,
        unit: '个国家/地区',
      },
      {
        id: 'long-trip',
        title: '长线旅行者',
        description: '最长行程达到 5 天。',
        category: 'rhythm' as const,
        status: 'close' as const,
        progressValue: 4,
        progressTarget: 5,
        unit: '天',
      },
      {
        id: 'shared-memory',
        title: '同行记忆',
        description: '与 2 位以上旅伴留下记录。',
        category: 'companion' as const,
        status: 'locked' as const,
        progressValue: 1,
        progressTarget: 2,
        unit: '位旅伴',
      },
      {
        id: 'guide-planner',
        title: '攻略派',
        description: '关联或收藏攻略达到 5 篇。',
        category: 'content' as const,
        status: 'locked' as const,
        progressValue: 0,
        progressTarget: 5,
        unit: '篇攻略',
      },
      {
        id: 'photo-keeper',
        title: '摄影记录者',
        description: '旅行照片达到 20 张。',
        category: 'content' as const,
        status: 'locked' as const,
        progressValue: 2,
        progressTarget: 20,
        unit: '张照片',
      },
    ],
    heatmap: [{ scopeId: 'zj', scopeName: '浙江', scope: 'domestic' as const, intensity: 5, markerCount: 2 }],
    generatedAt: '2026-05-06T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchStatsOverview).mockResolvedValue(statsResponse);
  });

  it('renders the statistics center and requests default overview', async () => {
    render(<TripStatsCenter />);

    expect(await screen.findByText('把旅行记录整理成一页旅程年鉴')).toBeInTheDocument();
    expect(await screen.findByText('总行程数')).toBeInTheDocument();
    expect(fetchStatsOverview).toHaveBeenCalledWith({
      year: undefined,
      scope: 'all',
      companionId: undefined,
      tripId: undefined,
      tag: undefined,
      mood: undefined,
      weather: undefined,
      transport: undefined,
      budgetLevel: undefined,
    });
  });

  it('requests refreshed data when filters change', async () => {
    render(<TripStatsCenter />);
    await screen.findByText('把旅行记录整理成一页旅程年鉴');

    const yearTrigger = screen.getByRole('button', { name: '按年份筛选统计中心' });
    await userEvent.click(yearTrigger);
    await userEvent.click(await screen.findByRole('button', { name: '2026 年' }));

    await waitFor(() => {
      expect(fetchStatsOverview).toHaveBeenLastCalledWith({
        year: '2026',
        scope: 'all',
        companionId: undefined,
        tripId: undefined,
        tag: undefined,
        mood: undefined,
        weather: undefined,
        transport: undefined,
        budgetLevel: undefined,
      });
    });
  });

  it('exposes trip detail click callback', async () => {
    const onOpenTripDetail = vi.fn();
    render(<TripStatsCenter onOpenTripDetail={onOpenTripDetail} />);

    await screen.findAllByText('江南春游');
    await userEvent.click(screen.getAllByRole('button', { name: /江南春游/ })[0]);

    expect(onOpenTripDetail).toHaveBeenCalledWith('trip-1');
  });

  it('opens the annual review for the active year', async () => {
    const onOpenAnnualReview = vi.fn();
    render(<TripStatsCenter onOpenAnnualReview={onOpenAnnualReview} />);

    await userEvent.click(await screen.findByRole('button', { name: '查看 2026 年度回顾' }));

    expect(onOpenAnnualReview).toHaveBeenCalledWith('2026');
  });

  it('renders achievements and expands the full achievement list', async () => {
    render(<TripStatsCenter />);

    expect(await screen.findByText('旅行成就')).toBeInTheDocument();
    expect(screen.getByText('城市探索者')).toBeInTheDocument();
    expect(screen.queryByText('摄影记录者')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '展开全部成就' }));

    expect(screen.getByText('摄影记录者')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '收起成就' })).toBeInTheDocument();
  });
});
