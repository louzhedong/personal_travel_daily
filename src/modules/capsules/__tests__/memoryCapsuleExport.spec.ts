import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildMemoryCapsuleLongImageSvg,
  buildMemoryCapsuleShareCardSvg,
  exportMemoryCapsuleArchivePackage,
} from '../memoryCapsuleExport';
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

function readBlobAsText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsText(blob);
  });
}

describe('memoryCapsuleExport', () => {
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  const originalClick = HTMLAnchorElement.prototype.click;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:capsule-archive');
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    HTMLAnchorElement.prototype.click = originalClick;
  });

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

  it('exports a browser local archive package with manifest and capsule assets', async () => {
    const blob = exportMemoryCapsuleArchivePackage(detail);
    const zipText = await readBlobAsText(blob);

    expect(blob.type).toBe('application/zip');
    expect(zipText).toContain('manifest.json');
    expect(zipText).toContain('content/capsule.json');
    expect(zipText).toContain('exports/capsule-long-image.svg');
    expect(zipText).toContain('https://example.com/a.jpg');
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
  });
});
