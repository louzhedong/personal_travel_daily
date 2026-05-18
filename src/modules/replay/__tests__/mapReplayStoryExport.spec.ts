import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMapReplayStoryLongImageSvg, exportMapReplayStoryLongImage } from '../mapReplayStoryExport';
import type { MapReplayStoryResponseDto } from '../../../lib/api/types';

const data: MapReplayStoryResponseDto = {
  target: { type: 'trip', id: 'trip-1', label: '江南春游' },
  summary: {
    markerCount: 1,
    travelDays: 1,
    cityCount: 1,
    regionCount: 1,
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
  photos: [{ imageId: 'image-1', markerId: 'marker-1', imageUrl: 'https://example.com/a.jpg', title: '杭州', caption: '西湖', visitedStartAt: '2026-05-01' }],
  guides: [],
  chapters: [{ id: 'opening', eyebrow: 'Opening', title: '开场', body: '西湖晚风很好。' }],
  exportModel: { filenameSlug: 'trip-trip-1', posterTitle: '江南春游 地图回放故事', posterSubtitle: '1 段记录', routeTitle: '浙江 · 杭州' },
  sourceLinks: [],
  emptyStates: [],
  generatedAt: '2026-05-12T00:00:00.000Z',
};

describe('mapReplayStoryExport', () => {
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  const originalClick = HTMLAnchorElement.prototype.click;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:map-replay-story');
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    HTMLAnchorElement.prototype.click = originalClick;
  });

  it('builds and downloads a replay story svg', () => {
    const svg = buildMapReplayStoryLongImageSvg(data);

    expect(svg).toContain('MAP REPLAY STORY');
    expect(svg).toContain('江南春游 地图回放故事');
    expect(svg).toContain('https://example.com/a.jpg');

    exportMapReplayStoryLongImage(data);
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
  });
});
