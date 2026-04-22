// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';
import {
  ensureAccount,
  findAccountById,
  findAccountByUsername,
} from '../appApi/repositories/accountRepository.js';
import {
  createCompanion,
  getNextCompanionSortOrder,
  updateCompanion,
} from '../appApi/repositories/travelCompanionRepository.js';
import {
  createMarker,
  updateMarker,
} from '../appApi/repositories/visitMarkerRepository.js';
import {
  softDeleteSavedGuideById,
  softDeleteSavedGuidesByMarkerId,
} from '../appApi/repositories/savedGuideRepository.js';
import {
  createGuideSearchHistory,
  refreshGuideSearchHistory,
} from '../appApi/repositories/guideSearchHistoryRepository.js';

describe('app api repositories', () => {
  it('upserts and reads accounts with expected prisma payloads', async () => {
    const upsert = vi.fn().mockResolvedValue({ id: 'acct_default' });
    const findUnique = vi.fn().mockResolvedValue({ id: 'acct_default', name: 'Voyage Atlas' });
    const prisma = {
      account: {
        upsert,
        findUnique,
      },
    };

    await ensureAccount(prisma as never, {
      id: 'acct_default',
      name: 'Voyage Atlas',
      username: 'demo',
      passwordHash: 'hash',
    });
    await findAccountById(prisma as never, 'acct_default');
    await findAccountByUsername(prisma as never, 'demo');

    expect(upsert).toHaveBeenCalledWith({
      where: { id: 'acct_default' },
      update: { name: 'Voyage Atlas', username: 'demo', passwordHash: 'hash' },
      create: { id: 'acct_default', name: 'Voyage Atlas', username: 'demo', passwordHash: 'hash' },
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'acct_default' },
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { username: 'demo' },
    });
  });

  it('computes next companion sort order and updates only provided fields', async () => {
    const aggregate = vi.fn().mockResolvedValue({
      _max: {
        sortOrder: 3,
      },
    });
    const create = vi.fn().mockResolvedValue({ id: 'user-cici' });
    const update = vi.fn().mockResolvedValue({ id: 'user-cici' });
    const prisma = {
      travelCompanion: {
        aggregate,
        create,
        update,
      },
    };

    const nextSortOrder = await getNextCompanionSortOrder(prisma as never, 'acct_default');
    await createCompanion(prisma as never, {
      id: 'user-cici',
      accountId: 'acct_default',
      name: '西西',
      color: '#22c55e',
      sortOrder: nextSortOrder,
    });
    await updateCompanion(prisma as never, 'user-cici', {
      color: '#16a34a',
    });

    expect(nextSortOrder).toBe(4);
    expect(create).toHaveBeenCalledWith({
      data: {
        id: 'user-cici',
        accountId: 'acct_default',
        name: '西西',
        color: '#22c55e',
        sortOrder: 4,
      },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'user-cici' },
      data: {
        color: '#16a34a',
      },
    });
  });

  it('creates markers with ordered images and refreshes images on update', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'marker-1' });
    const update = vi.fn().mockResolvedValue({ id: 'marker-1' });
    const deleteMany = vi.fn().mockResolvedValue({ count: 2 });
    const prisma = {
      visitMarker: {
        create,
        update,
      },
      visitMarkerImage: {
        deleteMany,
      },
    };

    await createMarker(prisma as never, {
      id: 'marker-1',
      accountId: 'acct_default',
      companionId: 'user-alice',
      scope: 'international',
      scopeId: 'jp-kyoto',
      scopeName: '京都府',
      city: '京都',
      note: '春天赏樱',
      visitedStartAt: new Date('2026-04-01T00:00:00.000Z'),
      visitedEndAt: new Date('2026-04-05T00:00:00.000Z'),
      imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
    });

    await updateMarker(prisma as never, 'marker-1', {
      note: '更新后的备注',
      imageUrls: ['https://example.com/updated.jpg'],
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: 'marker-1',
          images: {
            create: [
              {
                id: 'marker-1_img_0',
                imageUrl: 'https://example.com/1.jpg',
                sortOrder: 0,
              },
              {
                id: 'marker-1_img_1',
                imageUrl: 'https://example.com/2.jpg',
                sortOrder: 1,
              },
            ],
          },
        }),
      }),
    );
    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        markerId: 'marker-1',
      },
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'marker-1' },
        data: {
          note: '更新后的备注',
          images: {
            create: [
              {
                id: 'marker-1_img_0',
                imageUrl: 'https://example.com/updated.jpg',
                sortOrder: 0,
              },
            ],
          },
        },
      }),
    );
  });

  it('soft deletes saved guides for a single guide or an entire marker relation', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'saved-guide-1' });
    const updateMany = vi.fn().mockResolvedValue({ count: 2 });
    const prisma = {
      savedGuide: {
        update,
        updateMany,
      },
    };
    const deletedAt = new Date('2026-04-22T00:00:00.000Z');

    await softDeleteSavedGuideById(prisma as never, 'saved-guide-1', deletedAt);
    await softDeleteSavedGuidesByMarkerId(prisma as never, 'marker-1', deletedAt);

    expect(update).toHaveBeenCalledWith({
      where: { id: 'saved-guide-1' },
      data: {
        isDeleted: true,
        deletedAt,
      },
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        markerId: 'marker-1',
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt,
      },
    });
  });

  it('creates and refreshes guide search history records with normalized payloads', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'history-1' });
    const update = vi.fn().mockResolvedValue({ id: 'history-1' });
    const prisma = {
      guideSearchHistory: {
        create,
        update,
      },
    };

    await createGuideSearchHistory(prisma as never, {
      id: 'history-1',
      accountId: 'acct_default',
      companionId: 'user-alice',
      keyword: '京都',
      keywordNormalized: '京都',
      scope: 'international',
    });
    await refreshGuideSearchHistory(prisma as never, 'history-1', '京都自由行');

    expect(create).toHaveBeenCalledWith({
      data: {
        id: 'history-1',
        accountId: 'acct_default',
        companionId: 'user-alice',
        keyword: '京都',
        keywordNormalized: '京都',
        scope: 'international',
      },
    });
    expect(update).toHaveBeenCalledWith({
      where: {
        id: 'history-1',
      },
      data: {
        keyword: '京都自由行',
        createdAt: expect.any(Date),
      },
    });
  });
});
