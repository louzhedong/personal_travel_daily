import type { AnnualReviewResponseDto, StatsAchievementDto, StatsOverviewResponseDto } from '../../lib/api/types';

export const ACHIEVEMENT_CATEGORY_LABELS: Record<StatsAchievementDto['category'], string> = {
  footprint: '足迹',
  rhythm: '节奏',
  companion: '同行',
  content: '内容',
  style: '风格',
};

export const ACHIEVEMENT_GROUP_LABELS: Record<StatsAchievementDto['group'], string> = {
  footprint: '足迹成就',
  rhythm: '节奏成就',
  companion: '同行成就',
  content: '内容成就',
  style: '风格成就',
  annual: '年度限定',
  streak: '连续记录',
};

export const ACHIEVEMENT_STATUS_LABELS: Record<StatsAchievementDto['status'], string> = {
  unlocked: '已达成',
  close: '接近达成',
  locked: '未达成',
};

export const ACHIEVEMENT_RARITY_LABELS: Record<StatsAchievementDto['rarity'], string> = {
  common: '常见',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const GROUP_ORDER: Record<StatsAchievementDto['group'], number> = {
  footprint: 0,
  rhythm: 1,
  companion: 2,
  content: 3,
  style: 4,
  annual: 5,
  streak: 6,
};

const STATUS_ORDER: Record<StatsAchievementDto['status'], number> = {
  unlocked: 0,
  close: 1,
  locked: 2,
};

const RARITY_ORDER: Record<StatsAchievementDto['rarity'], number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  common: 3,
};

export interface AchievementPageFilters {
  group: StatsAchievementDto['group'] | 'all';
  rarity: StatsAchievementDto['rarity'] | 'all';
  status: StatsAchievementDto['status'] | 'all';
}

export function createDefaultAchievementPageFilters(): AchievementPageFilters {
  return {
    group: 'all',
    rarity: 'all',
    status: 'all',
  };
}

export function getAchievementProgress(achievement: StatsAchievementDto) {
  if (achievement.progressTarget <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((achievement.progressValue / achievement.progressTarget) * 100));
}

export function getAchievementPeriodLabel(achievement: StatsAchievementDto) {
  if (achievement.periodType === 'streak') {
    return achievement.streakYears?.length ? `连续年份：${achievement.streakYears.join(' / ')}` : '连续年度记录';
  }
  if (achievement.periodType === 'annual') {
    const yearMatch = achievement.id.match(/^annual-(\d{4})-/);
    return yearMatch ? `${yearMatch[1]} 年限定` : '年度限定';
  }
  return '账号总成就';
}

export function buildAchievementCollection(
  overview: StatsOverviewResponseDto,
  annualReviews: AnnualReviewResponseDto[],
): StatsAchievementDto[] {
  return [...overview.achievements, ...annualReviews.flatMap((review) => review.achievements)].sort((left, right) => {
    const groupOrderDiff = GROUP_ORDER[left.group] - GROUP_ORDER[right.group];
    if (groupOrderDiff !== 0) {
      return groupOrderDiff;
    }

    const statusOrderDiff = STATUS_ORDER[left.status] - STATUS_ORDER[right.status];
    if (statusOrderDiff !== 0) {
      return statusOrderDiff;
    }

    const rarityOrderDiff = RARITY_ORDER[left.rarity] - RARITY_ORDER[right.rarity];
    if (rarityOrderDiff !== 0) {
      return rarityOrderDiff;
    }

    if (left.periodType === 'annual' && right.periodType === 'annual') {
      return right.id.localeCompare(left.id);
    }

    return left.title.localeCompare(right.title, 'zh-CN');
  });
}

export function filterAchievementCollection(
  achievements: StatsAchievementDto[],
  filters: AchievementPageFilters,
): StatsAchievementDto[] {
  return achievements.filter((achievement) => {
    if (filters.group !== 'all' && achievement.group !== filters.group) {
      return false;
    }
    if (filters.rarity !== 'all' && achievement.rarity !== filters.rarity) {
      return false;
    }
    if (filters.status !== 'all' && achievement.status !== filters.status) {
      return false;
    }
    return true;
  });
}

export function groupAchievementsByGroup(achievements: StatsAchievementDto[]) {
  return Object.entries(
    achievements.reduce<Record<string, StatsAchievementDto[]>>((result, achievement) => {
      const current = result[achievement.group] ?? [];
      current.push(achievement);
      result[achievement.group] = current;
      return result;
    }, {}),
  )
    .map(([group, items]) => ({
      group: group as StatsAchievementDto['group'],
      label: ACHIEVEMENT_GROUP_LABELS[group as StatsAchievementDto['group']],
      items,
    }))
    .sort((left, right) => GROUP_ORDER[left.group] - GROUP_ORDER[right.group]);
}

export function buildAchievementPageSummary(achievements: StatsAchievementDto[]) {
  return {
    total: achievements.length,
    unlocked: achievements.filter((achievement) => achievement.status === 'unlocked').length,
    annual: achievements.filter((achievement) => achievement.periodType === 'annual').length,
    rareAndAbove: achievements.filter((achievement) => achievement.rarity !== 'common').length,
  };
}
