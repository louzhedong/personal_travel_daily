// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  randomUUIDMock: vi.fn(),
  getPrismaClientMock: vi.fn(),
  findActiveCompanionByIdMock: vi.fn(),
  createGuideSearchLogMock: vi.fn(),
  upsertGuideSourceHealthMock: vi.fn(),
  serializeGuideSearchLogMutationMock: vi.fn(),
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

vi.mock('../appApi/repositories/guideSearchLogRepository.js', () => ({
  createGuideSearchLog: mocks.createGuideSearchLogMock,
}));

vi.mock('../appApi/repositories/guideSourceHealthRepository.js', () => ({
  upsertGuideSourceHealth: mocks.upsertGuideSourceHealthMock,
}));

vi.mock('../appApi/serializers/bootstrapSerializer.js', () => ({
  serializeGuideSearchLogMutation: mocks.serializeGuideSearchLogMutationMock,
}));

import { createGuideSearchLogResource } from '../appApi/services/guideSearchLogService.js';

describe('guideSearchLogService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.randomUUIDMock
      .mockReturnValueOnce('log-uuid')
      .mockReturnValueOnce('health-uuid');
    mocks.serializeGuideSearchLogMutationMock.mockImplementation((item) => ({ item }));
  });

  it('creates a log and updates source health when source metadata exists', async () => {
    const tx = {};
    const createdAt = new Date('2026-05-06T00:00:00.000Z');
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.findActiveCompanionByIdMock.mockResolvedValue({ id: 'user-1' });
    mocks.createGuideSearchLogMock.mockResolvedValue({
      id: 'log-1',
      companionId: 'user-1',
      keyword: 'Kyoto',
      scope: 'international',
      provider: 'remote',
      page: 1,
      pageSize: 8,
      resultCount: 3,
      hasMore: false,
      durationMs: 120,
      status: 'success',
      sourceName: 'Mock Guide',
      sourceDomain: 'mock.example.com',
      createdAt,
    });

    const result = await createGuideSearchLogResource('acct-1', {
      companionId: 'user-1',
      keyword: ' Kyoto ',
      scope: 'international',
      provider: 'remote',
      page: 1,
      pageSize: 8,
      resultCount: 3,
      hasMore: false,
      durationMs: 120,
      status: 'success',
      sourceName: 'Mock Guide',
      sourceDomain: 'Mock.Example.com',
    });

    expect(mocks.createGuideSearchLogMock).toHaveBeenCalledWith(tx, {
      id: 'log-uuid',
      accountId: 'acct-1',
      companionId: 'user-1',
      keyword: 'Kyoto',
      keywordNormalized: 'kyoto',
      scope: 'international',
      provider: 'remote',
      page: 1,
      pageSize: 8,
      resultCount: 3,
      hasMore: false,
      durationMs: 120,
      status: 'success',
      errorCode: undefined,
      sourceName: 'Mock Guide',
      sourceDomain: 'mock.example.com',
    });
    expect(mocks.upsertGuideSourceHealthMock).toHaveBeenCalledWith(tx, {
      id: 'health-uuid',
      sourceName: 'Mock Guide',
      sourceDomain: 'mock.example.com',
      wasSuccessful: true,
      failureReason: undefined,
      occurredAt: createdAt,
    });
    expect(result).toEqual({
      item: expect.objectContaining({ id: 'log-1', keyword: 'Kyoto' }),
    });
  });

  it('skips source health update when source metadata is absent', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.findActiveCompanionByIdMock.mockResolvedValue({ id: 'user-1' });
    mocks.createGuideSearchLogMock.mockResolvedValue({
      id: 'log-1',
      companionId: 'user-1',
      keyword: 'Kyoto',
      scope: 'international',
      provider: 'remote',
      page: 1,
      pageSize: 8,
      resultCount: 0,
      hasMore: false,
      durationMs: 120,
      status: 'empty',
      createdAt: new Date('2026-05-06T00:00:00.000Z'),
    });

    await createGuideSearchLogResource('acct-1', {
      companionId: 'user-1',
      keyword: 'Kyoto',
      scope: 'international',
      provider: 'remote',
      page: 1,
      pageSize: 8,
      resultCount: 0,
      hasMore: false,
      durationMs: 120,
      status: 'empty',
    });

    expect(mocks.upsertGuideSourceHealthMock).not.toHaveBeenCalled();
  });
});
