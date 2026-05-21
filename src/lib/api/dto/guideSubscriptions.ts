export type GuideSubscriptionKindDto = 'keyword' | 'source' | 'destination' | 'rss';
export type GuideSubscriptionRunStatusDto = 'success' | 'partial' | 'error';

export interface GuideSubscriptionDto {
  id: string;
  kind: GuideSubscriptionKindDto;
  title: string;
  keyword?: string;
  sourceName?: string;
  destination?: string;
  rssUrl?: string;
  enabled: boolean;
  lastRunAt?: string;
  createdAt: string;
}

export interface GuideSubscriptionItemDto {
  id: string;
  subscriptionId: string;
  title: string;
  sourceName?: string;
  sourceUrl: string;
  summary?: string;
  publishedAt?: string;
  firstSeenAt: string;
}

export interface GuideSubscriptionRunDto {
  id: string;
  subscriptionId: string;
  status: GuideSubscriptionRunStatusDto;
  matchedCount: number;
  errorMessage?: string;
  startedAt: string;
  finishedAt?: string;
}

export interface GuideSubscriptionsResponseDto {
  subscriptions: GuideSubscriptionDto[];
  recentItems: GuideSubscriptionItemDto[];
}

export interface CreateGuideSubscriptionInputDto {
  kind: GuideSubscriptionKindDto;
  title: string;
  keyword?: string;
  sourceName?: string;
  destination?: string;
  rssUrl?: string;
}

export interface UpdateGuideSubscriptionInputDto {
  title?: string;
  enabled?: boolean;
  keyword?: string | null;
  sourceName?: string | null;
  destination?: string | null;
  rssUrl?: string | null;
}

export interface GuideSubscriptionRunResponseDto {
  run: GuideSubscriptionRunDto;
  items: GuideSubscriptionItemDto[];
}
