import { getResourceBaseUrl, httpClient } from './httpClient';
import type {
  AnnualReviewResponseDto,
  StatsOverviewResponseDto,
  StatsScopeDto,
  StatsTripFilterDto,
} from './types';

const statsBaseUrl = getResourceBaseUrl();

export interface FetchStatsOverviewQuery {
  year?: string;
  scope?: StatsScopeDto;
  companionId?: string;
  tripId?: StatsTripFilterDto;
}

export function fetchStatsOverview(query: FetchStatsOverviewQuery = {}) {
  const params = new URLSearchParams();
  if (query.year && query.year !== 'all') {
    params.set('year', query.year);
  }
  if (query.scope && query.scope !== 'all') {
    params.set('scope', query.scope);
  }
  if (query.companionId) {
    params.set('companionId', query.companionId);
  }
  if (query.tripId) {
    params.set('tripId', query.tripId);
  }

  const suffix = params.toString();
  const path = suffix ? `/stats/overview?${suffix}` : '/stats/overview';
  return httpClient.get<StatsOverviewResponseDto>(statsBaseUrl, path);
}

export function fetchAnnualReview(year: string) {
  const params = new URLSearchParams({ year });
  return httpClient.get<AnnualReviewResponseDto>(statsBaseUrl, `/stats/annual-review?${params.toString()}`);
}
