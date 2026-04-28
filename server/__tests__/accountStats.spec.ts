// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { buildAdminAccountStats } from '../appApi/services/admin/accountStats.js';

describe('accountStats', () => {
  it('aggregates companion level counts into account stats', () => {
    expect(
      buildAdminAccountStats({
        tripCount: 3,
        markerSearchEventCount: 5,
        companions: [
          {
            id: 'u1',
            name: '小悠',
            color: '#2563eb',
            createdAt: '2026-04-01T00:00:00.000Z',
            markers: [{ id: 'm1' }, { id: 'm2' }],
            savedGuides: [{ id: 'g1' }],
            guideSearchHistory: [{ id: 'h1' }, { id: 'h2' }],
          },
          {
            id: 'u2',
            name: '阿泽',
            color: '#f97316',
            createdAt: '2026-04-01T00:00:00.000Z',
            markers: [{ id: 'm3' }],
            savedGuides: [{ id: 'g2' }, { id: 'g3' }],
            guideSearchHistory: [],
          },
        ] as never,
      }),
    ).toEqual({
      tripCount: 3,
      companionCount: 2,
      markerCount: 3,
      savedGuideCount: 3,
      guideSearchHistoryCount: 2,
      markerSearchEventCount: 5,
    });
  });

  it('returns zero aggregates when there are no companions', () => {
    expect(
      buildAdminAccountStats({
        tripCount: 0,
        markerSearchEventCount: 0,
        companions: [],
      }),
    ).toEqual({
      tripCount: 0,
      companionCount: 0,
      markerCount: 0,
      savedGuideCount: 0,
      guideSearchHistoryCount: 0,
      markerSearchEventCount: 0,
    });
  });
});
