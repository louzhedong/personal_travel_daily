import { describe, expect, it } from 'vitest';
import {
  buildAchievementCollection,
  buildAchievementPageSummary,
  filterAchievementCollection,
  getAchievementPeriodLabel,
  groupAchievementsByGroup,
} from '../achievementsPageModel';

describe('achievementsPageModel', () => {
  const overview = {
    achievements: [
      {
        id: 'city-explorer',
        title: '城市探索者',
        description: '覆盖 5 座不同城市。',
        category: 'footprint' as const,
        group: 'footprint' as const,
        periodType: 'global' as const,
        rarity: 'common' as const,
        status: 'close' as const,
        progressValue: 4,
        progressTarget: 5,
        unit: '座城市',
      },
      {
        id: 'streak-consecutive-years-2',
        title: '连续两年都在路上',
        description: '连续 2 年都有旅行记录。',
        category: 'rhythm' as const,
        group: 'streak' as const,
        periodType: 'streak' as const,
        rarity: 'epic' as const,
        status: 'unlocked' as const,
        progressValue: 2,
        progressTarget: 2,
        unit: '年连续记录',
        streakYears: ['2025', '2026'],
      },
    ],
  } as const;

  const annualReviews = [
    {
      achievements: [
        {
          id: 'annual-2026-travel-days',
          title: '年度出发王',
          description: '这一年旅行天数达到 20 天。',
          category: 'rhythm' as const,
          group: 'annual' as const,
          periodType: 'annual' as const,
          rarity: 'rare' as const,
          status: 'locked' as const,
          progressValue: 4,
          progressTarget: 20,
          unit: '天',
        },
      ],
    },
  ] as const;

  it('builds and groups the combined achievement collection', () => {
    const collection = buildAchievementCollection(overview as never, annualReviews as never);

    expect(collection.map((item) => item.id)).toEqual([
      'city-explorer',
      'annual-2026-travel-days',
      'streak-consecutive-years-2',
    ]);
    expect(groupAchievementsByGroup(collection).map((item) => item.group)).toEqual(['footprint', 'annual', 'streak']);
  });

  it('filters and summarizes the collection', () => {
    const collection = buildAchievementCollection(overview as never, annualReviews as never);
    const filtered = filterAchievementCollection(collection, {
      group: 'annual',
      rarity: 'all',
      status: 'all',
    });

    expect(filtered).toHaveLength(1);
    expect(buildAchievementPageSummary(collection)).toEqual({
      total: 3,
      unlocked: 1,
      annual: 1,
      rareAndAbove: 2,
    });
  });

  it('formats period labels for annual and streak achievements', () => {
    expect(
      getAchievementPeriodLabel({
        ...overview.achievements[1],
        streakYears: [...overview.achievements[1].streakYears],
      }),
    ).toBe('连续年份：2025 / 2026');
    expect(
      getAchievementPeriodLabel({
        ...annualReviews[0].achievements[0],
      }),
    ).toBe('2026 年限定');
  });
});
