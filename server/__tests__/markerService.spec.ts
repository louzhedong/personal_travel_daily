// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  randomUUIDMock: vi.fn(),
  getPrismaClientMock: vi.fn(),
  findActiveCompanionByIdMock: vi.fn(),
  findActiveTripByIdMock: vi.fn(),
  createMarkerMock: vi.fn(),
  findActiveMarkersByIdsMock: vi.fn(),
  findActiveMarkerByIdMock: vi.fn(),
  searchActiveMarkersByAccountIdMock: vi.fn(),
  softDeleteMarkerMock: vi.fn(),
  updateMarkerMock: vi.fn(),
  updateMarkersTripIdMock: vi.fn(),
  softDeleteSavedGuidesByMarkerIdMock: vi.fn(),
  createMarkerSearchEventMock: vi.fn(),
  buildCurrentStoreSnapshotMock: vi.fn(),
  serializeMarkerMock: vi.fn(),
}));

vi.mock('node:crypto', () => ({
  randomUUID: mocks.randomUUIDMock,
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/travelCompanionRepository.js', () => ({
  findActiveCompanionById: mocks.findActiveCompanionByIdMock,
}));

vi.mock('../appApi/repositories/tripRepository.js', () => ({
  findActiveTripById: mocks.findActiveTripByIdMock,
}));

vi.mock('../appApi/repositories/visitMarkerRepository.js', () => ({
  createMarker: mocks.createMarkerMock,
  findActiveMarkersByIds: mocks.findActiveMarkersByIdsMock,
  findActiveMarkerById: mocks.findActiveMarkerByIdMock,
  searchActiveMarkersByAccountId: mocks.searchActiveMarkersByAccountIdMock,
  softDeleteMarker: mocks.softDeleteMarkerMock,
  updateMarker: mocks.updateMarkerMock,
  updateMarkersTripId: mocks.updateMarkersTripIdMock,
}));

vi.mock('../appApi/repositories/savedGuideRepository.js', () => ({
  softDeleteSavedGuidesByMarkerId: mocks.softDeleteSavedGuidesByMarkerIdMock,
}));

vi.mock('../appApi/repositories/markerSearchEventRepository.js', () => ({
  createMarkerSearchEvent: mocks.createMarkerSearchEventMock,
}));

vi.mock('../appApi/services/storeSnapshotService.js', () => ({
  buildCurrentStoreSnapshot: mocks.buildCurrentStoreSnapshotMock,
}));

vi.mock('../appApi/serializers/bootstrapSerializer.js', () => ({
  serializeMarker: mocks.serializeMarkerMock,
}));

import {
  batchUpdateMarkersTrip,
  createMarkerRecord,
  deleteMarkerRecord,
  searchMarkerRecords,
  updateMarkerRecord,
} from '../appApi/services/markerService.js';

