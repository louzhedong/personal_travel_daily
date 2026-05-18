// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { serializeMapReplayStory } from '../appApi/serializers/mapReplayStorySerializer.js';

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
  tags: [],
  mood: null,
  weather: null,
  transport: null,
  budgetLevel: null,
  isDeleted: false,
  visitedStartAt: new Date('2026-03-02T00:00:00.000Z'),
  visitedEndAt: new Date('2026-03-02T00:00:00.000Z'),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  companion,
  images: [{ id: 'image-1', markerId: 'marker-1', imageUrl: 'https://example.com/a.jpg', sortOrder: 0, isFeatured: true, caption: '西湖', curatedSortOrder: null, createdAt: new Date() }],
  savedGuides: [{ id: 'guide-1', title: '杭州攻略', summary: '西湖路线', sourceName: 'Qyer', sourceUrl: 'https://example.com', markerId: 'marker-1', savedByUserId: 'user-alice', keyword: '杭州', savedAt: new Date(), isDeleted: false, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, guideIdentity: null, guideSourceName: null, guideSourceUrl: null, guideDocument: null }],
};

describe('mapReplayStorySerializer', () => {
  it('serializes replay, places, photos and guide excerpts', () => {
    const result = serializeMapReplayStory({
      target: { type: 'trip', id: 'trip-1', label: '江南春游' },
      markers: [marker],
      companions: [companion],
      trips: [trip],
      sourceLinks: [{ label: '打开行程故事', path: '/trips/trip-1/story' }],
      generatedAt: new Date('2026-05-12T00:00:00.000Z'),
    });

    expect(result.summary.markerCount).toBe(1);
    expect(result.replay[0]).toMatchObject({ title: '浙江省 · 杭州', visitedStartAt: '2026-03-02' });
    expect(result.photos[0]).toMatchObject({ imageId: 'image-1', caption: '西湖' });
    expect(result.guides[0]).toMatchObject({ title: '杭州攻略', sourceName: 'Qyer' });
    expect(result.exportModel.filenameSlug).toBe('trip-trip-1');
  });
});
