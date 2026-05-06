import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAnnualReview, fetchStatsOverview } from '../../lib/api/statsApi';
import AchievementsPage from '../achievements/AchievementsPage';

vi.mock('../../lib/api/statsApi', () => ({
  fetchStatsOverview: vi.fn(),
  fetchAnnualReview: vi.fn(),
}));

describe('AchievementsPage', () => {
  const account = {
    id: 'acct-1',
    name: 'Voyage Atlas',
    username: 'demo',
    role: 'member' as const,
  };

  const overviewResponse = {
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
    companions: [],
    trips: [],
    summary: {
      totalTrips: 0,
      totalMarkers: 0,
      totalTravelDays: 0,
      totalCities: 0,
      totalRegions: 0,
      totalCountries: 0,
      activeCompanions: 0,
    },
    yearlySeries: [],
    monthlyDistribution: [],
    topRegions: [],
    topCities: [],
    companionRanking: [],
    tripRanking: [],
    tripDetails: [],
    topTags: [],
    topMoods: [],
    topWeather: [],
    topTransports: [],
    topBudgetLevels: [],
    tripHighlights: {},
    achievements: [
      {
        id: 'city-explorer',
        title: '城市探索者',
        description: '覆盖 5 座不同城市。',
        category: 'footprint' as const,
        group: 'footprint' as const,
        periodType: 'global' as const,
        rarity: 'common' as const,
        status: 'close' as const,
        progressValue: 4,
        progressTarget: 5,
        unit: '座城市',
        nextHint: '还差 1 座城市，再多解锁几座新城市。',
        evidence: [{ label: '杭州', value: '浙江' }],
      },
      {
        id: 'streak-consecutive-years-2',
        title: '连续两年都在路上',
        description: '连续 2 年都有旅行记录。',
        category: 'rhythm' as const,
        group: 'streak' as const,
        periodType: 'streak' as const,
        rarity: 'epic' as const,
        status: 'unlocked' as const,
        progressValue: 2,
        progressTarget: 2,
        unit: '年连续记录',
        streakYears: ['2025', '2026'],
        evidence: [{ label: '2025 年', value: '有旅行记录' }],
        firstUnlockedAt: '2026-05-06T00:00:00.000Z',
      },
    ],
    heatmap: [],
    generatedAt: '2026-05-06T00:00:00.000Z',
  };

  const annualReviewResponse = (year: string) => ({
    year,
    availableYears: ['2026', '2025'],
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
      guideCount: 0,
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
        id: `annual-${year}-travel-days`,
        title: '年度出发王',
        description: '这一年旅行天数达到 20 天。',
        category: 'rhythm' as const,
        group: 'annual' as const,
        periodType: 'annual' as const,
        rarity: 'rare' as const,
        status: 'locked' as const,
        progressValue: 4,
        progressTarget: 20,
        unit: '天',
        nextHint: '还差 16 天，继续累积更多出发日。',
      },
    ],
    generatedAt: '2026-05-06T00:00:00.000Z',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchStatsOverview).mockResolvedValue(overviewResponse);
    vi.mocked(fetchAnnualReview).mockImplementation(async (year: string) => annualReviewResponse(year));
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => 'blob:achievement'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('renders the achievement hub and loads annual reviews for all available years', async () => {
    render(<AchievementsPage account={account} onNavigateBack={vi.fn()} onLogout={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: '旅行成就总览' })).toBeInTheDocument();
    expect(fetchStatsOverview).toHaveBeenCalledWith({ scope: 'all' });
    await waitFor(() => {
      expect(fetchAnnualReview).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText('连续两年都在路上')).toBeInTheDocument();
    expect(screen.getAllByText('年度限定').length).toBeGreaterThan(0);
  });

  it('filters by group and shows an empty state when no achievements match', async () => {
    render(<AchievementsPage account={account} onNavigateBack={vi.fn()} onLogout={vi.fn()} />);
    await screen.findByRole('heading', { name: '旅行成就总览' });

    await userEvent.click(screen.getByRole('button', { name: '按分组筛选成就' }));
    await userEvent.click(await screen.findByRole('button', { name: '年度限定' }));

    expect(screen.getAllByText('年度限定').length).toBeGreaterThan(0);
    expect(screen.queryByText('连续记录')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '按稀有度筛选成就' }));
    await userEvent.click(await screen.findByRole('button', { name: '传说' }));

    expect(await screen.findByText('当前筛选条件下没有成就')).toBeInTheDocument();
  });

  it('exports an achievement share card and shows a toast', async () => {
    render(<AchievementsPage account={account} onNavigateBack={vi.fn()} onLogout={vi.fn()} />);
    await screen.findByRole('heading', { name: '旅行成就总览' });

    await userEvent.click(screen.getByRole('button', { name: /城市探索者/ }));
    await userEvent.click(await screen.findByRole('button', { name: '保存分享卡' }));

    expect(await screen.findByText('分享卡已保存到本地 / Share card saved locally')).toBeInTheDocument();
  });

  it('renders an error state when the page request fails', async () => {
    vi.mocked(fetchStatsOverview).mockRejectedValueOnce(new Error('boom'));

    render(<AchievementsPage account={account} onNavigateBack={vi.fn()} onLogout={vi.fn()} />);

    expect(await screen.findByText('成就页加载失败')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
});
