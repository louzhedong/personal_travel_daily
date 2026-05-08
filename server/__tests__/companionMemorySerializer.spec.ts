// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  parseCompanionMemorySnapshotPayload,
  serializeCompanionMemory,
  type CompanionMemoryModel,
} from '../appApi/serializers/companionMemorySerializer.js';

describe('companionMemorySerializer', () => {
  it('serializes date fields and snapshot metadata', () => {
    const model: CompanionMemoryModel = {
      companion: { id: 'companion-1', name: '小悠', color: '#f97316' },
      summary: {
        markerCount: 1,
        travelDays: 2,
        tripCount: 1,
        cityCount: 1,
        regionCount: 1,
        photoCount: 1,
        guideCount: 1,
        firstSharedAt: new Date('2026-04-01T00:00:00.000Z'),
        latestSharedAt: new Date('2026-04-02T00:00:00.000Z'),
        headline: '你们一起留下了 1 段旅行记忆。',
      },
      yearlySeries: [{ year: '2026', markerCount: 1, travelDays: 2, photoCount: 1 }],
      topRegions: [],
      topCities: [],
      themes: [],
      trips: [
        {
          tripId: 'trip-1',
          tripName: '京都春日',
          startsAt: new Date('2026-04-01T00:00:00.000Z'),
          endsAt: new Date('2026-04-04T00:00:00.000Z'),
          note: '一起看樱花',
          markerCount: 1,
          photoCount: 1,
        },
      ],
      photos: [
        {
          imageId: 'image-1',
          markerId: 'marker-1',
          imageUrl: 'https://example.com/photo.jpg',
          markerTitle: '日本 · 京都',
          scopeName: '日本',
          city: '京都',
          visitedStartAt: new Date('2026-04-01T00:00:00.000Z'),
          isFeatured: true,
        },
      ],
      guides: [
        {
          id: 'guide-1',
          keyword: '京都',
          title: '京都赏樱路线',
          summary: '适合慢走的路线。',
          sourceName: '示例来源',
          sourceUrl: 'https://example.com/guide',
          savedAt: new Date('2026-03-28T00:00:00.000Z'),
        },
      ],
      milestones: [
        {
          id: 'first',
          title: '第一段共同记忆',
          description: '从京都开始。',
          happenedAt: new Date('2026-04-01T00:00:00.000Z'),
        },
      ],
      snapshot: {
        generatedAt: new Date('2026-05-08T00:00:00.000Z'),
        expiresAt: new Date('2026-05-09T00:00:00.000Z'),
        stale: false,
        sourceMarkerCount: 1,
        sourcePhotoCount: 1,
        sourceGuideCount: 1,
      },
    };

    const result = serializeCompanionMemory(model);

    expect(result.summary.firstSharedAt).toBe('2026-04-01');
    expect(result.trips[0]?.startsAt).toBe('2026-04-01');
    expect(result.guides[0]?.savedAt).toBe('2026-03-28T00:00:00.000Z');
    expect(result.snapshot.generatedAt).toBe('2026-05-08T00:00:00.000Z');
  });

  it('rejects invalid snapshot payloads', () => {
    expect(parseCompanionMemorySnapshotPayload(null)).toBeNull();
    expect(parseCompanionMemorySnapshotPayload({ companion: {}, summary: {} })).toBeNull();
  });
});
