import type {
  MarkerBudgetLevel,
  MarkerMood,
  MarkerTag,
  MarkerTransport,
  MarkerWeather,
} from '../../../shared/markerMetadata.js';
import type { Scope } from './common.js';
import type { TripExpenseCategorySummaryDto, TripExpenseSummaryDto, TripExpenseTrendPointDto } from './expenses.js';

export type StatsScopeDto = Scope | 'all';
export type StatsYearFilterDto = string | 'all';
export type StatsTripFilterDto = string | 'unassigned';
export type StatsMarkerTagFilterDto = MarkerTag | 'all';
export type StatsMarkerMoodFilterDto = MarkerMood | 'all';
export type StatsMarkerWeatherFilterDto = MarkerWeather | 'all';
export type StatsMarkerTransportFilterDto = MarkerTransport | 'all';
export type StatsMarkerBudgetFilterDto = MarkerBudgetLevel | 'all';

export interface StatsCompanionFilterOptionDto {
  id: string;
  name: string;
  color: string;
}

export interface StatsTripFilterOptionDto {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
}

export interface StatsFiltersDto {
  year: StatsYearFilterDto;
  scope: StatsScopeDto;
  companionId?: string;
  tripId?: StatsTripFilterDto;
  tag?: StatsMarkerTagFilterDto;
  mood?: StatsMarkerMoodFilterDto;
  weather?: StatsMarkerWeatherFilterDto;
  transport?: StatsMarkerTransportFilterDto;
  budgetLevel?: StatsMarkerBudgetFilterDto;
}

export interface StatsSummaryDto {
  totalTrips: number;
  totalMarkers: number;
  totalTravelDays: number;
  totalCities: number;
  totalRegions: number;
  totalCountries: number;
  activeCompanions: number;
  longestTripDays?: number;
}

export interface StatsYearSeriesPointDto {
  year: string;
  markerCount: number;
  travelDays: number;
}

export interface StatsMonthDistributionItemDto {
  month: string;
  markerCount: number;
  travelDays: number;
}

export interface StatsRegionRankingItemDto {
  scopeId: string;
  scopeName: string;
  scope: Scope;
  markerCount: number;
}

export interface StatsCityRankingItemDto {
  city: string;
  scopeName: string;
  scope: Scope;
  markerCount: number;
}

export interface StatsCompanionRankingItemDto {
  companionId: string;
  companionName: string;
  color: string;
  markerCount: number;
  travelDays: number;
}

export interface StatsTripRankingItemDto {
  tripId: string;
  tripName: string;
  markerCount: number;
  travelDays: number;
  startsAt: string;
  endsAt: string;
}

export interface StatsTripDetailItemDto {
  tripId: string;
  tripName: string;
  markerCount: number;
  travelDays: number;
  startsAt: string;
  endsAt: string;
  coverImageUrl?: string;
  note: string;
}

export interface StatsHeatmapItemDto {
  scopeId: string;
  scopeName: string;
  scope: Scope;
  intensity: number;
  markerCount: number;
}

export interface StatsExpenseTripItemDto {
  tripId: string;
  tripName: string;
  amountCents: number;
  itemCount: number;
}

export interface StatsExpenseInsightsDto {
  summary: TripExpenseSummaryDto;
  trend: TripExpenseTrendPointDto[];
  topCategories: TripExpenseCategorySummaryDto[];
  topTrips: StatsExpenseTripItemDto[];
}

export interface StatsMetadataRankingItemDto {
  value: string;
  label: string;
  markerCount: number;
}

export type StatsAchievementCategoryDto = 'footprint' | 'rhythm' | 'companion' | 'content' | 'style';

export type StatsAchievementStatusDto = 'unlocked' | 'close' | 'locked';

export type StatsAchievementRarityDto = 'common' | 'rare' | 'epic' | 'legendary';

export type StatsAchievementGroupDto = 'footprint' | 'rhythm' | 'companion' | 'content' | 'style' | 'annual' | 'streak';

export type StatsAchievementPeriodTypeDto = 'global' | 'annual' | 'streak';

