// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  randomUUIDMock: vi.fn(),
  getPrismaClientMock: vi.fn(),
  findActiveCompanionByIdMock: vi.fn(),
  createGuideSearchHistoryMock: vi.fn(),
  findActiveGuideSearchHistoryByIdentityMock: vi.fn(),
  listActiveGuideSearchHistoriesByAccountIdMock: vi.fn(),
  refreshGuideSearchHistoryMock: vi.fn(),
  serializeGuideSearchHistoryListMock: vi.fn(),
  serializeGuideSearchHistoryMutationMock: vi.fn(),
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

vi.mock('../appApi/repositories/guideSearchHistoryRepository.js', () => ({
  createGuideSearchHistory: mocks.createGuideSearchHistoryMock,
  findActiveGuideSearchHistoryByIdentity: mocks.findActiveGuideSearchHistoryByIdentityMock,
  listActiveGuideSearchHistoriesByAccountId: mocks.listActiveGuideSearchHistoriesByAccountIdMock,
  refreshGuideSearchHistory: mocks.refreshGuideSearchHistoryMock,
}));

vi.mock('../appApi/serializers/bootstrapSerializer.js', () => ({
  serializeGuideSearchHistoryList: mocks.serializeGuideSearchHistoryListMock,
  serializeGuideSearchHistoryMutation: mocks.serializeGuideSearchHistoryMutationMock,
}));

import {
  createGuideSearchHistoryResource,
  listGuideSearchHistoriesResource,
} from '../appApi/services/guideSearchHistoryService.js';

describe('guideSearchHistoryService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.randomUUIDMock.mockReturnValue('history-uuid');
    mocks.serializeGuideSearchHistoryListMock.mockImplementation((items) => ({ items }));
    mocks.serializeGuideSearchHistoryMutationMock.mockImplementation((item, deduplicated) => ({
      item,
      ...(deduplicated ? { deduplicated: true } : {}),
    }));
  });

  it('filters and limits history list before serialization', async () => {
    const prisma = {};
    const histories = [
      { id: '1', companionId: 'user-1', keyword: '京都', scope: 'international' },
      { id: '2', companionId: 'user-2', keyword: '杭州', scope: 'domestic' },
      { id: '3', companionId: 'user-1', keyword: '东京', scope: 'international' },
    ];
    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.listActiveGuideSearchHistoriesByAccountIdMock.mockResolvedValue(histories);

    const result = await listGuideSearchHistoriesResource('acct-1', {
      companionId: 'user-1',
      limit: 1,
    });

    expect(mocks.listActiveGuideSearchHistoriesByAccountIdMock).toHaveBeenCalledWith(prisma, 'acct-1');
    expect(mocks.serializeGuideSearchHistoryListMock).toHaveBeenCalledWith([histories[0]]);
    expect(result).toEqual({ items: [histories[0]] });
  });

  it('creates a new history record with normalized keyword and trimmed content', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.findActiveCompanionByIdMock.mockResolvedValue({ id: 'user-1' });
    mocks.findActiveGuideSearchHistoryByIdentityMock.mockResolvedValue(null);
    mocks.createGuideSearchHistoryMock.mockResolvedValue({ id: 'history-1', keyword: 'Kyoto' });

    const result = await createGuideSearchHistoryResource('acct-1', {
      companionId: 'user-1',
      keyword: '  Kyoto ',
      scope: 'international',
    });

    expect(mocks.findActiveGuideSearchHistoryByIdentityMock).toHaveBeenCalledWith(tx, {
      accountId: 'acct-1',
      companionId: 'user-1',
      keywordNormalized: 'kyoto',
      scope: 'international',
    });
    expect(mocks.createGuideSearchHistoryMock).toHaveBeenCalledWith(tx, {
      id: 'history-uuid',
      accountId: 'acct-1',
      companionId: 'user-1',
      keyword: 'Kyoto',
      keywordNormalized: 'kyoto',
      scope: 'international',
    });
    expect(result).toEqual({
      item: { id: 'history-1', keyword: 'Kyoto' },
    });
  });

  it('refreshes duplicate history instead of creating a new one', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.findActiveCompanionByIdMock.mockResolvedValue({ id: 'user-1' });
    mocks.findActiveGuideSearchHistoryByIdentityMock.mockResolvedValue({ id: 'history-existing' });
    mocks.refreshGuideSearchHistoryMock.mockResolvedValue({ id: 'history-existing', keyword: 'Kyoto' });

    const result = await createGuideSearchHistoryResource('acct-1', {
      companionId: 'user-1',
      keyword: ' Kyoto ',
      scope: 'international',
    });

    expect(mocks.refreshGuideSearchHistoryMock).toHaveBeenCalledWith(
      tx,
      'history-existing',
      'Kyoto',
      undefined,
    );
    expect(mocks.createGuideSearchHistoryMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      item: { id: 'history-existing', keyword: 'Kyoto' },
      deduplicated: true,
    });
  });

  it('rejects creation when companion is missing', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.findActiveCompanionByIdMock.mockResolvedValue(null);

    await expect(
      createGuideSearchHistoryResource('acct-1', {
        companionId: 'missing',
        keyword: 'Kyoto',
        scope: 'international',
      }),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
      message: 'companion not found',
    });
  });
});
