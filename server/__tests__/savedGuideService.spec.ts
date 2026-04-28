// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  randomUUIDMock: vi.fn(),
  getPrismaClientMock: vi.fn(),
  findActiveCompanionByIdMock: vi.fn(),
  findActiveMarkerByIdMock: vi.fn(),
  createSavedGuideMock: vi.fn(),
  findActiveSavedGuideByIdMock: vi.fn(),
  findActiveSavedGuideByIdentityMock: vi.fn(),
  listActiveSavedGuidesByAccountIdMock: vi.fn(),
  softDeleteSavedGuideByIdMock: vi.fn(),
  serializeDeleteSavedGuideMock: vi.fn(),
  serializeSavedGuideMutationMock: vi.fn(),
  serializeSavedGuidesListMock: vi.fn(),
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

vi.mock('../appApi/repositories/visitMarkerRepository.js', () => ({
  findActiveMarkerById: mocks.findActiveMarkerByIdMock,
}));

vi.mock('../appApi/repositories/savedGuideRepository.js', () => ({
  createSavedGuide: mocks.createSavedGuideMock,
  findActiveSavedGuideById: mocks.findActiveSavedGuideByIdMock,
  findActiveSavedGuideByIdentity: mocks.findActiveSavedGuideByIdentityMock,
  listActiveSavedGuidesByAccountId: mocks.listActiveSavedGuidesByAccountIdMock,
  softDeleteSavedGuideById: mocks.softDeleteSavedGuideByIdMock,
}));

vi.mock('../appApi/serializers/bootstrapSerializer.js', () => ({
  serializeDeleteSavedGuide: mocks.serializeDeleteSavedGuideMock,
  serializeSavedGuideMutation: mocks.serializeSavedGuideMutationMock,
  serializeSavedGuidesList: mocks.serializeSavedGuidesListMock,
}));

import {
  createSavedGuideResource,
  deleteSavedGuideResource,
  listSavedGuidesResource,
} from '../appApi/services/savedGuideService.js';

describe('savedGuideService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.randomUUIDMock.mockReturnValue('saved-guide-uuid');
    mocks.serializeSavedGuidesListMock.mockImplementation((items) => ({ items }));
    mocks.serializeSavedGuideMutationMock.mockImplementation((item, deduplicated) => ({
      item,
      ...(deduplicated ? { deduplicated: true } : {}),
    }));
    mocks.serializeDeleteSavedGuideMock.mockImplementation((deletedId) => ({ deletedId }));
  });

  it('filters saved guides by companion and marker', async () => {
    const prisma = {};
    const items = [
      { id: '1', savedByCompanionId: 'user-1', markerId: 'marker-1' },
      { id: '2', savedByCompanionId: 'user-2', markerId: 'marker-1' },
      { id: '3', savedByCompanionId: 'user-1', markerId: 'marker-2' },
    ];
    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.listActiveSavedGuidesByAccountIdMock.mockResolvedValue(items);

    const result = await listSavedGuidesResource('acct-1', {
      companionId: 'user-1',
      markerId: 'marker-1',
    });

    expect(mocks.listActiveSavedGuidesByAccountIdMock).toHaveBeenCalledWith(prisma, 'acct-1');
    expect(mocks.serializeSavedGuidesListMock).toHaveBeenCalledWith([items[0]]);
    expect(result).toEqual({ items: [items[0]] });
  });

  it('creates a saved guide with parsed metadata and marker context key', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.findActiveCompanionByIdMock.mockResolvedValue({ id: 'user-1' });
    mocks.findActiveMarkerByIdMock.mockResolvedValue({ id: 'marker-1' });
    mocks.findActiveSavedGuideByIdentityMock.mockResolvedValue(null);
    mocks.createSavedGuideMock.mockResolvedValue({ id: 'saved-guide-1' });

    const result = await createSavedGuideResource('acct-1', {
      savedByUserId: 'user-1',
      markerId: 'marker-1',
      keyword: '京都 樱花',
      result: {
        id: 'guide-1',
        title: '京都春游',
        summary: '看樱花路线',
        sourceName: 'Qyer',
        sourceUrl: ' HTTPS://EXAMPLE.COM/GUIDE ',
        coverImageUrl: 'https://example.com/cover.jpg',
        authorName: '作者甲',
        publishedAt: '2026-04-01T00:00:00.000Z',
        destinationLabel: '京都',
      },
    });

    expect(mocks.findActiveSavedGuideByIdentityMock).toHaveBeenCalledWith(tx, {
      accountId: 'acct-1',
      savedByCompanionId: 'user-1',
      saveContextKey: 'marker:marker-1',
      guideIdentity: 'https://example.com/guide',
    });
    expect(mocks.createSavedGuideMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        id: 'saved-guide-uuid',
        accountId: 'acct-1',
        savedByCompanionId: 'user-1',
        markerId: 'marker-1',
        saveContextKey: 'marker:marker-1',
        guideIdentity: 'https://example.com/guide',
        guidePublishedAt: new Date('2026-04-01T00:00:00.000Z'),
      }),
    );
    expect(result).toEqual({
      item: { id: 'saved-guide-1' },
    });
  });

  it('returns duplicate saved guide when identity already exists', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.findActiveCompanionByIdMock.mockResolvedValue({ id: 'user-1' });
    mocks.findActiveSavedGuideByIdentityMock.mockResolvedValue({ id: 'existing' });

    const result = await createSavedGuideResource('acct-1', {
      savedByUserId: 'user-1',
      keyword: '杭州 周末',
      result: {
        id: 'guide-2',
        title: '杭州周末',
        summary: '散步路线',
        sourceName: 'Example',
        sourceUrl: 'https://example.com/hz',
      },
    });

    expect(mocks.createSavedGuideMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      item: { id: 'existing' },
      deduplicated: true,
    });
  });

  it('rejects create/delete operations when related records are missing', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });

    mocks.findActiveCompanionByIdMock.mockResolvedValueOnce(null);
    await expect(
      createSavedGuideResource('acct-1', {
        savedByUserId: 'missing',
        keyword: 'test',
        result: {
          id: 'guide',
          title: '标题',
          summary: '摘要',
          sourceName: '来源',
          sourceUrl: 'https://example.com',
        },
      }),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'companion not found',
    });

    mocks.findActiveCompanionByIdMock.mockResolvedValueOnce({ id: 'user-1' });
    mocks.findActiveMarkerByIdMock.mockResolvedValueOnce(null);
    await expect(
      createSavedGuideResource('acct-1', {
        savedByUserId: 'user-1',
        markerId: 'missing-marker',
        keyword: 'test',
        result: {
          id: 'guide',
          title: '标题',
          summary: '摘要',
          sourceName: '来源',
          sourceUrl: 'https://example.com',
        },
      }),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'marker not found',
    });

    mocks.findActiveSavedGuideByIdMock.mockResolvedValueOnce(null);
    await expect(deleteSavedGuideResource('acct-1', 'missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'saved guide not found',
    });
  });

  it('soft deletes an existing saved guide', async () => {
    const tx = {};
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: vi.fn(async (callback: (input: typeof tx) => Promise<unknown>) => callback(tx)),
    });
    mocks.findActiveSavedGuideByIdMock.mockResolvedValue({ id: 'saved-guide-1' });

    const result = await deleteSavedGuideResource('acct-1', 'saved-guide-1');

    expect(mocks.softDeleteSavedGuideByIdMock).toHaveBeenCalledWith(
      tx,
      'saved-guide-1',
      expect.any(Date),
    );
    expect(result).toEqual({ deletedId: 'saved-guide-1' });
  });
});
