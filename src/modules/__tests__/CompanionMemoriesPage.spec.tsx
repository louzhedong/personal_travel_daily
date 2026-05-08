import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCompanionMemory, refreshCompanionMemory } from '../../lib/api/companionMemoriesApi';
import CompanionMemoriesPage from '../companions/CompanionMemoriesPage';

vi.mock('../../lib/api/companionMemoriesApi', () => ({
  fetchCompanionMemory: vi.fn(),
  refreshCompanionMemory: vi.fn(),
}));

vi.mock('../../components/ui/TravelIcon', () => ({
  default: () => <span>icon</span>,
}));

const account = {
  id: 'acct-1',
  name: 'Voyage Atlas',
  username: 'demo',
  role: 'admin' as const,
};

const memoryResponse = {
  companion: { id: 'user-alice', name: '小悠', color: '#2563eb' },
  summary: {
    markerCount: 2,
    travelDays: 3,
    tripCount: 1,
    cityCount: 1,
    regionCount: 1,
    photoCount: 1,
    guideCount: 1,
    firstSharedAt: '2026-04-01',
    latestSharedAt: '2026-04-02',
    headline: '你们一起留下了 2 段旅行记忆，最常出现的地方是京都。',
  },
  yearlySeries: [{ year: '2026', markerCount: 2, travelDays: 3, photoCount: 1 }],
  topRegions: [{ scope: 'international' as const, scopeId: 'jp', scopeName: '日本', markerCount: 2 }],
  topCities: [{ scope: 'international' as const, scopeId: 'jp', scopeName: '日本', city: '京都', markerCount: 2 }],
  themes: [{ type: 'tag' as const, value: 'citywalk', label: '城市漫游', markerCount: 2 }],
  trips: [
    {
      tripId: 'trip-1',
      tripName: '京都春日',
      startsAt: '2026-04-01',
      endsAt: '2026-04-04',
      note: '一起看樱花',
      markerCount: 2,
      photoCount: 1,
    },
  ],
  photos: [
    {
      imageId: 'image-1',
      markerId: 'marker-1',
      imageUrl: 'https://example.com/photo.jpg',
      markerTitle: '日本 · 京都',
      scopeName: '日本',
      city: '京都',
      visitedStartAt: '2026-04-01',
      isFeatured: true,
      caption: '鸭川黄昏',
    },
  ],
  guides: [
    {
      id: 'guide-1',
      keyword: '京都',
      title: '京都赏樱路线',
      summary: '适合慢走的路线。',
      sourceName: '示例来源',
      sourceUrl: 'https://example.com/guide',
      savedAt: '2026-03-28T00:00:00.000Z',
    },
  ],
  milestones: [
    {
      id: 'first',
      title: '第一段共同记忆',
      description: '从京都开始。',
      happenedAt: '2026-04-01',
    },
  ],
  snapshot: {
    generatedAt: '2026-05-08T00:00:00.000Z',
    expiresAt: '2026-05-09T00:00:00.000Z',
    stale: false,
    sourceMarkerCount: 2,
    sourcePhotoCount: 1,
    sourceGuideCount: 1,
  },
};

describe('CompanionMemoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchCompanionMemory).mockResolvedValue(memoryResponse);
    vi.mocked(refreshCompanionMemory).mockResolvedValue({
      ...memoryResponse,
      summary: {
        ...memoryResponse.summary,
        headline: '共同回忆已重新整理。',
      },
    });
  });

  it('renders companion memory sections', async () => {
    render(
      <CompanionMemoriesPage
        account={account}
        companionId="user-alice"
        onNavigateBack={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(await screen.findByRole('heading', { name: '和 小悠 的共同回忆' })).toBeInTheDocument();
    expect(screen.getByText('这些年一起留下的记忆')).toBeInTheDocument();
    expect(screen.getAllByText('段共同记录').length).toBeGreaterThan(0);
    expect(screen.getByText('最代表你们的 3 次同行')).toBeInTheDocument();
    expect(screen.getByText('京都春日')).toBeInTheDocument();
    expect(screen.getByText('鸭川黄昏')).toBeInTheDocument();
    expect(fetchCompanionMemory).toHaveBeenCalledWith('user-alice');
  });

  it('refreshes memories and shows global toast feedback', async () => {
    const user = userEvent.setup();
    render(
      <CompanionMemoriesPage
        account={account}
        companionId="user-alice"
        onNavigateBack={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole('button', { name: '刷新回忆' }));

    expect(refreshCompanionMemory).toHaveBeenCalledWith('user-alice');
    await waitFor(() => {
      expect(screen.getAllByText('共同回忆已重新整理。').length).toBeGreaterThan(0);
    });
  });

  it('renders error state when loading fails', async () => {
    vi.mocked(fetchCompanionMemory).mockRejectedValueOnce(new Error('共同回忆加载失败'));

    render(
      <CompanionMemoriesPage
        account={account}
        companionId="missing"
        onNavigateBack={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('共同回忆暂时没有打开')).toBeInTheDocument();
    });
    expect(screen.getByText('共同回忆加载失败')).toBeInTheDocument();
  });
});
