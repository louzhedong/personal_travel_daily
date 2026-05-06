// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { buildAnnualAchievements, buildStreakAchievements } from '../appApi/services/stats/aggregator.js';

describe('stats aggregator achievements', () => {
  const markers = [
    {
      id: 'marker-1',
      accountId: 'acct-1',
      companionId: 'user-alice',
      tripId: null,
      scope: 'domestic' as const,
      scopeId: 'bj',
      scopeName: '北京',
      city: '北京',
      note: '',
      visitedStartAt: new Date('2024-05-01T00:00:00.000Z'),
      visitedEndAt: new Date('2024-05-01T00:00:00.000Z'),
      createdAt: new Date('2024-05-01T00:00:00.000Z'),
      updatedAt: new Date('2024-05-01T00:00:00.000Z'),
      isDeleted: false,
      images: [],
      savedGuides: [],
      tags: ['citywalk'] as const,
    },
    {
      id: 'marker-2',
      accountId: 'acct-1',
      companionId: 'user-bob',
      tripId: null,
      scope: 'international' as const,
      scopeId: 'jp-tokyo',
      scopeName: '东京',
      city: '东京',
      note: '',
      visitedStartAt: new Date('2025-05-01T00:00:00.000Z'),
      visitedEndAt: new Date('2025-05-01T00:00:00.000Z'),
      createdAt: new Date('2025-05-01T00:00:00.000Z'),
      updatedAt: new Date('2025-05-01T00:00:00.000Z'),
      isDeleted: false,
      images: [],
      savedGuides: [],
      tags: ['citywalk'] as const,
    },
    {
      id: 'marker-3',
      accountId: 'acct-1',
      companionId: 'user-bob',
      tripId: null,
      scope: 'international' as const,
      scopeId: 'kr-seoul',
      scopeName: '首尔',
      city: '首尔',
      note: '',
      visitedStartAt: new Date('2026-05-01T00:00:00.000Z'),
      visitedEndAt: new Date('2026-05-01T00:00:00.000Z'),
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
      updatedAt: new Date('2026-05-01T00:00:00.000Z'),
      isDeleted: false,
      images: [],
      savedGuides: [],
      tags: ['citywalk'] as const,
    },
  ];

  it('builds streak achievements with streak years and rarity', () => {
    const achievements = buildStreakAchievements(markers as never);

    expect(achievements).toHaveLength(2);
    expect(achievements[0]).toMatchObject({
      id: 'streak-consecutive-years-2',
      periodType: 'streak',
      group: 'streak',
      rarity: 'epic',
      status: 'unlocked',
      streakYears: ['2024', '2025', '2026'],
    });
    expect(achievements[1]).toMatchObject({
      id: 'streak-consecutive-years-3',
      rarity: 'legendary',
      status: 'unlocked',
    });
  });

  it('builds the expanded annual achievements', () => {
    const achievements = buildAnnualAchievements('2026', markers.filter((marker) => marker.visitedStartAt.getUTCFullYear() === 2026) as never);

    expect(achievements).toHaveLength(6);
    expect(achievements.every((achievement) => achievement.periodType === 'annual')).toBe(true);
    expect(achievements.some((achievement) => achievement.id === 'annual-2026-country-collector')).toBe(true);
    expect(achievements.some((achievement) => achievement.id === 'annual-2026-long-trip')).toBe(true);
    expect(achievements.some((achievement) => achievement.id === 'annual-2026-citywalk-lover')).toBe(true);
  });
});
