import { getResourceBaseUrl, httpClient } from './httpClient';
import type {
  AnnualReviewResponseDto,
  StatsMarkerBudgetFilterDto,
  StatsMarkerMoodFilterDto,
  StatsMarkerTagFilterDto,
  StatsMarkerTransportFilterDto,
  StatsMarkerWeatherFilterDto,
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
  tag?: StatsMarkerTagFilterDto;
  mood?: StatsMarkerMoodFilterDto;
  weather?: StatsMarkerWeatherFilterDto;
  transport?: StatsMarkerTransportFilterDto;
  budgetLevel?: StatsMarkerBudgetFilterDto;
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
  if (query.tag && query.tag !== 'all') {
    params.set('tag', query.tag);
  }
  if (query.mood && query.mood !== 'all') {
    params.set('mood', query.mood);
  }
  if (query.weather && query.weather !== 'all') {
    params.set('weather', query.weather);
  }
  if (query.transport && query.transport !== 'all') {
    params.set('transport', query.transport);
  }
  if (query.budgetLevel && query.budgetLevel !== 'all') {
    params.set('budgetLevel', query.budgetLevel);
  }

  const suffix = params.toString();
  const path = suffix ? `/stats/overview?${suffix}` : '/stats/overview';
  return httpClient.get<StatsOverviewResponseDto>(statsBaseUrl, path);
}

export function fetchAnnualReview(year: string) {
  const params = new URLSearchParams({ year });
  return httpClient.get<AnnualReviewResponseDto>(statsBaseUrl, `/stats/annual-review?${params.toString()}`);
}
