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

export interface AccountSettingsDto {
  account: AuthAccount;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSessionDto {
  id: string;
  isCurrent: boolean;
  userAgent?: string;
  deviceLabel: string;
  ipAddress?: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
}

export interface AccountSessionsResponseDto {
  sessions: AccountSessionDto[];
}

export interface UpdateAccountProfileInputDto {
  name: string;
}

export interface ChangePasswordInputDto {
  currentPassword: string;
  nextPassword: string;
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

export interface UpdateTripPhotoCurationItemInput {
  imageId: string;
  isFeatured?: boolean;
  caption?: string | null;
  curatedSortOrder?: number | null;
}

export interface UpdateTripPhotoCurationInput {
  items: UpdateTripPhotoCurationItemInput[];
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
  lastResultCount?: number;
}

export interface GuideSearchHistoryListResponseDto {
  items: GuideSearchHistoryItem[];
}

export interface GuideSearchHistoryMutationResponseDto {
  item: GuideSearchHistoryItem;
  deduplicated?: boolean;
}

export type GuideSearchLogStatusDto = 'success' | 'empty' | 'error';

export interface CreateGuideSearchLogInput {
  companionId: string;
  keyword: string;
  scope: Scope | 'all';
  provider: string;
  page: number;
  pageSize: number;
  resultCount: number;
  hasMore: boolean;
  durationMs: number;
  status: GuideSearchLogStatusDto;
  errorCode?: string;
  sourceName?: string;
  sourceDomain?: string;
}

export interface GuideSearchLogDto {
  id: string;
  companionId: string;
  keyword: string;
  scope: Scope | 'all';
  provider: string;
  page: number;
  pageSize: number;
  resultCount: number;
  hasMore: boolean;
  durationMs: number;
  status: GuideSearchLogStatusDto;
  errorCode?: string;
  sourceName?: string;
  sourceDomain?: string;
  createdAt: string;
}

export interface GuideSearchLogMutationResponseDto {
  item: GuideSearchLogDto;
}

export interface GuideSourceHealthListResponseDto {
  items: GuideSourceHealthDto[];
}

export interface CompanionMemoryYearPointDto {
  year: string;
  markerCount: number;
  travelDays: number;
  photoCount: number;
}

export interface CompanionMemoryRegionDto {
  scope: Scope;
  scopeId: string;
  scopeName: string;
  markerCount: number;
}

export interface CompanionMemoryCityDto {
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  markerCount: number;
}

export interface CompanionMemoryThemeDto {
  type: 'tag' | 'mood' | 'transport' | 'budgetLevel';
  value: string;
  label: string;
  markerCount: number;
}

export interface CompanionMemoryTripDto {
  tripId: string;
  tripName: string;
  startsAt: string;
  endsAt: string;
  coverImageUrl?: string;
  note: string;
  markerCount: number;
  photoCount: number;
}

export interface CompanionMemoryPhotoDto {
  imageId: string;
  markerId: string;
  imageUrl: string;
  markerTitle: string;
  scopeName: string;
  city: string;
  visitedStartAt: string;
  isFeatured: boolean;
  caption?: string;
}

export interface CompanionMemoryGuideDto {
  id: string;
  markerId?: string;
  keyword: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  coverImageUrl?: string;
  savedAt: string;
}

export interface CompanionMemoryMilestoneDto {
  id: string;
  title: string;
  description: string;
  happenedAt?: string;
}

export interface CompanionMemoryResponseDto {
  companion: {
    id: string;
    name: string;
    color: string;
  };
  summary: {
    markerCount: number;
    travelDays: number;
    tripCount: number;
    cityCount: number;
    regionCount: number;
    photoCount: number;
    guideCount: number;
    firstSharedAt?: string;
    latestSharedAt?: string;
    headline: string;
  };
  yearlySeries: CompanionMemoryYearPointDto[];
  topRegions: CompanionMemoryRegionDto[];
  topCities: CompanionMemoryCityDto[];
  themes: CompanionMemoryThemeDto[];
  trips: CompanionMemoryTripDto[];
  photos: CompanionMemoryPhotoDto[];
  guides: CompanionMemoryGuideDto[];
  milestones: CompanionMemoryMilestoneDto[];
  snapshot: {
    generatedAt: string;
    expiresAt: string;
    stale: boolean;
    sourceMarkerCount: number;
    sourcePhotoCount: number;
    sourceGuideCount: number;
  };
}

export interface GuideSearchTrendPointDto {
  date: string;
  totalCount: number;
  successCount: number;
  emptyCount: number;
  errorCount: number;
  topKeywords: Array<{
    keyword: string;
    count: number;
  }>;
}

export interface GuideSearchStatusBreakdownDto {
  status: GuideSearchLogStatusDto;
  count: number;
}

export interface GuideSourceHealthDto {
  id: string;
  sourceName: string;
  sourceDomain: string;
  recentSuccess: number;
  recentFailure: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastFailureReason?: string;
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
  images?: Array<{
    id: string;
    imageUrl: string;
    isFeatured: boolean;
    caption?: string;
    curatedSortOrder?: number;
  }>;
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

export type AdminQualitySeverityDto = 'critical' | 'warning' | 'info';

export type AdminQualityIssueTypeDto =
  | 'marker_missing_photo'
  | 'marker_unassigned_trip'
  | 'trip_missing_cover'
  | 'photo_missing_caption'
  | 'planning_overdue'
  | 'saved_guide_unlinked'
  | 'guide_source_degraded'
  | 'guide_search_error_spike'
  | 'companion_memory_snapshot_stale';

export type AdminQualityNavigationKindDto =
  | 'tripDetail'
  | 'tripChecklist'
  | 'photoCuration'
  | 'companionMemories'
  | 'adminOnly';

export interface AdminQualityNavigationPayloadDto {
  tripId?: string;
  companionId?: string;
  year?: number;
  markerId?: string;
  photoId?: string;
  guideId?: string;
}

export interface AdminQualityIssueDto {
  id: string;
  severity: AdminQualitySeverityDto;
  type: AdminQualityIssueTypeDto;
  title: string;
  description: string;
  accountId?: string;
  accountName?: string;
  targetKind: 'account' | 'trip' | 'marker' | 'photo' | 'guide' | 'planningItem' | 'guideSource' | 'snapshot';
  targetId?: string;
  targetLabel: string;
  detectedAt: string;
  suggestedAction: string;
  navigationKind: AdminQualityNavigationKindDto;
  navigationPayload?: AdminQualityNavigationPayloadDto;
  canNavigate: boolean;
}

export interface AdminQualitySummaryDto {
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  affectedAccountCount: number;
  checkedAt: string;
}

export interface AdminQualityReportDto {
  summary: AdminQualitySummaryDto;
  issues: AdminQualityIssueDto[];
}

export interface AdminOverviewResponseDto {
  accounts: AdminAccountNodeDto[];
  guideSearchTrends?: GuideSearchTrendPointDto[];
  guideSearchStatusBreakdown?: GuideSearchStatusBreakdownDto[];
  guideSourceHealth?: GuideSourceHealthDto[];
  quality?: AdminQualityReportDto;
  meta: {
    fetchedAt: string;
    accountCount: number;
  };
}

export type AdminAuditActionDto =
  | 'quality_issue_viewed'
  | 'quality_issue_context_copied'
  | 'quality_issue_navigated'
  | 'quality_issue_list_filtered'
  | 'audit_trail_viewed';

export interface AdminAuditLogDto {
  id: string;
  adminAccountId: string;
  adminAccountName: string;
  action: AdminAuditActionDto;
  targetKind?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateAdminAuditLogInputDto {
  action: AdminAuditActionDto;
  targetKind?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export interface AdminAuditLogsResponseDto {
  logs: AdminAuditLogDto[];
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

export type PhotoCurationFeaturedFilterDto = 'all' | 'featured' | 'unfeatured';
export type PhotoCurationCaptionFilterDto = 'all' | 'withCaption' | 'missingCaption';

export interface PhotoCurationQuery {
  tripId?: string;
  companionId?: string;
  year?: number;
  featured?: PhotoCurationFeaturedFilterDto;
  caption?: PhotoCurationCaptionFilterDto;
  limit?: number;
}

export interface PhotoCurationFilterOptionDto {
  id: string;
  name: string;
  photoCount: number;
}

export interface PhotoCurationCompanionFilterOptionDto extends PhotoCurationFilterOptionDto {
  color: string;
}

export interface PhotoCurationYearFilterOptionDto {
  year: number;
  photoCount: number;
}

export interface PhotoCurationItemDto {
  imageId: string;
  imageUrl: string;
  markerId: string;
  markerTitle: string;
  tripId?: string;
  tripName?: string;
  companionId: string;
  companionName: string;
  companionColor: string;
  scopeName: string;
  city: string;
  visitedStartAt: string;
  isFeatured: boolean;
  caption?: string;
  curatedSortOrder?: number;
}

export interface PhotoCurationResponseDto {
  summary: {
    totalPhotos: number;
    featuredPhotos: number;
    missingCaptionPhotos: number;
    tripCount: number;
    companionCount: number;
    yearCount: number;
  };
  filters: {
    trips: PhotoCurationFilterOptionDto[];
    companions: PhotoCurationCompanionFilterOptionDto[];
    years: PhotoCurationYearFilterOptionDto[];
  };
  sections: {
    featured: PhotoCurationItemDto[];
    missingCaptions: PhotoCurationItemDto[];
    recent: PhotoCurationItemDto[];
  };
  items: PhotoCurationItemDto[];
}

export interface UpdatePhotoCurationItemDto {
  imageId: string;
  isFeatured?: boolean;
  caption?: string | null;
  curatedSortOrder?: number | null;
}

export interface UpdatePhotoCurationInput {
  items: UpdatePhotoCurationItemDto[];
}
