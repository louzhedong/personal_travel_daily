import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAnnualReview } from '../../lib/api/statsApi';
import AnnualReviewPage from '../yearbook/AnnualReviewPage';

vi.mock('../../lib/api/statsApi', () => ({
  fetchAnnualReview: vi.fn(),
}));

vi.mock('../../geo/loader', () => ({
  loadGeoForScope: vi.fn().mockResolvedValue([]),
  normalizeChinaName: (value: string) => value,
}));

describe('AnnualReviewPage', () => {
  const originalPrint = window.print;
  const originalTitle = document.title;
  const account = {
    id: 'acct-1',
    name: 'Voyage Atlas',
    username: 'demo',
    role: 'member' as const,
  };

  const annualReviewResponse = {
    year: '2026',
    availableYears: ['2026'],
    summary: {
      totalTrips: 1,
      totalMarkers: 2,
      totalTravelDays: 4,
      totalCities: 2,
      totalRegions: 1,
      totalCountries: 0,
      activeCompanions: 1,
      longestTripDays: 4,
      photoCount: 1,
      guideCount: 1,
    },
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
    tripHighlights: {
      longestTrip: { tripId: 'trip-1', tripName: '江南春游', days: 4 },
      busiestMonth: { month: '05', markerCount: 2, travelDays: 4 },
      topCompanion: {
        companionId: 'user-alice',
        companionName: '小悠',
        color: '#2563eb',
        markerCount: 2,
        travelDays: 4,
      },
      topRegion: { scopeId: 'zj', scopeName: '浙江', scope: 'domestic' as const, markerCount: 2 },
      topCity: { city: '杭州', scopeName: '浙江', scope: 'domestic' as const, markerCount: 2 },
    },
    heatmap: [{ scopeId: 'zj', scopeName: '浙江', scope: 'domestic' as const, intensity: 5, markerCount: 2 }],
    representativePhoto: {
      markerId: 'marker-1',
      markerTitle: '浙江 路 杭州',
      imageUrl: 'https://example.com/photo.jpg',
      visitedStartAt: '2026-05-01',
      scopeName: '浙江',
      city: '杭州',
    },
    photos: [
      {
        markerId: 'marker-1',
        markerTitle: '浙江 路 杭州',
        imageUrl: 'https://example.com/photo.jpg',
        visitedStartAt: '2026-05-01',
        scopeName: '浙江',
        city: '杭州',
      },
    ],
    guides: [
      {
        id: 'guide-1',
        markerId: 'marker-1',
        keyword: '杭州',
        savedAt: '2026-05-01T00:00:00.000Z',
        title: '杭州周末攻略',
        summary: '适合春天出发。',
        sourceName: '示例来源',
        sourceUrl: 'https://example.com/guide',
      },
    ],
    trips: [
      {
        tripId: 'trip-1',
        tripName: '江南春游',
        markerCount: 2,
        travelDays: 4,
        startsAt: '2026-05-01',
        endsAt: '2026-05-04',
        note: '杭州和苏州',
      },
    ],
    achievements: [
      {
        id: 'annual-2026-travel-days',
        title: '年度出发王',
        description: '这一年旅行天数达到 20 天。',
        category: 'rhythm' as const,
        status: 'locked' as const,
        progressValue: 4,
        progressTarget: 20,
        unit: '天',
      },
    ],
    firstMarker: {
      id: 'marker-1',
      tripId: 'trip-1',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      scope: 'domestic' as const,
      scopeId: 'zj',
      scopeName: '浙江',
      city: '杭州',
      note: '西湖晚风',
      visitedStartAt: '2026-05-01',
      visitedEndAt: '2026-05-02',
    },
    lastMarker: {
      id: 'marker-2',
      tripId: 'trip-1',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      scope: 'domestic' as const,
      scopeId: 'zj',
      scopeName: '浙江',
      city: '杭州',
      note: '灵隐寺',
      visitedStartAt: '2026-05-04',
      visitedEndAt: '2026-05-04',
    },
    generatedAt: '2026-05-06T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.print = vi.fn();
    document.title = originalTitle;
    vi.mocked(fetchAnnualReview).mockResolvedValue(annualReviewResponse);
  });

  afterEach(() => {
    window.print = originalPrint;
    document.title = originalTitle;
  });

  it('renders the annual review and opens trip detail', async () => {
    const onOpenTripDetail = vi.fn();
    render(
      <AnnualReviewPage
        account={account}
        year="2026"
        onNavigateBack={vi.fn()}
        onOpenTripDetail={onOpenTripDetail}
        onLogout={vi.fn()}
      />,
    );

    expect(await screen.findByRole('heading', { name: '2026 年度旅行回顾' })).toBeInTheDocument();
    expect(screen.getByText('年度亮点')).toBeInTheDocument();
    expect(screen.getByText('杭州周末攻略')).toBeInTheDocument();
    expect(document.title).toBe('2026 年度旅行回顾');

    await userEvent.click(screen.getByRole('button', { name: /江南春游/ }));

    expect(fetchAnnualReview).toHaveBeenCalledWith('2026');
    expect(onOpenTripDetail).toHaveBeenCalledWith('trip-1');
  });

  it('prints the annual review', async () => {
    const user = userEvent.setup();
    render(
      <AnnualReviewPage
        account={account}
        year="2026"
        onNavigateBack={vi.fn()}
        onOpenTripDetail={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(await screen.findByRole('heading', { name: '2026 年度旅行回顾' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '导出 PDF / 打印' }));

    expect(window.print).toHaveBeenCalledOnce();
  });

  it('renders an empty annual review', async () => {
    vi.mocked(fetchAnnualReview).mockResolvedValueOnce({
      ...annualReviewResponse,
      summary: {
        ...annualReviewResponse.summary,
        totalTrips: 0,
        totalMarkers: 0,
        totalTravelDays: 0,
        totalCities: 0,
        totalRegions: 0,
        totalCountries: 0,
        activeCompanions: 0,
        photoCount: 0,
        guideCount: 0,
      },
      photos: [],
      guides: [],
      trips: [],
      firstMarker: undefined,
      lastMarker: undefined,
      representativePhoto: undefined,
    });

    render(
      <AnnualReviewPage
        account={account}
        year="2024"
        onNavigateBack={vi.fn()}
        onOpenTripDetail={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(await screen.findByText('2024 年还没有旅行记录')).toBeInTheDocument();
  });
});
