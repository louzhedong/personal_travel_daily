import type { HomeDashboardCardDto, HomeDashboardSuggestionDto } from '../../lib/api/types';

export function getDashboardToneLabel(tone: HomeDashboardSuggestionDto['tone']) {
  return tone === 'warning' ? '需要处理' : tone === 'success' ? '已就绪' : '建议';
}

export function orderDashboardCards(cards: HomeDashboardCardDto[]) {
  return [...cards].sort((left, right) => left.eyebrow.localeCompare(right.eyebrow, 'zh-CN'));
}
