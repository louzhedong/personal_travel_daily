// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { normalizeMemoryCapsuleConfig, serializeMemoryCapsuleSummary } from '../appApi/serializers/memoryCapsuleSerializer.js';
import type { MemoryCapsuleContentDto } from '../appApi/types.js';

const content: MemoryCapsuleContentDto = {
  hero: { eyebrow: 'Trip Capsule', title: '江南春游', coverImageUrl: 'https://example.com/a.jpg' },
  metrics: [],
  badges: [{ id: 'route', label: '路线', value: '2 城', description: '路线摘要' }],
  sections: [{ id: 'brief', eyebrow: 'Brief', title: '序言', body: '慢游江南', enabled: true, sortOrder: 0 }],
  route: [],
  timeline: [],
  photos: [{ imageId: 'image-1', imageUrl: 'https://example.com/a.jpg', title: '杭州' }],
  guides: [],
  checklist: [],
  achievements: [],
  sourceLinks: [],
  emptyStates: [],
};

describe('memoryCapsuleSerializer', () => {
  it('normalizes missing config from content', () => {
    const config = normalizeMemoryCapsuleConfig(null, content);

    expect(config.exportPreset).toBe('balanced');
    expect(config.coverImageId).toBe('image-1');
    expect(config.sections[0]).toMatchObject({ id: 'brief', enabled: true });
  });

  it('serializes capsule summary with derived target label and cover', () => {
    const summary = serializeMemoryCapsuleSummary(
      {
        id: 'capsule-1',
        accountId: 'acct-1',
        type: 'trip',
        targetId: 'trip-1',
        title: '江南春游',
        subtitle: null,
        template: 'editorial',
        status: 'draft',
        configJson: {},
        createdAt: new Date('2026-05-11T00:00:00.000Z'),
        updatedAt: new Date('2026-05-12T00:00:00.000Z'),
        archivedAt: null,
      },
      content,
    );

    expect(summary.targetLabel).toBe('江南春游');
    expect(summary.coverImageUrl).toBe('https://example.com/a.jpg');
  });
});
