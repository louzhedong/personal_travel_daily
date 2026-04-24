import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn(),
  deleteMock: vi.fn(),
  getBootstrapBaseUrlMock: vi.fn(() => '/api/app'),
  getResourceBaseUrlMock: vi.fn(() => '/api'),
}));

vi.mock('../httpClient', () => ({
  httpClient: {
    get: mocks.getMock,
    post: mocks.postMock,
    patch: mocks.patchMock,
    delete: mocks.deleteMock,
  },
  getBootstrapBaseUrl: mocks.getBootstrapBaseUrlMock,
  getResourceBaseUrl: mocks.getResourceBaseUrlMock,
}));

import { fetchAppBootstrap } from '../appBootstrapApi';
import { fetchAdminOverview } from '../adminApi';
import { fetchSession, login, logout, register } from '../authApi';
import { createCompanion, updateCompanion } from '../companionsApi';
import { createGuideSearchHistory, fetchGuideSearchHistories } from '../guideSearchHistoryApi';
import { createMarker, deleteMarker, searchMarkers, updateMarker } from '../markersApi';
import { createSavedGuide, deleteSavedGuide, fetchSavedGuides } from '../savedGuidesApi';

describe('app api modules', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getBootstrapBaseUrlMock.mockReturnValue('/api/app');
    mocks.getResourceBaseUrlMock.mockReturnValue('/api');
  });

  it('routes bootstrap requests through the bootstrap base url', async () => {
    mocks.getMock.mockResolvedValueOnce({ store: { users: [] } });

    await fetchAppBootstrap();

    expect(mocks.getMock).toHaveBeenCalledWith('/api/app', '/bootstrap');
  });

  it('routes auth requests through the resource base url', async () => {
    await fetchSession();
    await login({ username: 'demo', password: 'demo123456' });
    await register({ nickname: 'Voyage Atlas', username: 'demo', password: 'demo123456' });
    await logout();

    expect(mocks.getMock).toHaveBeenCalledWith('/api', '/auth/session');
    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/auth/login', {
      username: 'demo',
      password: 'demo123456',
    });
    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/auth/register', {
      nickname: 'Voyage Atlas',
      username: 'demo',
      password: 'demo123456',
    });
    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/auth/logout');
  });

  it('routes admin overview requests through the resource base url', async () => {
    await fetchAdminOverview();

    expect(mocks.getMock).toHaveBeenCalledWith('/api', '/admin/overview');
  });

  it('forwards companion create and update payloads', async () => {
    const createPayload = { name: '阿泽', color: '#f97316' };
    const updatePayload = { color: '#ea580c' };

    await createCompanion(createPayload);
    await updateCompanion('user-bob', updatePayload);

    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/companions', createPayload);
    expect(mocks.patchMock).toHaveBeenCalledWith('/api', '/companions/user-bob', updatePayload);
  });

  it('forwards marker create, update and delete requests', async () => {
    const markerPayload = {
      companionId: 'user-alice',
      scope: 'international' as const,
      scopeId: 'jp-kyoto',
      scopeName: '京都府',
      city: '京都',
      note: '春天赏樱',
      visitedStartAt: '2026-04-01',
      visitedEndAt: '2026-04-05',
    };

    await createMarker(markerPayload);
    await updateMarker('marker-1', { note: '更新后的备注' });
    await deleteMarker('marker-1');

    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/markers', markerPayload);
    expect(mocks.patchMock).toHaveBeenCalledWith('/api', '/markers/marker-1', {
      note: '更新后的备注',
    });
    expect(mocks.deleteMock).toHaveBeenCalledWith('/api', '/markers/marker-1');
  });

  it('forwards marker search query parameters', async () => {
    await searchMarkers({
      keyword: '京都',
      scope: 'international',
      companionId: 'user-alice',
      year: '2026',
      page: 1,
      pageSize: 20,
    });

    expect(mocks.getMock).toHaveBeenCalledWith('/api', '/markers/search', {
      keyword: '京都',
      scope: 'international',
      companionId: 'user-alice',
      year: '2026',
      page: 1,
      pageSize: 20,
    });
  });

  it('forwards saved guide resource requests with query and payload', async () => {
    const savedGuidePayload = {
      savedByUserId: 'user-alice',
      markerId: 'marker-1',
      keyword: '京都',
      result: {
        id: 'guide-1',
        title: '京都三日路线',
        summary: '适合第一次去京都。',
        sourceName: '示例来源',
        sourceUrl: 'https://example.com/guides/kyoto',
      },
    };

    await fetchSavedGuides({ companionId: 'user-alice', markerId: 'marker-1' });
    await createSavedGuide(savedGuidePayload);
    await deleteSavedGuide('saved-guide-1');

    expect(mocks.getMock).toHaveBeenCalledWith('/api', '/saved-guides', {
      companionId: 'user-alice',
      markerId: 'marker-1',
    });
    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/saved-guides', savedGuidePayload);
    expect(mocks.deleteMock).toHaveBeenCalledWith('/api', '/saved-guides/saved-guide-1');
  });

  it('forwards guide search history requests with query and payload', async () => {
    const payload = {
      companionId: 'user-alice',
      keyword: '京都',
      scope: 'international' as const,
    };

    await fetchGuideSearchHistories({ companionId: 'user-alice', limit: 6 });
    await createGuideSearchHistory(payload);

    expect(mocks.getMock).toHaveBeenCalledWith('/api', '/guide-search-histories', {
      companionId: 'user-alice',
      limit: 6,
    });
    expect(mocks.postMock).toHaveBeenCalledWith('/api', '/guide-search-histories', payload);
  });
});
