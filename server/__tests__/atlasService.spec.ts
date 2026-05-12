// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAtlasTimeline } from '../appApi/services/atlasService.js';
import { getStatsOverviewSource } from '../appApi/repositories/statsRepository.js';

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: () => ({}),
}));

vi.mock('../appApi/repositories/statsRepository.js', () => ({
  getStatsOverviewSource: vi.fn(),
}));

const account = { id: 'acct-1', name: 'Voyage Atlas', username: 'demo', role: 'member' as const };
const companion = { id: 'user-alice', accountId: 'acct-1', name: 'Alice', color: '#0f172a', sortOrder: 0, isDeleted: false, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
const trip = { id: 'trip-1', accountId: 'acct-1', name: '江南春游', coverImageUrl: null, note: '', startsAt: new Date('2026-03-01T00:00:00.000Z'), endsAt: new Date('2026-03-03T00:00:00.000Z'), isDeleted: false, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
const marker = {
  id: 'marker-1',
  accountId: 'acct-1',
  companionId: 'user-alice',
  tripId: 'trip-1',
  scope: 'domestic' as const,
  scopeId: 'cn-zhejiang',
  scopeName: '浙江省',
  city: '杭州',
  note: '西湖晚风',
  tags: ['citywalk'],
  mood: 'relaxed',
  weather: 'sunny',
  transport: 'walk',
  budgetLevel: 'medium',
  isDeleted: false,
  visitedStartAt: new Date('2026-03-02T00:00:00.000Z'),
  visitedEndAt: new Date('2026-03-02T00:00:00.000Z'),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  companion,
  images: [{ id: 'image-1', markerId: 'marker-1', imageUrl: 'https://example.com/a.jpg', sortOrder: 0, isFeatured: true, caption: '西湖', curatedSortOrder: null, createdAt: new Date() }],
  savedGuides: [],
};

describe('atlasService', () => {
  beforeEach(() => {
    vi.mocked(getStatsOverviewSource).mockResolvedValue({ companions: [companion], trips: [trip], markers: [marker], markerSearchEvents: [] } as never);
  });

  it('builds replay, place index and compare data from filtered markers', async () => {
    const result = await getAtlasTimeline(account, { year: '2026', month: '03', scope: 'domestic' });

    expect(result.summary).toMatchObject({ markerCount: 1, cityCount: 1, photoCount: 1 });
    expect(result.replay[0]).toMatchObject({ title: '浙江省 · 杭州', visitedStartAt: '2026-03-02' });
    expect(result.placeIndex.regions[0]).toMatchObject({ scopeName: '浙江', markerCount: 1 });
    expect(result.compare.years[0]).toMatchObject({ year: '2026', markerCount: 1 });
  });

  it('returns a stable empty atlas for unmatched filters', async () => {
    const result = await getAtlasTimeline(account, { year: '2025', scope: 'all' });

    expect(result.summary.markerCount).toBe(0);
    expect(result.replay).toEqual([]);
    expect(result.placeIndex.regions).toEqual([]);
  });
});
