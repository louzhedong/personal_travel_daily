import { describe, expect, it } from 'vitest';
import { buildAchievementShareCardFilename, buildAchievementShareCardSvg } from '../achievementShareCard';

describe('achievementShareCard', () => {
  const achievement = {
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
    evidence: [{ label: '2025 年', value: '有旅行记录' }],
    firstUnlockedAt: '2026-05-06T00:00:00.000Z',
  };

  it('builds the expected filename', () => {
    expect(buildAchievementShareCardFilename(achievement)).toBe('streak-consecutive-years-2-achievement-card.svg');
  });

  it('builds an svg share card with the key fields', () => {
    const svg = buildAchievementShareCardSvg(achievement, 'Voyage Atlas');

    expect(svg).toContain('连续两年都在路上');
    expect(svg).toContain('Voyage Atlas');
    expect(svg).toContain('史诗');
    expect(svg).toContain('2025 年');
    expect(svg).toContain('私有成就分享卡');
  });
});
