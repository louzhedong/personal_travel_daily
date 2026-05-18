// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppApiError } from '../appApi/errors.js';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  listRowsMock: vi.fn(),
  findRowMock: vi.fn(),
  createRowMock: vi.fn(),
  upsertRowMock: vi.fn(),
  updateRowMock: vi.fn(),
  deleteRowMock: vi.fn(),
  listMarkerTagsMock: vi.fn(),
  randomUUIDMock: vi.fn(),
}));

vi.mock('node:crypto', () => ({
  randomUUID: mocks.randomUUIDMock,
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/tagVocabularyRepository.js', () => ({
  listMarkerTagVocabularyRows: mocks.listRowsMock,
  findMarkerTagVocabularyRow: mocks.findRowMock,
  createMarkerTagVocabularyRow: mocks.createRowMock,
  upsertMarkerTagVocabularyRow: mocks.upsertRowMock,
  updateMarkerTagVocabularyRow: mocks.updateRowMock,
  deleteMarkerTagVocabularyRow: mocks.deleteRowMock,
  listActiveMarkerTagPayloads: mocks.listMarkerTagsMock,
}));

import {
  assertMarkerTagsAreKnown,
  createMarkerTagVocabulary,
  deleteMarkerTagVocabulary,
  listMarkerTagVocabulary,
  updateMarkerTagVocabulary,
} from '../appApi/services/tagVocabularyService.js';

const prisma = { markerTagVocabulary: true };
const customRow = {
  id: 'tag-1',
  accountId: 'acct-1',
  value: 'onsen',
  label: '温泉',
  source: 'custom',
  isHidden: false,
  sortOrder: 500,
  createdAt: new Date('2026-05-12T00:00:00.000Z'),
  updatedAt: new Date('2026-05-12T00:00:00.000Z'),
};

describe('tagVocabularyService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.randomUUIDMock.mockReturnValue('tag-random-id');
    mocks.listRowsMock.mockResolvedValue([customRow]);
    mocks.listMarkerTagsMock.mockResolvedValue([{ tags: ['food', 'onsen'] }, { tags: ['onsen'] }]);
  });

  it('merges system tags, custom tags, visibility, and usage counts', async () => {
    const result = await listMarkerTagVocabulary('acct-1');

    expect(result.systemCount).toBeGreaterThan(0);
    expect(result.customCount).toBe(1);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'food', label: '美食', source: 'system', usageCount: 1 }),
        expect.objectContaining({ value: 'onsen', label: '温泉', source: 'custom', usageCount: 2 }),
      ]),
    );
  });

  it('creates custom tags and rejects duplicate system values', async () => {
    mocks.findRowMock.mockResolvedValueOnce(null);

    await createMarkerTagVocabulary('acct-1', { label: '温泉', value: 'onsen' });

    expect(mocks.createRowMock).toHaveBeenCalledWith(prisma, expect.objectContaining({
      accountId: 'acct-1',
      value: 'onsen',
      label: '温泉',
      source: 'custom',
    }));

    await expect(createMarkerTagVocabulary('acct-1', { label: '美食', value: 'food' })).rejects.toMatchObject<AppApiError>({
      statusCode: 400,
      code: 'INVALID_REQUEST',
    });
  });

  it('upserts system overrides and updates custom rows', async () => {
    await updateMarkerTagVocabulary('acct-1', 'food', { isHidden: true, sortOrder: 90 });
    expect(mocks.upsertRowMock).toHaveBeenCalledWith(prisma, 'acct-1', 'food', expect.objectContaining({
      source: 'system',
      isHidden: true,
      sortOrder: 90,
    }));

    mocks.findRowMock.mockResolvedValueOnce(customRow);
    await updateMarkerTagVocabulary('acct-1', 'onsen', { label: '温泉旅馆' });
    expect(mocks.updateRowMock).toHaveBeenCalledWith(prisma, 'acct-1', 'onsen', { label: '温泉旅馆' });
  });

  it('prevents deleting system or used custom tags', async () => {
    await expect(deleteMarkerTagVocabulary('acct-1', 'food')).rejects.toMatchObject<AppApiError>({ statusCode: 400 });

    mocks.findRowMock.mockResolvedValueOnce(customRow);
    await expect(deleteMarkerTagVocabulary('acct-1', 'onsen')).rejects.toMatchObject<AppApiError>({ statusCode: 400 });
  });

  it('validates marker tags against known vocabulary', async () => {
    await expect(assertMarkerTagsAreKnown('acct-1', ['food', 'onsen'])).resolves.toBeUndefined();
    await expect(assertMarkerTagsAreKnown('acct-1', ['unknown-tag'])).rejects.toMatchObject<AppApiError>({
      statusCode: 400,
      code: 'INVALID_REQUEST',
    });
  });
});
