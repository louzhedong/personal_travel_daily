// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  randomUUIDMock: vi.fn(),
  getPrismaClientMock: vi.fn(),
  findCompanionMemorySnapshotMock: vi.fn(),
  findCompanionMemorySourceMock: vi.fn(),
  upsertCompanionMemorySnapshotMock: vi.fn(),
}));

vi.mock('node:crypto', () => ({
  randomUUID: mocks.randomUUIDMock,
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/companionMemoryRepository.js', () => ({
  findCompanionMemorySnapshot: mocks.findCompanionMemorySnapshotMock,
  findCompanionMemorySource: mocks.findCompanionMemorySourceMock,
  upsertCompanionMemorySnapshot: mocks.upsertCompanionMemorySnapshotMock,
}));

import { getCompanionMemory, refreshCompanionMemory } from '../appApi/services/companionMemoryService.js';

const prisma = {};

function buildSource() {
  const trip = {
    id: 'trip-1',
    name: '京都春日',
    startsAt: new Date('2026-04-01T00:00:00.000Z'),
    endsAt: new Date('2026-04-04T00:00:00.000Z'),
    coverImageUrl: undefined,
    note: '一起看樱花',
    isDeleted: false,
  };

  return {
    id: 'companion-1',
    accountId: 'acct-1',
    name: '小悠',
    color: '#f97316',
    markers: [
      {
        id: 'marker-1',
        accountId: 'acct-1',
        companionId: 'companion-1',
        tripId: 'trip-1',
        scope: 'international',
        scopeId: 'jp-kyoto',
        scopeName: '日本',
        city: '京都',
        note: '鸭川边散步',
        tags: ['citywalk', 'photography'],
        mood: 'peaceful',
        weather: 'sunny',
        transport: 'walk',
        budgetLevel: 'medium',
        visitedStartAt: new Date('2026-04-01T00:00:00.000Z'),
        visitedEndAt: new Date('2026-04-02T00:00:00.000Z'),
        createdAt: new Date('2026-04-02T00:00:00.000Z'),
        trip,
        images: [
          {
            id: 'image-1',
            imageUrl: 'https://example.com/kyoto.jpg',
            sortOrder: 0,
            isFeatured: true,
            caption: '鸭川黄昏',
            curatedSortOrder: 0,
          },
        ],
        savedGuides: [
          {
            id: 'guide-1',
            markerId: 'marker-1',
            saveContextKey: 'marker-1',
            keyword: '京都',
            guideIdentity: 'kyoto-guide',
            guideTitle: '京都赏樱路线',
            guideSummary: '适合慢走的路线。',
            guideSourceName: '示例来源',
            guideSourceUrl: 'https://example.com/guide',
            guideCoverImageUrl: undefined,
            savedAt: new Date('2026-03-28T00:00:00.000Z'),
          },
        ],
      },
    ],
    guides: [],
  };
}

describe('companionMemoryService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getPrismaClientMock.mockReturnValue(prisma);
    mocks.randomUUIDMock.mockReturnValue('snapshot-uuid');
  });

  it('returns a valid snapshot without rebuilding', async () => {
    const payload = {
      companion: { id: 'companion-1', name: '小悠', color: '#f97316' },
      summary: {
        markerCount: 1,
        travelDays: 2,
        tripCount: 1,
        cityCount: 1,
        regionCount: 1,
        photoCount: 1,
        guideCount: 1,
        firstSharedAt: '2026-04-01',
        latestSharedAt: '2026-04-01',
        headline: '你们一起留下了 1 段旅行记忆，最常出现的地方是京都。',
      },
      yearlySeries: [],
      topRegions: [],
      topCities: [],
      themes: [],
      trips: [],
      photos: [],
      guides: [],
      milestones: [],
      snapshot: {
        generatedAt: '2026-05-01T00:00:00.000Z',
        expiresAt: '2999-05-02T00:00:00.000Z',
        stale: false,
        sourceMarkerCount: 1,
        sourcePhotoCount: 1,
        sourceGuideCount: 1,
      },
    };
    mocks.findCompanionMemorySnapshotMock.mockResolvedValue({
      snapshotVersion: 1,
      payloadJson: payload,
      generatedAt: new Date('2026-05-01T00:00:00.000Z'),
      expiresAt: new Date('2999-05-02T00:00:00.000Z'),
      sourceMarkerCount: 1,
      sourcePhotoCount: 1,
      sourceGuideCount: 1,
    });

    const result = await getCompanionMemory('acct-1', 'companion-1');

    expect(result.companion.name).toBe('小悠');
    expect(mocks.findCompanionMemorySourceMock).not.toHaveBeenCalled();
    expect(mocks.upsertCompanionMemorySnapshotMock).not.toHaveBeenCalled();
  });

  it('rebuilds and stores a snapshot when missing', async () => {
    mocks.findCompanionMemorySnapshotMock.mockResolvedValue(null);
    mocks.findCompanionMemorySourceMock.mockResolvedValue(buildSource());

    const result = await getCompanionMemory('acct-1', 'companion-1');

    expect(result.summary.markerCount).toBe(1);
    expect(result.summary.headline).toContain('京都');
    expect(result.photos[0]?.caption).toBe('鸭川黄昏');
    expect(mocks.upsertCompanionMemorySnapshotMock).toHaveBeenCalledWith(prisma, expect.objectContaining({
      id: 'snapshot-uuid',
      accountId: 'acct-1',
      companionId: 'companion-1',
      snapshotVersion: 1,
      sourceMarkerCount: 1,
      sourcePhotoCount: 1,
      sourceGuideCount: 1,
    }));
  });

  it('forces rebuild on manual refresh', async () => {
    mocks.findCompanionMemorySourceMock.mockResolvedValue(buildSource());

    await refreshCompanionMemory('acct-1', 'companion-1');

    expect(mocks.findCompanionMemorySnapshotMock).not.toHaveBeenCalled();
    expect(mocks.upsertCompanionMemorySnapshotMock).toHaveBeenCalled();
  });

  it('throws not found when the companion does not belong to the account', async () => {
    mocks.findCompanionMemorySnapshotMock.mockResolvedValue(null);
    mocks.findCompanionMemorySourceMock.mockResolvedValue(null);

    await expect(getCompanionMemory('acct-1', 'missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
