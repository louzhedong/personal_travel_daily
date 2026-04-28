import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminOverviewResponseDto, AuthResponseDto, SessionResponseDto } from '../../lib/api/types';
import { fetchAdminOverview } from '../../lib/api/adminApi';
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
        id: 'marker-self',
        userId: 'u1',
        scope: 'domestic',
        scopeId: '浙江',
        scopeName: '浙江',
        city: '杭州',
        note: '西湖的晚风很舒服。',
        visitedStartAt: '2026-05-05',
        visitedEndAt: '2026-05-06',
        createdAt: '2026-05-06T00:00:00.000Z',
      },
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
      fetchSession: vi.fn<() => Promise<SessionResponseDto>>(async () => ({
        account: {
          id: 'acct-1',
          name: 'Voyage Atlas',
          username: 'demo',
          role: 'admin',
        },
      })),
      login: vi.fn<(input: { username: string; password: string }) => Promise<AuthResponseDto>>(),
      register: vi.fn<
        (input: { nickname: string; username: string; password: string }) => Promise<AuthResponseDto>
      >(),
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

vi.mock('../stats/TripStatsCenter', () => ({
  default: () => <div data-testid="trip-stats-center">trip-stats-center</div>,
}));

vi.mock('../trips/TripDetailPage', () => ({
  default: ({ tripId }: { tripId: string }) => <div data-testid="trip-detail-page">trip-detail-{tripId}</div>,
}));

vi.mock('../trips/TripStoryPage', () => ({
  default: ({ tripId }: { tripId: string }) => <div data-testid="trip-story-page">trip-story-{tripId}</div>,
}));

vi.mock('../trips/TripChecklistPage', () => ({
  default: ({ tripId }: { tripId: string }) => (
    <div data-testid="trip-checklist-page">trip-checklist-{tripId}</div>
  ),
}));

