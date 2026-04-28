// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  randomUUIDMock: vi.fn(),
  getPrismaClientMock: vi.fn(),
  createTripMock: vi.fn(),
  findActiveTripByIdMock: vi.fn(),
  softDeleteTripMock: vi.fn(),
  updateTripMock: vi.fn(),
  buildCurrentStoreSnapshotMock: vi.fn(),
}));

vi.mock('node:crypto', () => ({
  randomUUID: mocks.randomUUIDMock,
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/tripRepository.js', () => ({
  createTrip: mocks.createTripMock,
  findActiveTripById: mocks.findActiveTripByIdMock,
  softDeleteTrip: mocks.softDeleteTripMock,
  updateTrip: mocks.updateTripMock,
}));

vi.mock('../appApi/services/storeSnapshotService.js', () => ({
  buildCurrentStoreSnapshot: mocks.buildCurrentStoreSnapshotMock,
}));

import {
  createTripCollection,
  deleteTripCollection,
  updateTripCollection,
} from '../appApi/services/tripService.js';

describe('tripService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.randomUUIDMock.mockReturnValue('trip-uuid');
    mocks.buildCurrentStoreSnapshotMock.mockResolvedValue({ trips: [] });
  });

  it('creates a trip with parsed date-only fields', async () => {
    const prisma = {};
    mocks.getPrismaClientMock.mockReturnValue(prisma);

    const result = await createTripCollection('acct-1', {
      name: '北海道雪国行',
      coverImageUrl: 'https://example.com/cover.jpg',
      note: '带上厚外套',
      startsAt: '2026-01-10',
      endsAt: '2026-01-16',
    });

    expect(mocks.createTripMock).toHaveBeenCalledWith(prisma, {
      id: 'trip-uuid',
      accountId: 'acct-1',
      name: '北海道雪国行',
      coverImageUrl: 'https://example.com/cover.jpg',
      note: '带上厚外套',
      startsAt: new Date('2026-01-10T00:00:00.000Z'),
      endsAt: new Date('2026-01-16T00:00:00.000Z'),
    });
    expect(mocks.buildCurrentStoreSnapshotMock).toHaveBeenCalledWith('acct-1');
    expect(result).toEqual({ trips: [] });
  });

  it('updates a trip with only provided fields after validation', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.findActiveTripByIdMock.mockResolvedValue({
      id: 'trip-1',
      startsAt: new Date('2026-04-01T00:00:00.000Z'),
      endsAt: new Date('2026-04-05T00:00:00.000Z'),
    });

    await updateTripCollection('acct-1', 'trip-1', {
      note: '更新备注',
      endsAt: '2026-04-06',
    });

    expect(mocks.updateTripMock).toHaveBeenCalledWith(tx, 'trip-1', {
      note: '更新备注',
      endsAt: new Date('2026-04-06T00:00:00.000Z'),
    });
    expect(mocks.buildCurrentStoreSnapshotMock).toHaveBeenCalledWith('acct-1');
  });

  it('rejects update when trip is missing or date range is invalid', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });

    mocks.findActiveTripByIdMock.mockResolvedValueOnce(null);
    await expect(updateTripCollection('acct-1', 'missing', { note: 'x' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'trip not found',
    });

    mocks.findActiveTripByIdMock.mockResolvedValueOnce({
      id: 'trip-1',
      startsAt: new Date('2026-04-01T00:00:00.000Z'),
      endsAt: new Date('2026-04-05T00:00:00.000Z'),
    });
    await expect(
      updateTripCollection('acct-1', 'trip-1', {
        startsAt: '2026-04-07',
        endsAt: '2026-04-06',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
      statusCode: 400,
      message: 'endsAt must be later than or equal to startsAt',
    });

    expect(mocks.updateTripMock).not.toHaveBeenCalled();
  });

  it('soft deletes an existing trip and returns a fresh snapshot', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.findActiveTripByIdMock.mockResolvedValue({ id: 'trip-1' });

    const result = await deleteTripCollection('acct-1', 'trip-1');

    expect(mocks.softDeleteTripMock).toHaveBeenCalledWith(tx, 'trip-1', expect.any(Date));
    expect(mocks.buildCurrentStoreSnapshotMock).toHaveBeenCalledWith('acct-1');
    expect(result).toEqual({ trips: [] });
  });
});
