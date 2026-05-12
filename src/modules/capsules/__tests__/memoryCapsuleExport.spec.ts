import { describe, expect, it } from 'vitest';
import { buildMemoryCapsuleLongImageSvg, buildMemoryCapsuleShareCardSvg } from '../memoryCapsuleExport';
import type { MemoryCapsuleDetailDto } from '../../../lib/api/types';

const detail: MemoryCapsuleDetailDto = {
  capsule: {
    id: 'capsule-1',
    type: 'trip',
    targetId: 'trip-1',
    targetLabel: '江南春游',
    title: '江南春游',
    template: 'editorial',
    status: 'draft',
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z',
  },
  config: { exportPreset: 'balanced', sections: [], photos: [], badges: [] },
  content: {
    hero: { eyebrow: 'Trip Capsule', title: '江南春游', subtitle: '慢游江南', coverImageUrl: 'https://example.com/a.jpg' },
    metrics: [{ label: '旅行天数', value: '3' }],
    badges: [],
    sections: [{ id: 'brief', eyebrow: 'Brief', title: '序言', body: '西湖晚风很好。', enabled: true, sortOrder: 0 }],
    route: [],
    timeline: [],
    photos: [{ imageId: 'image-1', imageUrl: 'https://example.com/a.jpg', title: '杭州', caption: '西湖晚风' }],
    guides: [],
    checklist: [],
    achievements: [],
    sourceLinks: [],
    emptyStates: [],
  },
};

describe('memoryCapsuleExport', () => {
  it('builds a long image svg with capsule sections and photos', () => {
    const svg = buildMemoryCapsuleLongImageSvg(detail);

    expect(svg).toContain('TRAVEL CAPSULE');
    expect(svg).toContain('江南春游');
    expect(svg).toContain('https://example.com/a.jpg');
  });

  it('builds square and story share cards with different canvas heights', () => {
    expect(buildMemoryCapsuleShareCardSvg(detail, 'square')).toContain('height="1080"');
    expect(buildMemoryCapsuleShareCardSvg(detail, 'story')).toContain('height="1920"');
  });
});
