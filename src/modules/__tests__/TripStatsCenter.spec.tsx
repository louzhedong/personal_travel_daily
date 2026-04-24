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
});
