export type Scope = 'domestic' | 'international';
export type AccountRoleDto = 'admin' | 'member';

import type {
  MarkerBudgetLevel,
  MarkerMood,
  MarkerTag,
  MarkerTransport,
  MarkerWeather,
} from '../../shared/markerMetadata.js';

export interface CurrentAccountDto {
  id: string;
  name: string;
  username: string;
  role: AccountRoleDto;
}

export interface UserProfileDto {
  id: string;
  name: string;
  color: string;
}

export interface TripDto {
  id: string;
  name: string;
  coverImageUrl?: string;
  note: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export interface VisitMarkerDto {
  id: string;
  userId: string;
  tripId?: string;
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
  imageUrls?: string[];
  visitedStartAt: string;
  visitedEndAt: string;
  createdAt: string;
}

export interface MarkerSearchResponseDto {
  items: VisitMarkerDto[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface GuideSearchResultDto {
  id: string;
  title: string;
  summary: string;
  coverImageUrl?: string;
  sourceName: string;
  sourceUrl: string;
  authorName?: string;
  publishedAt?: string;
  destinationLabel?: string;
  tags?: string[];
}

export interface GuideContentBlockDto {
  id: string;
  type: 'paragraph' | 'bullet-list' | 'section-title' | 'tips';
  text: string;
}

export interface GuideAiSummaryDto {
  highlights: string[];
  routeTips: string[];
  transportTips: string[];
  warnings: string[];
}

export interface GuideDocumentDto extends GuideSearchResultDto {
  contentHtml?: string;
  aiSummary?: GuideAiSummaryDto;
  blocks: GuideContentBlockDto[];
  fetchedAt: string;
}

export interface SavedGuideDto {
  id: string;
  markerId?: string;
  savedByUserId: string;
  keyword: string;
  result: GuideSearchResultDto | GuideDocumentDto;
  savedAt: string;
}

export interface GuideSearchHistoryItemDto {
  id: string;
  keyword: string;
  scope: Scope | 'all';
  createdAt: string;
}

export type WishlistPriorityDto = 'low' | 'medium' | 'high';

export interface WishlistItemDto {
  id: string;
  companionId: string;
  companionName: string;
  companionColor: string;
  title: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note?: string;
  priority: WishlistPriorityDto;
  targetYear?: string;
  sourceGuideIdentity?: string;
  sourceGuideTitle?: string;
  sourceGuideSourceName?: string;
  sourceGuideSourceUrl?: string;
  importedTrips: Array<{
    id: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistListResponseDto {
  items: WishlistItemDto[];
}

export interface DeleteWishlistItemResponseDto {
  deletedId: string;
}

export interface SavedGuideListResponseDto {
  items: SavedGuideDto[];
}

export interface SavedGuideMutationResponseDto {
  item: SavedGuideDto;
  deduplicated?: boolean;
}

export interface DeleteSavedGuideResponseDto {
  deletedId: string;
}

export interface GuideSearchHistoryListResponseDto {
  items: GuideSearchHistoryItemDto[];
}

export interface GuideSearchHistoryMutationResponseDto {
  item: GuideSearchHistoryItemDto;
  deduplicated?: boolean;
}

export interface TravelStoreDto {
  users: UserProfileDto[];
  trips: TripDto[];
  markers: VisitMarkerDto[];
  wishlistItems: WishlistItemDto[];
  activeUserId: string;
  savedGuides: SavedGuideDto[];
  guideSearchHistory: GuideSearchHistoryItemDto[];
}

export interface BootstrapResponseDto {
  store: TravelStoreDto;
  meta: {
    accountId: string;
    account: CurrentAccountDto;
    fetchedAt: string;
  };
}

export interface AuthResponseDto {
  account: CurrentAccountDto;
}

export interface AdminMarkerNodeDto {
  id: string;
  tripId?: string;
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
  imageUrls?: string[];
  visitedStartAt: string;
  visitedEndAt: string;
  createdAt: string;
}

export interface AdminTripNodeDto {
  id: string;
  name: string;
  coverImageUrl?: string;
  note: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export interface AdminSavedGuideNodeDto {
  id: string;
  markerId?: string;
  keyword: string;
  result: GuideSearchResultDto | GuideDocumentDto;
  savedAt: string;
}

export interface AdminGuideSearchHistoryNodeDto {
  id: string;
  keyword: string;
  scope: Scope | 'all';
  createdAt: string;
}

export interface AdminMarkerSearchEventNodeDto {
  id: string;
  companionId?: string;
  keyword: string;
  scope: Scope | 'all';
  year?: string;
  resultCount: number;
  page: number;
  pageSize: number;
  createdAt: string;
}

export type TripPlanningPriorityDto = 'low' | 'medium' | 'high';
export type TripPlanningStatusDto = 'planned' | 'converted';

export interface TripPlanningItemDto {
  id: string;
  tripId: string;
  companionId: string;
  companionName: string;
  companionColor: string;
  title: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note?: string;
  priority: TripPlanningPriorityDto;
  plannedDate?: string;
  status: TripPlanningStatusDto;
  convertedMarkerId?: string;
  sourceGuideIdentity?: string;
  sourceGuideTitle?: string;
  sourceGuideSourceName?: string;
  sourceGuideSourceUrl?: string;
  sourceWishlistId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TripPlanningSummaryDto {
  total: number;
  plannedCount: number;
  convertedCount: number;
  highPriorityCount: number;
}

export interface TripPlanningResponseDto {
  summary: TripPlanningSummaryDto;
  items: TripPlanningItemDto[];
}

export interface AdminPlanningItemNodeDto extends TripPlanningItemDto {
  tripName: string;
}

export interface AdminCompanionNodeDto {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  markers: AdminMarkerNodeDto[];
  savedGuides: AdminSavedGuideNodeDto[];
  guideSearchHistory: AdminGuideSearchHistoryNodeDto[];
  planningItems: AdminPlanningItemNodeDto[];
}

export interface AdminAccountNodeDto {
  id: string;
  name: string;
  username: string;
  role: AccountRoleDto;
  createdAt: string;
  trips: AdminTripNodeDto[];
  markerSearchEvents: AdminMarkerSearchEventNodeDto[];
  companions: AdminCompanionNodeDto[];
  stats: {
    tripCount: number;
    companionCount: number;
    markerCount: number;
    savedGuideCount: number;
    guideSearchHistoryCount: number;
    markerSearchEventCount: number;
    planningItemCount: number;
    convertedPlanningItemCount: number;
  };
}

export interface AdminOverviewResponseDto {
  accounts: AdminAccountNodeDto[];
  meta: {
    fetchedAt: string;
    accountCount: number;
  };
}

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

export interface StatsMetadataRankingItemDto {
  value: string;
  label: string;
  markerCount: number;
}

export type StatsAchievementCategoryDto = 'footprint' | 'rhythm' | 'companion' | 'content' | 'style';

export type StatsAchievementStatusDto = 'unlocked' | 'close' | 'locked';

export interface StatsAchievementDto {
  id: string;
  title: string;
  description: string;
  category: StatsAchievementCategoryDto;
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
  firstMarker?: AnnualReviewMarkerDto;
  lastMarker?: AnnualReviewMarkerDto;
  generatedAt: string;
}

export interface TripDetailSummaryDto {
  markerCount: number;
  travelDays: number;
  cityCount: number;
  regionCount: number;
  companionCount: number;
  guideCount: number;
  photoCount: number;
}

export interface TripDetailCompanionItemDto {
  id: string;
  name: string;
  color: string;
  markerCount: number;
}

export interface TripDetailMarkerItemDto {
  id: string;
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
  imageUrls?: string[];
  visitedStartAt: string;
  visitedEndAt: string;
}

export interface TripDetailPhotoItemDto {
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

export interface TripDetailGuideItemDto {
  id: string;
  markerId?: string;
  keyword: string;
  savedAt: string;
  result: GuideSearchResultDto | GuideDocumentDto;
}

export type TripChecklistStageDto = 'pre_departure' | 'in_transit' | 'done';

export interface TripChecklistItemDto {
  id: string;
  companionId: string;
  companionName: string;
  companionColor: string;
  title: string;
  note?: string;
  stage: TripChecklistStageDto;
  sortOrder: number;
  origin: 'generated' | 'manual';
  sourceGuideIdentity?: string;
  sourceGuideTitle?: string;
  sourceGuideSourceName?: string;
  sourceGuideSourceUrl?: string;
  sourceSnippet?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripChecklistGroupDto {
  stage: TripChecklistStageDto;
  title: string;
  description: string;
  itemCount: number;
  items: TripChecklistItemDto[];
}

export interface TripChecklistSummaryDto {
  total: number;
  preDepartureCount: number;
  inTransitCount: number;
  doneCount: number;
}

export interface TripChecklistResponseDto {
  summary: TripChecklistSummaryDto;
  groups: TripChecklistGroupDto[];
}

export interface GenerateTripChecklistResultDto {
  createdCount: number;
  deduplicatedCount: number;
  items: TripChecklistItemDto[];
}

export interface TripDetailResponseDto {
  trip: TripDto;
  summary: TripDetailSummaryDto;
  companions: TripDetailCompanionItemDto[];
  markers: TripDetailMarkerItemDto[];
  photos: TripDetailPhotoItemDto[];
  guides: TripDetailGuideItemDto[];
  planningSummary: TripPlanningSummaryDto;
  checklistSummary: TripChecklistSummaryDto;
  checklistGroups: TripChecklistGroupDto[];
  meta: {
    generatedAt: string;
  };
}

export interface UpdateTripPhotoCurationItemDto {
  imageId: string;
  isFeatured?: boolean;
  caption?: string | null;
  curatedSortOrder?: number | null;
}

export interface UpdateTripPhotoCurationInputDto {
  items: UpdateTripPhotoCurationItemDto[];
}
