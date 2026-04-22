import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import type { TravelStore } from '../../types';

const { remoteTravelStoreRepositoryMock } = vi.hoisted(() => {
  const persistedStore: TravelStore = {
    users: [
      { id: 'u1', name: '当前用户', color: '#2563eb' },
      { id: 'u2', name: '另一位旅伴', color: '#f97316' },
    ],
    markers: [
      {
        id: 'marker-other',
        userId: 'u2',
        scope: 'domestic',
        scopeId: '青海',
        scopeName: '青海',
        city: '西宁',
        note: '和朋友一起看青海湖。',
        visitedStartAt: '2026-05-01',
        visitedEndAt: '2026-05-03',
        createdAt: '2026-05-04T00:00:00.000Z',
      },
    ],
    activeUserId: 'u1',
    savedGuides: [
      {
        id: 'saved-other-link',
        savedByUserId: 'u2',
        markerId: 'marker-other',
        keyword: '青海',
        savedAt: '2026-05-04T00:00:00.000Z',
        result: {
          id: 'guide-other',
          title: '青海湖环线攻略',
          summary: '经典环线路线和高原适应建议。',
          sourceName: '示例来源',
          sourceUrl: 'https://example.com/guide/1',
        },
      },
    ],
    guideSearchHistory: [],
  };

  return {
    remoteTravelStoreRepositoryMock: {
      loadStore: vi.fn(async () => persistedStore),
      createCompanion: vi.fn(),
      updateCompanion: vi.fn(),
      createMarker: vi.fn(),
      updateMarker: vi.fn(),
      deleteMarker: vi.fn(),
      listSavedGuides: vi.fn(),
      createSavedGuide: vi.fn(),
      deleteSavedGuide: vi.fn(),
      listGuideSearchHistories: vi.fn(),
      createGuideSearchHistory: vi.fn(async () => ({
        item: {
          id: 'history-new',
          keyword: 'Kyoto',
          scope: 'international',
          createdAt: '2026-05-05T00:00:00.000Z',
        },
        deduplicated: false,
      })),
    },
  };
});

vi.mock('../../components/TravelMap', () => ({
  default: () => <div data-testid="travel-map">travel-map</div>,
}));

vi.mock('../../components/StatsPanel', () => ({
  default: () => <div data-testid="stats-panel">stats-panel</div>,
}));

vi.mock('../../components/UserManager', () => ({
  default: () => <div data-testid="user-manager">user-manager</div>,
}));

vi.mock('../../components/DataSync', () => ({
  default: () => <div data-testid="data-sync">data-sync</div>,
}));

vi.mock('../../components/MarkerForm', () => ({
  default: () => <div data-testid="marker-form">marker-form</div>,
}));

vi.mock('../../lib/repositories/remoteTravelStoreRepository', () => ({
  remoteTravelStoreRepository: remoteTravelStoreRepositoryMock,
}));

describe('App guide permissions', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_GUIDE_SEARCH_PROVIDER', 'mock');
    Object.values(remoteTravelStoreRepositoryMock).forEach((mock) => {
      if (typeof mock?.mockClear === 'function') {
        mock.mockClear();
      }
    });
  });

  it('allows searching from another user marker but prevents link management', async () => {
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: '查看详情' }));

    expect(await screen.findByText('青海湖环线攻略')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '解除关联' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '查找攻略' }));
    const searchInput = await screen.findByPlaceholderText('输入目的地、季节或玩法，例如：舟山 海岛 攻略');
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'Kyoto');
    await userEvent.click(screen.getByRole('button', { name: '搜索' }));

    expect(await screen.findByText('Kyoto Spring Cherry Blossom Guide')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '关联到当前记录' })).not.toBeInTheDocument();
    expect(remoteTravelStoreRepositoryMock.loadStore).toHaveBeenCalledTimes(1);
  });

  it('shows a back-to-top button after the main page scrolls away from the top', async () => {
    render(<App />);

    const button = screen.getByLabelText('回到主页面顶部');
    expect(button.parentElement?.className).not.toContain('is-visible');

    Object.defineProperty(window, 'scrollY', {
      value: 160,
      writable: true,
      configurable: true,
    });
    fireEvent.scroll(window);

    await waitFor(() => {
      expect(button.parentElement?.className).toContain('is-visible');
    });
  });

  it('writes guide search history through the remote repository', async () => {
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: '搜索旅游攻略' }));
    const searchInput = await screen.findByPlaceholderText('输入目的地、季节或玩法，例如：舟山 海岛 攻略');
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'Kyoto');
    await userEvent.click(screen.getByRole('button', { name: '搜索' }));

    expect(await screen.findByText('Kyoto Spring Cherry Blossom Guide')).toBeInTheDocument();
    expect(remoteTravelStoreRepositoryMock.createGuideSearchHistory).toHaveBeenCalledWith({
      companionId: 'u1',
      keyword: 'Kyoto',
      scope: 'all',
    });
  });
});