export interface StatsAchievementDto {
  id: string;
  title: string;
  description: string;
  category: StatsAchievementCategoryDto;
  group: StatsAchievementGroupDto;
  periodType: StatsAchievementPeriodTypeDto;
  rarity: StatsAchievementRarityDto;
  status: StatsAchievementStatusDto;
  progressValue: number;
  progressTarget: number;
  remainingValue?: number;
  unit: string;
  evidence?: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
  streakYears?: string[];
  nextHint?: string;
  firstUnlockedAt?: string;
}

export interface StatsOverviewResponseDto {
  filters: StatsFiltersDto;
  availableYears: string[];
  companions: StatsCompanionFilterOptionDto[];
  trips: StatsTripFilterOptionDto[];
  summary: StatsSummaryDto;
  yearlySeries: StatsYearSeriesPointDto[];
  monthlyDistribution: StatsMonthDistributionItemDto[];
  topRegions: StatsRegionRankingItemDto[];
  topCities: StatsCityRankingItemDto[];
  companionRanking: StatsCompanionRankingItemDto[];
  tripRanking: StatsTripRankingItemDto[];
  tripDetails: StatsTripDetailItemDto[];
  topTags: StatsMetadataRankingItemDto[];
  topMoods: StatsMetadataRankingItemDto[];
  topWeather: StatsMetadataRankingItemDto[];
  topTransports: StatsMetadataRankingItemDto[];
  topBudgetLevels: StatsMetadataRankingItemDto[];
  tripHighlights: {
    longestTrip?: { tripId: string; tripName: string; days: number };
    mostMarkersTrip?: { tripId: string; tripName: string; markerCount: number };
  };
  achievements: StatsAchievementDto[];
  expenseInsights: StatsExpenseInsightsDto;
  heatmap: StatsHeatmapItemDto[];
  generatedAt: string;
}

export interface AnnualReviewPhotoDto {
  imageId: string;
  markerId: string;
  markerTitle: string;
  imageUrl: string;
  visitedStartAt: string;
  scopeName: string;
  city: string;
  isFeatured: boolean;
  caption?: string;
  curatedSortOrder?: number;
}

export interface AnnualReviewGuideDto {
  id: string;
  markerId?: string;
  keyword: string;
  savedAt: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
}

export interface AnnualReviewMarkerDto {
  id: string;
  tripId?: string;
  companionId: string;
  companionName: string;
  companionColor: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note: string;
  tags?: MarkerTag[];
  mood?: MarkerMood;
  weather?: MarkerWeather;
  transport?: MarkerTransport;
  budgetLevel?: MarkerBudgetLevel;
  visitedStartAt: string;
  visitedEndAt: string;
}

export interface AnnualReviewTripDto {
  tripId: string;
  tripName: string;
  markerCount: number;
  travelDays: number;
  startsAt: string;
  endsAt: string;
  coverImageUrl?: string;
  note: string;
}

export interface AnnualReviewResponseDto {
  year: string;
  availableYears: string[];
  summary: StatsSummaryDto & {
    photoCount: number;
    guideCount: number;
  };
  monthlyDistribution: StatsMonthDistributionItemDto[];
  topRegions: StatsRegionRankingItemDto[];
  topCities: StatsCityRankingItemDto[];
  companionRanking: StatsCompanionRankingItemDto[];
  tripHighlights: {
    longestTrip?: { tripId: string; tripName: string; days: number };
    mostMarkersTrip?: { tripId: string; tripName: string; markerCount: number };
    busiestMonth?: { month: string; markerCount: number; travelDays: number };
    topCompanion?: { companionId: string; companionName: string; color: string; markerCount: number; travelDays: number };
    topRegion?: StatsRegionRankingItemDto;
    topCity?: StatsCityRankingItemDto;
  };
  heatmap: StatsHeatmapItemDto[];
  representativePhoto?: AnnualReviewPhotoDto;
  photos: AnnualReviewPhotoDto[];
  guides: AnnualReviewGuideDto[];
  trips: AnnualReviewTripDto[];
  achievements: StatsAchievementDto[];
  expenseInsights: StatsExpenseInsightsDto;
  firstMarker?: AnnualReviewMarkerDto;
  lastMarker?: AnnualReviewMarkerDto;
  generatedAt: string;
}