vi.mock('../yearbook/AnnualReviewPage', () => ({
  default: ({ year }: { year: string }) => <div data-testid="annual-review-page">annual-review-{year}</div>,
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
vi.mock('../../lib/api/adminApi', () => ({
  fetchAdminOverview: vi.fn(),
}));

describe('App auth and guide permissions', () => {
  const unauthenticatedSession: SessionResponseDto = { account: null };
  const authenticatedSession: SessionResponseDto = {
    account: {
      id: 'acct-1',
      name: 'Voyage Atlas',
      username: 'demo',
      role: 'admin',
    },
  };
  const loginResponse: AuthResponseDto = {
    account: {
      id: 'acct-1',
      name: 'Voyage Atlas',
      username: 'demo',
      role: 'admin',
    },
  };
  const registerResponse: AuthResponseDto = {
    account: {
      id: 'acct-2',
      name: '新用户',
      username: 'new-user',
      role: 'member',
    },
  };
  const adminOverviewResponse: AdminOverviewResponseDto = {
    accounts: [
      {
        id: 'acct-1',
        name: 'Voyage Atlas',
        username: 'demo',
        role: 'admin',
        createdAt: '2026-04-22T00:00:00.000Z',
        trips: [],
        markerSearchEvents: [],
        companions: [],
        stats: {
          tripCount: 0,
          companionCount: 0,
          markerCount: 0,
          savedGuideCount: 0,
          guideSearchHistoryCount: 0,
          markerSearchEventCount: 0,
        },
      },
    ],
    meta: {
      fetchedAt: '2026-04-22T00:00:00.000Z',
      accountCount: 1,
    },
  };
  const defaultStore: TravelStore = {
    users: [
      { id: 'u1', name: '当前用户', color: '#2563eb' },
      { id: 'u2', name: '另一位旅伴', color: '#f97316' },
    ],
    markers: [
      {
        id: 'marker-self',
        userId: 'u1',
        scope: 'domestic',
        scopeId: '浙江',
        scopeName: '浙江',
        city: '杭州',
        note: '西湖的晚风很舒服。',
        visitedStartAt: '2026-05-05',
        visitedEndAt: '2026-05-06',
        createdAt: '2026-05-06T00:00:00.000Z',
      },
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

    authApiMock.fetchSession.mockResolvedValue(authenticatedSession);
    authApiMock.login.mockResolvedValue(loginResponse);
    authApiMock.register.mockResolvedValue(registerResponse);
    vi.mocked(fetchAdminOverview).mockResolvedValue(adminOverviewResponse);
    remoteTravelStoreRepositoryMock.loadStore.mockResolvedValue(defaultStore);
    remoteTravelStoreRepositoryMock.deleteMarker.mockImplementation(async (markerId: string) => ({
      ...defaultStore,
      markers: defaultStore.markers.filter((item) => item.id !== markerId),
    }));
  });

  it('redirects unauthenticated users to /login and logs them in', async () => {
    authApiMock.fetchSession.mockResolvedValueOnce(unauthenticatedSession);

    render(<App />);

    expect(await screen.findByRole('heading', { name: '登录 Voyage Atlas' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
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

  it('supports the standalone /register route and enters the app after success', async () => {
    window.history.replaceState({}, '', '/register');
    authApiMock.fetchSession.mockResolvedValueOnce(unauthenticatedSession);

    render(<App />);

    expect(await screen.findByRole('heading', { name: '注册新账号' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/register');
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
    expect(window.location.pathname).toBe('/');
  });

  it('redirects legacy /auth to /login', async () => {
    window.history.replaceState({}, '', '/auth');
    authApiMock.fetchSession.mockResolvedValueOnce(unauthenticatedSession);

    render(<App />);

    expect(await screen.findByRole('heading', { name: '登录 Voyage Atlas' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('allows admins to access /admin and renders the admin page', async () => {
    window.history.replaceState({}, '', '/admin');

    render(<App />);

    expect(await screen.findByText('系统用户总览')).toBeInTheDocument();
    expect(fetchAdminOverview).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe('/admin');
  });

  it('allows authenticated users to access /trips/:id and renders the trip detail page', async () => {
    window.history.replaceState({}, '', '/trips/trip-1');

    render(<App />);

    expect(await screen.findByTestId('trip-detail-page')).toHaveTextContent('trip-detail-trip-1');
    expect(window.location.pathname).toBe('/trips/trip-1');
  });

  it('allows authenticated users to access /trips/:id/checklist and renders the checklist page', async () => {
    window.history.replaceState({}, '', '/trips/trip-1/checklist');

    render(<App />);

    expect(await screen.findByTestId('trip-checklist-page')).toHaveTextContent('trip-checklist-trip-1');
    expect(window.location.pathname).toBe('/trips/trip-1/checklist');
  });

  it('allows authenticated users to access /trips/:id/story and renders the story page', async () => {
    window.history.replaceState({}, '', '/trips/trip-1/story');

    render(<App />);

    expect(await screen.findByTestId('trip-story-page')).toHaveTextContent('trip-story-trip-1');
    expect(window.location.pathname).toBe('/trips/trip-1/story');
  });

  it('allows authenticated users to access /stats and renders the standalone stats page', async () => {
    window.history.replaceState({}, '', '/stats');

    render(<App />);

    expect(await screen.findByRole('heading', { name: '行程统计中心' })).toBeInTheDocument();
    expect(screen.getByTestId('trip-stats-center')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/stats');
  });

  it('allows authenticated users to access /yearbook/:year and renders the annual review page', async () => {
    window.history.replaceState({}, '', '/yearbook/2026');

    render(<App />);

    expect(await screen.findByTestId('annual-review-page')).toHaveTextContent('annual-review-2026');
    expect(window.location.pathname).toBe('/yearbook/2026');
  });

  it('redirects members away from /admin back to the main app shell', async () => {
    window.history.replaceState({}, '', '/admin');
    authApiMock.fetchSession.mockResolvedValueOnce({
      account: {
        id: 'acct-member',
        name: 'Traveler',
        username: 'member',
        role: 'member',
      },
    });

    const { rerender } = render(<App />);

    expect(await screen.findByText('搜索旅游攻略')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });

  it('redirects non-admin users from /admin back to the main app', async () => {
    window.history.replaceState({}, '', '/admin');
    authApiMock.fetchSession.mockResolvedValueOnce({
      account: {
        id: 'acct-3',
        name: '普通用户',
        username: 'member',
        role: 'member',
      },
    });

    render(<App />);

    expect(await screen.findByText('当前账号没有后台权限，已为你返回旅行主页。')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });

  it('redirects unauthenticated users from /trips/:id to /login', async () => {
    window.history.replaceState({}, '', '/trips/trip-1');
    authApiMock.fetchSession.mockResolvedValueOnce(unauthenticatedSession);

    render(<App />);

    expect(await screen.findByRole('heading', { name: '登录 Voyage Atlas' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('allows searching from another user marker but prevents link management', async () => {
    render(<App />);

    await userEvent.click((await screen.findAllByRole('button', { name: '查看详情' }))[1]!);

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

    await userEvent.click(await screen.findByRole('button', { name: '打开退出登录确认' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('确认退出当前账号？')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '确认退出' }));

    expect(authApiMock.logout).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('heading', { name: '登录 Voyage Atlas' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('requires confirmation before deleting a marker', async () => {
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: '删除' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('确认删除这条旅行记录？')).toBeInTheDocument();
    expect(remoteTravelStoreRepositoryMock.deleteMarker).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: '确认删除' }));

    await waitFor(() => {
      expect(remoteTravelStoreRepositoryMock.deleteMarker).toHaveBeenCalledTimes(1);
    });
  });
});
