// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  listActiveCompanionsByAccountIdMock: vi.fn(),
  listActiveTripsByAccountIdMock: vi.fn(),
  listActiveMarkersByAccountIdMock: vi.fn(),
  listActiveSavedGuidesByAccountIdMock: vi.fn(),
  listActiveGuideSearchHistoriesByAccountIdMock: vi.fn(),
  serializeBootstrapStoreMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/travelCompanionRepository.js', () => ({
  listActiveCompanionsByAccountId: mocks.listActiveCompanionsByAccountIdMock,
}));

vi.mock('../appApi/repositories/tripRepository.js', () => ({
  listActiveTripsByAccountId: mocks.listActiveTripsByAccountIdMock,
}));

vi.mock('../appApi/repositories/visitMarkerRepository.js', () => ({
  listActiveMarkersByAccountId: mocks.listActiveMarkersByAccountIdMock,
}));

vi.mock('../appApi/repositories/savedGuideRepository.js', () => ({
  listActiveSavedGuidesByAccountId: mocks.listActiveSavedGuidesByAccountIdMock,
}));

vi.mock('../appApi/repositories/guideSearchHistoryRepository.js', () => ({
  listActiveGuideSearchHistoriesByAccountId: mocks.listActiveGuideSearchHistoriesByAccountIdMock,
}));

vi.mock('../appApi/serializers/bootstrapSerializer.js', () => ({
  serializeBootstrapStore: mocks.serializeBootstrapStoreMock,
}));

import { buildCurrentStoreSnapshot } from '../appApi/services/storeSnapshotService.js';

describe('storeSnapshotService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.serializeBootstrapStoreMock.mockReturnValue({ snapshot: true });
  });

  it('loads the current store snapshot and serializes it', async () => {
    const prisma = { prisma: true };
    const users = [{ id: 'user-1', name: '小悠', color: '#2563eb' }];
    const trips = [{ id: 'trip-1' }];
    const markers = [{ id: 'marker-1' }];
    const savedGuides = [{ id: 'guide-1' }];
    const guideSearchHistory = [{ id: 'history-1' }];

    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.listActiveCompanionsByAccountIdMock.mockResolvedValue(users);
    mocks.listActiveTripsByAccountIdMock.mockResolvedValue(trips);
    mocks.listActiveMarkersByAccountIdMock.mockResolvedValue(markers);
    mocks.listActiveSavedGuidesByAccountIdMock.mockResolvedValue(savedGuides);
    mocks.listActiveGuideSearchHistoriesByAccountIdMock.mockResolvedValue(guideSearchHistory);

    const result = await buildCurrentStoreSnapshot('acct-1');

    expect(mocks.listActiveCompanionsByAccountIdMock).toHaveBeenCalledWith(prisma, 'acct-1');
    expect(mocks.listActiveTripsByAccountIdMock).toHaveBeenCalledWith(prisma, 'acct-1');
    expect(mocks.listActiveMarkersByAccountIdMock).toHaveBeenCalledWith(prisma, 'acct-1');
    expect(mocks.listActiveSavedGuidesByAccountIdMock).toHaveBeenCalledWith(prisma, 'acct-1');
    expect(mocks.listActiveGuideSearchHistoriesByAccountIdMock).toHaveBeenCalledWith(prisma, 'acct-1');
    expect(mocks.serializeBootstrapStoreMock).toHaveBeenCalledWith({
      users,
      trips,
      markers,
      savedGuides,
      guideSearchHistory,
      activeUserId: 'user-1',
    });
    expect(result).toEqual({ snapshot: true });
  });

  it('falls back to an empty active user id when snapshot has no companions', async () => {
    mocks.getPrismaClientMock.mockReturnValue({});
    mocks.listActiveCompanionsByAccountIdMock.mockResolvedValue([]);
    mocks.listActiveTripsByAccountIdMock.mockResolvedValue([]);
    mocks.listActiveMarkersByAccountIdMock.mockResolvedValue([]);
    mocks.listActiveSavedGuidesByAccountIdMock.mockResolvedValue([]);
    mocks.listActiveGuideSearchHistoriesByAccountIdMock.mockResolvedValue([]);

    await buildCurrentStoreSnapshot('acct-2');

    expect(mocks.serializeBootstrapStoreMock).toHaveBeenCalledWith(
      expect.objectContaining({
        activeUserId: '',
      }),
    );
  });
});
