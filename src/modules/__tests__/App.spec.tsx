import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import type { TravelStore } from '../../types';

const { authApiMock, remoteTravelStoreRepositoryMock } = vi.hoisted(() => {
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
    authApiMock: {
      fetchSession: vi.fn(async () => ({
        account: {
          id: 'acct-1',
          name: 'Voyage Atlas',
          username: 'demo',
        },
      })),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(async () => ({ success: true })),
    },
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

vi.mock('../../lib/api/authApi', () => authApiMock);

describe('App auth and guide permissions', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_GUIDE_SEARCH_PROVIDER', 'mock');
    window.history.replaceState({}, '', '/');

    Object.values(authApiMock).forEach((mock) => {
      if (typeof mock?.mockClear === 'function') {
        mock.mockClear();
      }
    });
    Object.values(remoteTravelStoreRepositoryMock).forEach((mock) => {
      if (typeof mock?.mockClear === 'function') {
        mock.mockClear();
      }
    });

    authApiMock.fetchSession.mockResolvedValue({
      account: {
        id: 'acct-1',
        name: 'Voyage Atlas',
        username: 'demo',
      },
    });
    authApiMock.login.mockResolvedValue({
      account: {
        id: 'acct-1',
        name: 'Voyage Atlas',
        username: 'demo',
      },
    });
    authApiMock.register.mockResolvedValue({
      account: {
        id: 'acct-2',
        name: '新用户',
        username: 'new-user',
      },
    });
  });

  it('redirects unauthenticated users to the auth page and logs them in', async () => {
    authApiMock.fetchSession.mockResolvedValueOnce({ account: null });

    render(<App />);

    expect(await screen.findByRole('heading', { name: '登录 Voyage Atlas' })).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('输入用户名'), 'demo');
    await userEvent.type(screen.getByPlaceholderText('至少 8 位密码'), 'demo123456');
    await userEvent.click(screen.getByRole('button', { name: '登录并进入地图' }));

    await screen.findByText('搜索旅游攻略');
    expect(authApiMock.login).toHaveBeenCalledWith({
      username: 'demo',
      password: 'demo123456',
    });
    expect(window.location.pathname).toBe('/');
  });

  it('supports register mode and enters the app after success', async () => {
    authApiMock.fetchSession.mockResolvedValueOnce({ account: null });

    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: '注册' }));
    await userEvent.type(screen.getByPlaceholderText('例如：小悠的旅行档案'), '新用户');
    await userEvent.type(screen.getByPlaceholderText('输入用户名'), 'new-user');
    await userEvent.type(screen.getByPlaceholderText('至少 8 位密码'), 'demo123456');
    await userEvent.type(screen.getByPlaceholderText('再次输入密码'), 'demo123456');
    await userEvent.click(screen.getByRole('button', { name: '注册并进入地图' }));

    await screen.findByText('搜索旅游攻略');
    expect(authApiMock.register).toHaveBeenCalledWith({
      nickname: '新用户',
      username: 'new-user',
      password: 'demo123456',
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

    const button = await screen.findByLabelText('回到主页面顶部');
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

  it('logs out from the hero action', async () => {
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: '退出登录' }));

    expect(authApiMock.logout).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('heading', { name: '登录 Voyage Atlas' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/auth');
  });
});
