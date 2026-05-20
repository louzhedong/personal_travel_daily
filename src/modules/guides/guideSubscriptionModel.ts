import type { GuideSubscriptionDto } from '../../lib/api/types';

export function getGuideSubscriptionLabel(item: GuideSubscriptionDto) {
  return item.kind === 'rss' ? 'RSS 源' : item.kind === 'destination' ? '目的地' : item.kind === 'source' ? '来源' : '关键词';
}
