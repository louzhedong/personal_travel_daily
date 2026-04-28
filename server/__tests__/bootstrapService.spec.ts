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
  serializeBootstrapResponseMock: vi.fn(),
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
  serializeBootstrapResponse: mocks.serializeBootstrapResponseMock,
}));

import { getBootstrapPayload } from '../appApi/services/bootstrapService.js';

describe('bootstrapService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.serializeBootstrapStoreMock.mockReturnValue({ store: 'serialized' });
    mocks.serializeBootstrapResponseMock.mockImplementation((input) => ({
      payload: input.store,
      accountId: input.account.id,
      fetchedAt: input.fetchedAt,
    }));
  });

  it('loads bootstrap resources inside a transaction and serializes them', async () => {
    const tx = { tx: true };
    const prisma = {
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    const account = { id: 'acct-1', name: 'Voyage Atlas', username: 'demo', role: 'admin' as const };
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

    const result = await getBootstrapPayload(account);

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(mocks.listActiveCompanionsByAccountIdMock).toHaveBeenCalledWith(tx, 'acct-1');
    expect(mocks.listActiveTripsByAccountIdMock).toHaveBeenCalledWith(tx, 'acct-1');
    expect(mocks.listActiveMarkersByAccountIdMock).toHaveBeenCalledWith(tx, 'acct-1');
    expect(mocks.listActiveSavedGuidesByAccountIdMock).toHaveBeenCalledWith(tx, 'acct-1');
    expect(mocks.listActiveGuideSearchHistoriesByAccountIdMock).toHaveBeenCalledWith(tx, 'acct-1');
    expect(mocks.serializeBootstrapStoreMock).toHaveBeenCalledWith({
      users,
      trips,
      markers,
      savedGuides,
      guideSearchHistory,
      activeUserId: 'user-1',
    });
    expect(mocks.serializeBootstrapResponseMock).toHaveBeenCalledWith({
      account,
      fetchedAt: expect.any(Date),
      store: { store: 'serialized' },
    });
    expect(result).toMatchObject({
      payload: { store: 'serialized' },
      accountId: 'acct-1',
      fetchedAt: expect.any(Date),
    });
  });

  it('uses an empty active user id when no companions exist', async () => {
    const prisma = {
      $transaction: vi.fn(async (callback: (input: object) => Promise<unknown>) => callback({})),
    };

    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.listActiveCompanionsByAccountIdMock.mockResolvedValue([]);
    mocks.listActiveTripsByAccountIdMock.mockResolvedValue([]);
    mocks.listActiveMarkersByAccountIdMock.mockResolvedValue([]);
    mocks.listActiveSavedGuidesByAccountIdMock.mockResolvedValue([]);
    mocks.listActiveGuideSearchHistoriesByAccountIdMock.mockResolvedValue([]);

    await getBootstrapPayload({
      id: 'acct-2',
      name: 'Atlas',
      username: 'demo-2',
      role: 'member',
    });

    expect(mocks.serializeBootstrapStoreMock).toHaveBeenCalledWith(
      expect.objectContaining({
        activeUserId: '',
      }),
    );
  });
});
