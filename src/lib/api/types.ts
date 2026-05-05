import type {
  AuthAccount,
  GuideDocument,
  GuideSearchHistoryItem,
  GuideSearchResult,
  MarkerBudgetLevel,
  MarkerMood,
  MarkerTag,
  MarkerTransport,
  MarkerWeather,
  SavedGuide,
  Scope,
  TripChecklistGroup,
  TripChecklistItem,
  TripChecklistSummary,
  TripChecklistStage,
  TripPlanningItem,
  TripPlanningPriority,
  TripPlanningSummary,
  TripCollection,
  TravelStore,
  VisitMarker,
  WishlistItem,
  WishlistPriority,
} from '../../types';

// Re-export shared error code constants/types so 前端调用方 / front-end callers
// 可以直接从 api/types 引用统一的错误码常量 / can import the unified error code constants.
export { APP_API_ERROR_CODE, type AppApiErrorCode } from '../../../shared/errors/codes';

export interface AppApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

export interface BootstrapResponseDto {
  store: TravelStore;
  meta: {
    accountId: string;
    account: AuthAccount;
    fetchedAt: string;
  };
}

export interface AuthResponseDto {
  account: AuthAccount;
}

export interface SessionResponseDto {
  account: AuthAccount | null;
}

export interface CreateCompanionInput {
  name: string;
  color: string;
}

export interface UpdateCompanionInput {
  name?: string;
  color?: string;
}

export interface CreateMarkerInput {
  companionId: string;
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
}

export interface UpdateMarkerInput {
  note?: string;
  tags?: MarkerTag[];
  mood?: MarkerMood | null;
  weather?: MarkerWeather | null;
  transport?: MarkerTransport | null;
  budgetLevel?: MarkerBudgetLevel | null;
  imageUrls?: string[];
  visitedStartAt?: string;
  visitedEndAt?: string;
  tripId?: string | null;
}

export interface BatchUpdateMarkersTripInput {
  markerIds: string[];
  tripId?: string | null;
}

export interface SearchMarkersQuery {
  keyword?: string;
  companionId?: string;
  scope?: Scope | 'all';
  year?: string;
  tag?: MarkerTag | 'all';
  mood?: MarkerMood | 'all';
  weather?: MarkerWeather | 'all';
  transport?: MarkerTransport | 'all';
  budgetLevel?: MarkerBudgetLevel | 'all';
  page?: number;
  pageSize?: number;
}

export interface MarkerSearchResponseDto {
  items: VisitMarker[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface CreateTripInput {
  name: string;
  coverImageUrl?: string;
  note?: string;
  startsAt: string;
  endsAt: string;
}

export interface UpdateTripInput {
  name?: string;
  coverImageUrl?: string | null;
  note?: string;
  startsAt?: string;
  endsAt?: string;
}

export interface GuideSourceInput {
  identity?: string;
  title?: string;
  sourceName?: string;
  sourceUrl?: string;
}

export interface CreateTripPlanningItemInput {
  companionId: string;
  title: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note?: string;
  priority?: TripPlanningPriority;
  plannedDate?: string | null;
  guide?: GuideSourceInput;
}

export interface UpdateTripPlanningItemInput {
  title?: string;
  scope?: Scope;
  scopeId?: string;
  scopeName?: string;
  city?: string;
  note?: string | null;
  priority?: TripPlanningPriority;
  plannedDate?: string | null;
  sortOrder?: number;
}

export interface ConvertTripPlanningItemInput {
  visitedStartAt: string;
  visitedEndAt: string;
  note?: string;
}

export interface TripPlanningResponseDto {
  summary: TripPlanningSummary;
  items: TripPlanningItem[];
}

export interface DeleteTripPlanningItemResponseDto {
  deletedId: string;
}

export interface CreateWishlistItemInput {
  companionId: string;
  title: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note?: string;
  priority?: WishlistPriority;
  targetYear?: string | null;
  guide?: GuideSourceInput;
}

export interface UpdateWishlistItemInput {
  title?: string;
  scope?: Scope;
  scopeId?: string;
  scopeName?: string;
  city?: string;
  note?: string | null;
  priority?: WishlistPriority;
  targetYear?: string | null;
}

export interface ConvertWishlistToTripInput {
  name?: string;
  note?: string;
  startsAt?: string;
  endsAt?: string;
}

export interface WishlistListResponseDto {
  items: WishlistItem[];
}

export interface ConvertWishlistToTripResponseDto {
  tripId: string;
  store: TravelStore;
}

export interface DeleteWishlistItemResponseDto {
  deletedId: string;
}

export interface GenerateTripChecklistInput {
  companionId: string;
  guide: Pick<GuideSearchResult, 'title' | 'summary' | 'sourceName' | 'sourceUrl'>;
}

export interface CreateTripChecklistItemInput {
  companionId: string;
  title: string;
  note?: string;
  stage: TripChecklistStage;
}

export interface UpdateTripChecklistItemInput {
  title?: string;
  note?: string | null;
  stage?: TripChecklistStage;
  sortOrder?: number;
}

export interface TripChecklistResponseDto {
  summary: TripChecklistSummary;
  groups: TripChecklistGroup[];
}

export interface GenerateTripChecklistResultDto {
  createdCount: number;
  deduplicatedCount: number;
  items: TripChecklistItem[];
}

export interface DeleteTripChecklistItemResponseDto {
  deletedId: string;
}

export interface ListSavedGuidesQuery {
  companionId?: string;
  markerId?: string;
}

export interface CreateSavedGuideInput {
  savedByUserId: string;
  markerId?: string;
  keyword: string;
  result: GuideSearchResult | GuideDocument;
}

export interface SavedGuideListResponseDto {
  items: SavedGuide[];
}

export interface SavedGuideMutationResponseDto {
  item: SavedGuide;
  deduplicated?: boolean;
}

export interface DeleteSavedGuideResponseDto {
  deletedId: string;
}

export interface ListGuideSearchHistoriesQuery {
  companionId?: string;
  limit?: number;
}

export interface CreateGuideSearchHistoryInput {
  companionId: string;
  keyword: string;
  scope: Scope | 'all';
}

export interface GuideSearchHistoryListResponseDto {
  items: GuideSearchHistoryItem[];
}

export interface GuideSearchHistoryMutationResponseDto {
  item: GuideSearchHistoryItem;
  deduplicated?: boolean;
}

export type AccountRoleDto = 'admin' | 'member';

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
  result: GuideSearchResult | GuideDocument;
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

export interface AdminPlanningItemNodeDto extends TripPlanningItem {
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
  planningItems?: AdminPlanningItemNodeDto[];
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
    planningItemCount?: number;
    convertedPlanningItemCount?: number;
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
  markerId: string;
  markerTitle: string;
  imageUrl: string;
  visitedStartAt: string;
  scopeName: string;
  city: string;
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
  markerId: string;
  markerTitle: string;
  imageUrl: string;
  visitedStartAt: string;
  scopeName: string;
  city: string;
}

export interface TripDetailGuideItemDto {
  id: string;
  markerId?: string;
  keyword: string;
  savedAt: string;
  result: GuideSearchResult | GuideDocument;
}

export interface TripDetailResponseDto {
  trip: TripCollection;
  summary: TripDetailSummaryDto;
  companions: TripDetailCompanionItemDto[];
  markers: TripDetailMarkerItemDto[];
  photos: TripDetailPhotoItemDto[];
  guides: TripDetailGuideItemDto[];
  planningSummary?: TripPlanningSummary;
  checklistSummary: TripChecklistSummary;
  checklistGroups: TripChecklistGroup[];
  meta: {
    generatedAt: string;
  };
}