describe('markerService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.randomUUIDMock.mockReturnValue('marker-uuid');
    mocks.buildCurrentStoreSnapshotMock.mockResolvedValue({ markers: [] });
    mocks.serializeMarkerMock.mockImplementation((marker) => ({ id: marker.id }));
  });

  it('creates a marker after validating companion and optional trip', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.findActiveCompanionByIdMock.mockResolvedValue({ id: 'user-1' });
    mocks.findActiveTripByIdMock.mockResolvedValue({ id: 'trip-1' });

    const result = await createMarkerRecord('acct-1', {
      companionId: 'user-1',
      tripId: 'trip-1',
      scope: 'domestic',
      scopeId: 'zj',
      scopeName: '浙江',
      city: '杭州',
      note: '西湖散步',
      tags: ['food'],
      mood: 'relaxed',
      weather: 'sunny',
      transport: 'walk',
      budgetLevel: 'medium',
      visitedStartAt: '2026-04-01',
      visitedEndAt: '2026-04-02',
      imageUrls: ['https://example.com/1.jpg'],
    });

    expect(mocks.createMarkerMock).toHaveBeenCalledWith(tx, {
      id: 'marker-uuid',
      accountId: 'acct-1',
      companionId: 'user-1',
      tripId: 'trip-1',
      scope: 'domestic',
      scopeId: 'zj',
      scopeName: '浙江',
      city: '杭州',
      note: '西湖散步',
      tags: ['food'],
      mood: 'relaxed',
      weather: 'sunny',
      transport: 'walk',
      budgetLevel: 'medium',
      visitedStartAt: new Date('2026-04-01T00:00:00.000Z'),
      visitedEndAt: new Date('2026-04-02T00:00:00.000Z'),
      imageUrls: ['https://example.com/1.jpg'],
    });
    expect(mocks.buildCurrentStoreSnapshotMock).toHaveBeenCalledWith('acct-1');
    expect(result).toEqual({ markers: [] });
  });

  it('rejects marker creation when companion or trip is missing', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });

    mocks.findActiveCompanionByIdMock.mockResolvedValueOnce(null);
    await expect(
      createMarkerRecord('acct-1', {
        companionId: 'missing',
        scope: 'domestic',
        scopeId: 'zj',
        scopeName: '浙江',
        city: '杭州',
        note: 'test',
        visitedStartAt: '2026-04-01',
        visitedEndAt: '2026-04-01',
      } as never),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'companion not found',
    });

    mocks.findActiveCompanionByIdMock.mockResolvedValueOnce({ id: 'user-1' });
    mocks.findActiveTripByIdMock.mockResolvedValueOnce(null);
    await expect(
      createMarkerRecord('acct-1', {
        companionId: 'user-1',
        tripId: 'missing-trip',
        scope: 'domestic',
        scopeId: 'zj',
        scopeName: '浙江',
        city: '杭州',
        note: 'test',
        visitedStartAt: '2026-04-01',
        visitedEndAt: '2026-04-01',
      } as never),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'trip not found',
    });
  });

  it('updates a marker with parsed dates and validated trip', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.findActiveMarkerByIdMock.mockResolvedValue({
      id: 'marker-1',
      visitedStartAt: new Date('2026-04-01T00:00:00.000Z'),
      visitedEndAt: new Date('2026-04-03T00:00:00.000Z'),
    });
    mocks.findActiveTripByIdMock.mockResolvedValue({ id: 'trip-1' });

    await updateMarkerRecord('acct-1', 'marker-1', {
      note: '更新备注',
      tripId: 'trip-1',
      visitedStartAt: '2026-04-02',
      visitedEndAt: '2026-04-04',
      imageUrls: ['https://example.com/updated.jpg'],
    });

    expect(mocks.updateMarkerMock).toHaveBeenCalledWith(tx, 'marker-1', {
      note: '更新备注',
      visitedStartAt: new Date('2026-04-02T00:00:00.000Z'),
      visitedEndAt: new Date('2026-04-04T00:00:00.000Z'),
      tripId: 'trip-1',
      imageUrls: ['https://example.com/updated.jpg'],
    });
  });

  it('rejects update when marker is missing, date range is invalid, or trip is missing', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });

    mocks.findActiveMarkerByIdMock.mockResolvedValueOnce(null);
    await expect(updateMarkerRecord('acct-1', 'missing', { note: 'x' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'marker not found',
    });

    mocks.findActiveMarkerByIdMock.mockResolvedValueOnce({
      id: 'marker-1',
      visitedStartAt: new Date('2026-04-01T00:00:00.000Z'),
      visitedEndAt: new Date('2026-04-03T00:00:00.000Z'),
    });
    await expect(
      updateMarkerRecord('acct-1', 'marker-1', {
        visitedStartAt: '2026-04-05',
        visitedEndAt: '2026-04-04',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
      message: 'visitedEndAt must be later than or equal to visitedStartAt',
    });

    mocks.findActiveMarkerByIdMock.mockResolvedValueOnce({
      id: 'marker-1',
      visitedStartAt: new Date('2026-04-01T00:00:00.000Z'),
      visitedEndAt: new Date('2026-04-03T00:00:00.000Z'),
    });
    mocks.findActiveTripByIdMock.mockResolvedValueOnce(null);
    await expect(updateMarkerRecord('acct-1', 'marker-1', { tripId: 'missing-trip' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'trip not found',
    });
  });

  it('deletes a marker and cascades soft delete to saved guides', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.findActiveMarkerByIdMock.mockResolvedValue({ id: 'marker-1' });

    await deleteMarkerRecord('acct-1', 'marker-1');

    expect(mocks.softDeleteMarkerMock).toHaveBeenCalledWith(tx, 'marker-1', expect.any(Date));
    expect(mocks.softDeleteSavedGuidesByMarkerIdMock).toHaveBeenCalledWith(
      tx,
      'marker-1',
      expect.any(Date),
    );
  });

  it('deduplicates marker ids when batch updating trip and validates completeness', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.findActiveMarkersByIdsMock.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]);
    mocks.findActiveTripByIdMock.mockResolvedValue({ id: 'trip-1' });

    await batchUpdateMarkersTrip('acct-1', {
      markerIds: ['m1', 'm2', 'm1'],
      tripId: 'trip-1',
    });

    expect(mocks.findActiveMarkersByIdsMock).toHaveBeenCalledWith(tx, 'acct-1', ['m1', 'm2']);
    expect(mocks.updateMarkersTripIdMock).toHaveBeenCalledWith(tx, ['m1', 'm2'], 'trip-1');

    mocks.findActiveMarkersByIdsMock.mockResolvedValueOnce([{ id: 'm1' }]);
    await expect(
      batchUpdateMarkersTrip('acct-1', { markerIds: ['m1', 'm2'] }),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'marker not found',
    });
  });

  it('searches markers, trims keyword, records search event, and computes hasMore', async () => {
    const prisma = {};
    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.searchActiveMarkersByAccountIdMock.mockResolvedValue({
      items: [{ id: 'marker-1' }, { id: 'marker-2' }],
      total: 5,
    });

    const result = await searchMarkerRecords('acct-1', {
      keyword: ' 京都 ',
      companionId: 'user-1',
      scope: 'international',
      tag: 'citywalk',
      mood: 'relaxed',
      weather: 'sunny',
      transport: 'walk',
      budgetLevel: 'medium',
      year: 2026,
      page: 1,
      pageSize: 2,
    });

    expect(mocks.searchActiveMarkersByAccountIdMock).toHaveBeenCalledWith(prisma, {
      accountId: 'acct-1',
      keyword: '京都',
      companionId: 'user-1',
      scope: 'international',
      tag: 'citywalk',
      mood: 'relaxed',
      weather: 'sunny',
      transport: 'walk',
      budgetLevel: 'medium',
      year: 2026,
      page: 1,
      pageSize: 2,
    });
    expect(mocks.createMarkerSearchEventMock).toHaveBeenCalledWith(prisma, {
      id: 'marker-uuid',
      accountId: 'acct-1',
      companionId: 'user-1',
      keyword: '京都',
      scope: 'international',
      year: 2026,
      resultCount: 5,
      page: 1,
      pageSize: 2,
    });
    expect(result).toEqual({
      items: [{ id: 'marker-1' }, { id: 'marker-2' }],
      page: 1,
      pageSize: 2,
      total: 5,
      hasMore: true,
    });
  });
});
