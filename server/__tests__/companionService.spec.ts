// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  randomUUIDMock: vi.fn(),
  getPrismaClientMock: vi.fn(),
  getNextCompanionSortOrderMock: vi.fn(),
  createCompanionMock: vi.fn(),
  findActiveCompanionByIdMock: vi.fn(),
  updateCompanionMock: vi.fn(),
  buildCurrentStoreSnapshotMock: vi.fn(),
}));

vi.mock('node:crypto', () => ({
  randomUUID: mocks.randomUUIDMock,
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/travelCompanionRepository.js', () => ({
  createCompanion: mocks.createCompanionMock,
  findActiveCompanionById: mocks.findActiveCompanionByIdMock,
  getNextCompanionSortOrder: mocks.getNextCompanionSortOrderMock,
  updateCompanion: mocks.updateCompanionMock,
}));

vi.mock('../appApi/services/storeSnapshotService.js', () => ({
  buildCurrentStoreSnapshot: mocks.buildCurrentStoreSnapshotMock,
}));

import {
  createCompanionRecord,
  updateCompanionRecord,
} from '../appApi/services/companionService.js';

describe('companionService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.randomUUIDMock.mockReturnValue('companion-uuid');
    mocks.buildCurrentStoreSnapshotMock.mockResolvedValue({ users: [], activeUserId: '' });
  });

  it('creates a companion with next sort order and returns the latest snapshot', async () => {
    const tx = {
      travelCompanion: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.getNextCompanionSortOrderMock.mockResolvedValue(3);

    const result = await createCompanionRecord('acct-1', {
      name: '西西',
      color: '#22c55e',
    });

    expect(tx.travelCompanion.findFirst).toHaveBeenCalledWith({
      where: {
        accountId: 'acct-1',
        isDeleted: false,
        name: '西西',
      },
    });
    expect(mocks.getNextCompanionSortOrderMock).toHaveBeenCalledWith(tx, 'acct-1');
    expect(mocks.createCompanionMock).toHaveBeenCalledWith(tx, {
      id: 'companion-uuid',
      accountId: 'acct-1',
      name: '西西',
      color: '#22c55e',
      sortOrder: 3,
    });
    expect(mocks.buildCurrentStoreSnapshotMock).toHaveBeenCalledWith('acct-1');
    expect(result).toEqual({ users: [], activeUserId: '' });
  });

  it('rejects duplicate companion names during creation', async () => {
    const tx = {
      travelCompanion: {
        findFirst: vi.fn().mockResolvedValue({ id: 'existing' }),
      },
    };
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });

    await expect(
      createCompanionRecord('acct-1', {
        name: '小悠',
        color: '#2563eb',
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      statusCode: 409,
      message: 'companion name already exists',
    });

    expect(mocks.createCompanionMock).not.toHaveBeenCalled();
  });

  it('updates a companion and checks duplicate names only when name changes', async () => {
    const tx = {
      travelCompanion: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.findActiveCompanionByIdMock.mockResolvedValue({
      id: 'user-1',
      name: '小悠',
    });

    await updateCompanionRecord('acct-1', 'user-1', {
      name: '阿泽',
      color: '#f97316',
    });

    expect(mocks.findActiveCompanionByIdMock).toHaveBeenCalledWith(tx, 'acct-1', 'user-1');
    expect(tx.travelCompanion.findFirst).toHaveBeenCalledWith({
      where: {
        accountId: 'acct-1',
        isDeleted: false,
        name: '阿泽',
        id: {
          not: 'user-1',
        },
      },
    });
    expect(mocks.updateCompanionMock).toHaveBeenCalledWith(tx, 'user-1', {
      name: '阿泽',
      color: '#f97316',
    });
    expect(mocks.buildCurrentStoreSnapshotMock).toHaveBeenCalledWith('acct-1');
  });

  it('rejects update when companion is missing or name duplicates another record', async () => {
    const tx = {
      travelCompanion: {
        findFirst: vi.fn().mockResolvedValue({ id: 'duplicate' }),
      },
    };
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });

    mocks.findActiveCompanionByIdMock.mockResolvedValueOnce(null);
    await expect(updateCompanionRecord('acct-1', 'missing', { color: '#000000' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
      message: 'companion not found',
    });

    mocks.findActiveCompanionByIdMock.mockResolvedValueOnce({
      id: 'user-1',
      name: '小悠',
    });
    await expect(updateCompanionRecord('acct-1', 'user-1', { name: '阿泽' })).rejects.toMatchObject({
      code: 'CONFLICT',
      statusCode: 409,
      message: 'companion name already exists',
    });

    expect(mocks.updateCompanionMock).not.toHaveBeenCalled();
  });
});
