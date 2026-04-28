// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAccount,
  ensureAccount,
  findAccountById,
  findAccountByUsername,
} from '../appApi/repositories/accountRepository.js';
import { listAdminOverviewAccounts } from '../appApi/repositories/adminOverviewRepository.js';
import {
  createAuthSession,
  deleteAuthSessionByTokenHash,
  deleteExpiredAuthSessions,
  findAuthSessionByTokenHash,
} from '../appApi/repositories/authSessionRepository.js';
import {
  createGuideSearchHistory,
  findActiveGuideSearchHistoryByIdentity,
  listActiveGuideSearchHistoriesByAccountId,
  refreshGuideSearchHistory,
} from '../appApi/repositories/guideSearchHistoryRepository.js';
import {
  createSavedGuide,
  findActiveSavedGuideById,
  findActiveSavedGuideByIdentity,
  listActiveSavedGuidesByAccountId,
  softDeleteSavedGuideById,
  softDeleteSavedGuidesByMarkerId,
} from '../appApi/repositories/savedGuideRepository.js';

function createPrisma() {
  return {
    account: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    authSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
    guideSearchHistory: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    savedGuide: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  };
}

describe('additional appApi repositories', () => {
  let prisma: ReturnType<typeof createPrisma>;

  beforeEach(() => {
    prisma = createPrisma();
  });

  it('builds account repository queries', async () => {
    await ensureAccount(prisma as never, {
      id: 'acct-1',
      name: 'Voyage Atlas',
      username: 'demo',
      passwordHash: 'hashed',
    });
    expect(prisma.account.upsert).toHaveBeenCalledWith({
      where: { id: 'acct-1' },
      update: {
        name: 'Voyage Atlas',
        username: 'demo',
        role: 'member',
        passwordHash: 'hashed',
      },
      create: {
        id: 'acct-1',
        name: 'Voyage Atlas',
        username: 'demo',
        role: 'member',
        passwordHash: 'hashed',
      },
    });

    await findAccountById(prisma as never, 'acct-1');
    expect(prisma.account.findUnique).toHaveBeenCalledWith({ where: { id: 'acct-1' } });

    await findAccountByUsername(prisma as never, 'demo');
    expect(prisma.account.findUnique).toHaveBeenCalledWith({ where: { username: 'demo' } });

    await createAccount(prisma as never, {
      id: 'acct-2',
      name: 'Atlas 2',
      username: 'demo-2',
      role: 'admin',
      passwordHash: 'hashed-2',
    });
    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        id: 'acct-2',
        name: 'Atlas 2',
        username: 'demo-2',
        role: 'admin',
        passwordHash: 'hashed-2',
      },
    });
  });

  it('builds admin overview include tree', async () => {
    await listAdminOverviewAccounts(prisma as never);

    expect(prisma.account.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        trips: {
          where: { isDeleted: false },
          orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
        },
        companions: {
          where: { isDeleted: false },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            markers: {
              where: { isDeleted: false },
              orderBy: { createdAt: 'desc' },
              include: {
                images: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
            guides: {
              where: { isDeleted: false },
              orderBy: { savedAt: 'desc' },
            },
            histories: {
              where: { isDeleted: false },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        markerSearchEvents: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });
  });

  it('builds auth session repository queries', async () => {
    const expiresAt = new Date('2026-04-01T00:00:00.000Z');
    await createAuthSession(prisma as never, {
      id: 'session-1',
      accountId: 'acct-1',
      tokenHash: 'hash',
      expiresAt,
    });
    expect(prisma.authSession.create).toHaveBeenCalledWith({
      data: {
        id: 'session-1',
        accountId: 'acct-1',
        tokenHash: 'hash',
        expiresAt,
      },
    });

    await findAuthSessionByTokenHash(prisma as never, 'hash');
    expect(prisma.authSession.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: 'hash' },
      include: { account: true },
    });

    await deleteAuthSessionByTokenHash(prisma as never, 'hash');
    expect(prisma.authSession.deleteMany).toHaveBeenCalledWith({ where: { tokenHash: 'hash' } });

    const now = new Date('2026-04-02T00:00:00.000Z');
    await deleteExpiredAuthSessions(prisma as never, now);
    expect(prisma.authSession.deleteMany).toHaveBeenCalledWith({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });
  });

  it('builds guide search history queries', async () => {
    await listActiveGuideSearchHistoriesByAccountId(prisma as never, 'acct-1');
    expect(prisma.guideSearchHistory.findMany).toHaveBeenCalledWith({
      where: {
        accountId: 'acct-1',
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    await findActiveGuideSearchHistoryByIdentity(prisma as never, {
      accountId: 'acct-1',
      companionId: 'u1',
      keywordNormalized: 'kyoto',
      scope: 'international',
    });
    expect(prisma.guideSearchHistory.findFirst).toHaveBeenCalledWith({
      where: {
        accountId: 'acct-1',
        companionId: 'u1',
        keywordNormalized: 'kyoto',
        scope: 'international',
        isDeleted: false,
      },
    });

    await createGuideSearchHistory(prisma as never, {
      id: 'history-1',
      accountId: 'acct-1',
      companionId: 'u1',
      keyword: 'Kyoto',
      keywordNormalized: 'kyoto',
      scope: 'international',
    });
    expect(prisma.guideSearchHistory.create).toHaveBeenCalledWith({
      data: {
        id: 'history-1',
        accountId: 'acct-1',
        companionId: 'u1',
        keyword: 'Kyoto',
        keywordNormalized: 'kyoto',
        scope: 'international',
      },
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-03T00:00:00.000Z'));
    await refreshGuideSearchHistory(prisma as never, 'history-1', 'Kyoto');
    expect(prisma.guideSearchHistory.update).toHaveBeenCalledWith({
      where: { id: 'history-1' },
      data: {
        keyword: 'Kyoto',
        createdAt: new Date('2026-04-03T00:00:00.000Z'),
      },
    });
    vi.useRealTimers();
  });

  it('builds saved guide queries', async () => {
    await listActiveSavedGuidesByAccountId(prisma as never, 'acct-1');
    expect(prisma.savedGuide.findMany).toHaveBeenCalledWith({
      where: {
        accountId: 'acct-1',
        isDeleted: false,
      },
      orderBy: { savedAt: 'desc' },
    });

    await findActiveSavedGuideById(prisma as never, 'acct-1', 'saved-1');
    expect(prisma.savedGuide.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'saved-1',
        accountId: 'acct-1',
        isDeleted: false,
      },
    });

    await findActiveSavedGuideByIdentity(prisma as never, {
      accountId: 'acct-1',
      savedByCompanionId: 'u1',
      saveContextKey: 'marker:1',
      guideIdentity: 'guide-1',
    });
    expect(prisma.savedGuide.findFirst).toHaveBeenCalledWith({
      where: {
        accountId: 'acct-1',
        savedByCompanionId: 'u1',
        saveContextKey: 'marker:1',
        guideIdentity: 'guide-1',
        isDeleted: false,
      },
    });

    const savedAt = new Date('2026-04-01T00:00:00.000Z');
    await createSavedGuide(prisma as never, {
      id: 'saved-1',
      accountId: 'acct-1',
      savedByCompanionId: 'u1',
      markerId: 'marker-1',
      saveContextKey: 'marker:1',
      keyword: '京都',
      guideIdentity: 'guide-1',
      guideTitle: '京都慢游',
      guideSummary: '三天路线',
      guideSourceName: 'Mock',
      guideSourceUrl: 'https://example.com/guide',
      guideCoverImageUrl: 'https://example.com/cover.jpg',
      guideAuthorName: '作者甲',
      guidePublishedAt: savedAt,
      guideDestinationLabel: '京都',
      guidePayloadJson: { id: 'guide-1' },
      savedAt,
    });
    expect(prisma.savedGuide.create).toHaveBeenCalledWith({
      data: {
        id: 'saved-1',
        accountId: 'acct-1',
        savedByCompanionId: 'u1',
        markerId: 'marker-1',
        saveContextKey: 'marker:1',
        keyword: '京都',
        guideIdentity: 'guide-1',
        guideTitle: '京都慢游',
        guideSummary: '三天路线',
        guideSourceName: 'Mock',
        guideSourceUrl: 'https://example.com/guide',
        guideCoverImageUrl: 'https://example.com/cover.jpg',
        guideAuthorName: '作者甲',
        guidePublishedAt: savedAt,
        guideDestinationLabel: '京都',
        guidePayloadJson: { id: 'guide-1' },
        savedAt,
      },
    });

    await softDeleteSavedGuideById(prisma as never, 'saved-1', savedAt);
    expect(prisma.savedGuide.update).toHaveBeenCalledWith({
      where: { id: 'saved-1' },
      data: { isDeleted: true, deletedAt: savedAt },
    });

    await softDeleteSavedGuidesByMarkerId(prisma as never, 'marker-1', savedAt);
    expect(prisma.savedGuide.updateMany).toHaveBeenCalledWith({
      where: { markerId: 'marker-1', isDeleted: false },
      data: { isDeleted: true, deletedAt: savedAt },
    });
  });
});
