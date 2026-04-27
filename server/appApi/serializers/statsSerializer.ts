import type { StatsOverviewResponseDto } from '../types.js';

export interface StatsOverviewModel {
  filters: {
    year: string | 'all';
    scope: 'all' | 'domestic' | 'international';
    companionId?: string;
    tripId?: string | 'unassigned';
    tag?: StatsOverviewResponseDto['filters']['tag'];
    mood?: StatsOverviewResponseDto['filters']['mood'];
    weather?: StatsOverviewResponseDto['filters']['weather'];
    transport?: StatsOverviewResponseDto['filters']['transport'];
    budgetLevel?: StatsOverviewResponseDto['filters']['budgetLevel'];
  };
  availableYears: string[];
  companions: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  trips: Array<{
    id: string;
    name: string;
    startsAt: Date;
    endsAt: Date;
  }>;
  summary: StatsOverviewResponseDto['summary'];
  yearlySeries: Array<{
    year: string;
    markerCount: number;
    travelDays: number;
  }>;
  monthlyDistribution: Array<{
    month: string;
    markerCount: number;
    travelDays: number;
  }>;
  topRegions: StatsOverviewResponseDto['topRegions'];
  topCities: StatsOverviewResponseDto['topCities'];
  companionRanking: StatsOverviewResponseDto['companionRanking'];
  tripRanking: Array<{
    tripId: string;
    tripName: string;
    markerCount: number;
    travelDays: number;
    startsAt: Date;
    endsAt: Date;
  }>;
  tripDetails: Array<{
    tripId: string;
    tripName: string;
    markerCount: number;
    travelDays: number;
    startsAt: Date;
    endsAt: Date;
    coverImageUrl?: string;
    note: string;
  }>;
  topTags: StatsOverviewResponseDto['topTags'];
  topMoods: StatsOverviewResponseDto['topMoods'];
  topWeather: StatsOverviewResponseDto['topWeather'];
  topTransports: StatsOverviewResponseDto['topTransports'];
  topBudgetLevels: StatsOverviewResponseDto['topBudgetLevels'];
  tripHighlights: StatsOverviewResponseDto['tripHighlights'];
  heatmap: StatsOverviewResponseDto['heatmap'];
  generatedAt: Date;
}

function toDateOnlyString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toIsoString(value: Date) {
  return value.toISOString();
}

export function serializeStatsOverview(model: StatsOverviewModel): StatsOverviewResponseDto {
  return {
    filters: model.filters,
    availableYears: model.availableYears,
    companions: model.companions,
    trips: model.trips.map((trip) => ({
      id: trip.id,
      name: trip.name,
      startsAt: toDateOnlyString(trip.startsAt),
      endsAt: toDateOnlyString(trip.endsAt),
    })),
    summary: model.summary,
    yearlySeries: model.yearlySeries,
    monthlyDistribution: model.monthlyDistribution,
    topRegions: model.topRegions,
    topCities: model.topCities,
    companionRanking: model.companionRanking,
    tripRanking: model.tripRanking.map((trip) => ({
      ...trip,
      startsAt: toDateOnlyString(trip.startsAt),
      endsAt: toDateOnlyString(trip.endsAt),
    })),
    tripDetails: model.tripDetails.map((trip) => ({
      ...trip,
      startsAt: toDateOnlyString(trip.startsAt),
      endsAt: toDateOnlyString(trip.endsAt),
    })),
    topTags: model.topTags,
    topMoods: model.topMoods,
    topWeather: model.topWeather,
    topTransports: model.topTransports,
    topBudgetLevels: model.topBudgetLevels,
    tripHighlights: model.tripHighlights,
    heatmap: model.heatmap,
    generatedAt: toIsoString(model.generatedAt),
  };
}
