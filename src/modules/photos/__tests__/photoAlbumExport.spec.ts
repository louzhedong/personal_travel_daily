import { describe, expect, it } from 'vitest';
import type { PhotoAlbumDto } from '../../../lib/api/types';
import { buildPhotoAlbumSvg } from '../photoAlbumExport';

const album: PhotoAlbumDto = {
  id: 'trip-cover-trip-1',
  kind: 'tripCover',
  targetKind: 'trip',
  targetId: 'trip-1',
  title: '杭州周末封面候选',
  subtitle: 'Story Studio 共用封面排序',
  metricLabel: '2 张照片',
  photoCount: 2,
  coverCandidates: [
    {
      imageId: 'image-1',
      imageUrl: 'https://example.com/hangzhou.jpg',
      markerId: 'marker-1',
      markerTitle: '浙江 · 杭州',
      tripId: 'trip-1',
      tripName: '杭州周末',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      scopeName: '浙江',
      city: '杭州',
      visitedStartAt: '2026-05-01T00:00:00.000Z',
      isFeatured: true,
      caption: '西湖晚风',
      score: 96,
      isPinned: true,
      issueKinds: [],
    },
  ],
};

describe('photoAlbumExport', () => {
  it('builds a local SVG album export payload', () => {
    const svg = buildPhotoAlbumSvg(album);

    expect(svg).toContain('<svg');
    expect(svg).toContain('SMART PHOTO ALBUM');
    expect(svg).toContain('杭州周末封面候选');
    expect(svg).toContain('https://example.com/hangzhou.jpg');
  });
});
