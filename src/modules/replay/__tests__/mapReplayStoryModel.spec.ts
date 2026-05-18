import { describe, expect, it } from 'vitest';
import {
  getMapReplayStoryCurrentItem,
  getMapReplayStoryFeaturedPhotos,
  getMapReplayStoryHeroText,
  getMapReplayStoryProgressText,
} from '../mapReplayStoryModel';
import type { MapReplayStoryResponseDto } from '../../../lib/api/types';

const data: MapReplayStoryResponseDto = {
  target: { type: 'trip', id: 'trip-1', label: '江南春游' },
  summary: {
    markerCount: 2,
    travelDays: 2,
    cityCount: 2,
    regionCount: 2,
    countryCount: 0,
    photoCount: 1,
    companionCount: 1,
    tripCount: 1,
  },
  replay: [
    {
      id: 'replay-1',
      order: 1,
      markerId: 'marker-1',
      title: '浙江 · 杭州',
      description: '西湖晚风',
      visitedStartAt: '2026-05-01',
      visitedEndAt: '2026-05-01',
      scope: 'domestic',
      scopeId: 'zj',
      scopeName: '浙江',
      city: '杭州',
      companion: { id: 'user-alice', name: 'Alice', color: '#0f172a' },
      metadata: { tags: [] },
    },
  ],
  placeIndex: { regions: [] },
  photos: [{ imageId: 'image-1', markerId: 'marker-1', imageUrl: 'https://example.com/a.jpg', title: '杭州', visitedStartAt: '2026-05-01' }],
  guides: [],
  chapters: [],
  exportModel: { filenameSlug: 'trip-trip-1', posterTitle: '江南春游 地图回放故事', posterSubtitle: '2 段记录', routeTitle: '浙江 · 杭州' },
  sourceLinks: [],
  emptyStates: [],
  generatedAt: '2026-05-12T00:00:00.000Z',
};

describe('mapReplayStoryModel', () => {
  it('builds progress, current item and hero copy', () => {
    expect(getMapReplayStoryProgressText(data, 0)).toBe('1 / 1');
    expect(getMapReplayStoryCurrentItem(data, 99)?.title).toBe('浙江 · 杭州');
    expect(getMapReplayStoryHeroText(data)).toBe('2 段记录 · 2 座城市 · 1 张照片');
    expect(getMapReplayStoryFeaturedPhotos(data)).toHaveLength(1);
  });
});
