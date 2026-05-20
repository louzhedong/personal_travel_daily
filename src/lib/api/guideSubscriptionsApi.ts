import { getResourceBaseUrl, httpClient } from './httpClient';
import type { CreateGuideSubscriptionInputDto, GuideSubscriptionRunResponseDto, GuideSubscriptionsResponseDto, UpdateGuideSubscriptionInputDto } from './types';

const baseUrl = getResourceBaseUrl();

export function fetchGuideSubscriptions() {
  return httpClient.get<GuideSubscriptionsResponseDto>(baseUrl, '/guide-subscriptions');
}

export function createGuideSubscription(input: CreateGuideSubscriptionInputDto) {
  return httpClient.post<{ subscription: GuideSubscriptionsResponseDto['subscriptions'][number] }>(baseUrl, '/guide-subscriptions', input);
}

export function updateGuideSubscription(id: string, input: UpdateGuideSubscriptionInputDto) {
  return httpClient.patch<{ subscription: GuideSubscriptionsResponseDto['subscriptions'][number] }>(baseUrl, `/guide-subscriptions/${encodeURIComponent(id)}`, input);
}

export function runGuideSubscription(id: string) {
  return httpClient.post<GuideSubscriptionRunResponseDto>(baseUrl, `/guide-subscriptions/${encodeURIComponent(id)}/run`);
}
