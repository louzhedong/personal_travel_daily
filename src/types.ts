export type Scope = 'domestic' | 'international';

export type {
  MarkerBudgetLevel,
  MarkerMood,
  MarkerTag,
  MarkerTransport,
  MarkerWeather,
} from '../shared/markerMetadata';

import type {
  MarkerBudgetLevel,
  MarkerMood,
  MarkerTag,
  MarkerTransport,
  MarkerWeather,
} from '../shared/markerMetadata';

export interface AuthAccount {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'member';
}

export interface UserProfile {
  id: string;
  name: string;
  color: string;
}

export interface TripCollection {
  id: string;
  name: string;
  coverImageUrl?: string;
  note: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export type TripChecklistStage = 'pre_departure' | 'in_transit' | 'done';

export interface TripChecklistItem {
  id: string;
  companionId: string;
  companionName: string;
  companionColor: string;
  title: string;
  note?: string;
  stage: TripChecklistStage;
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

export interface TripChecklistGroup {
  stage: TripChecklistStage;
  title: string;
  description: string;
  itemCount: number;
  items: TripChecklistItem[];
}

export interface TripChecklistSummary {
  total: number;
  preDepartureCount: number;
  inTransitCount: number;
  doneCount: number;
}

export type TripPlanningPriority = 'low' | 'medium' | 'high';
export type TripPlanningStatus = 'planned' | 'converted';

export interface TripPlanningItem {
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
  priority: TripPlanningPriority;
  plannedDate?: string;
  status: TripPlanningStatus;
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

export interface TripPlanningSummary {
  total: number;
  plannedCount: number;
  convertedCount: number;
  highPriorityCount: number;
}

export type WishlistPriority = 'low' | 'medium' | 'high';

export interface WishlistItem {
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
  priority: WishlistPriority;
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

export interface VisitMarker {
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

export interface MarkerMetadata {
  tags?: MarkerTag[];
  mood?: MarkerMood;
  weather?: MarkerWeather;
  transport?: MarkerTransport;
  budgetLevel?: MarkerBudgetLevel;
}

export interface GuideSearchParams {
  keyword: string;
  scope?: Scope | 'all';
  page?: number;
  pageSize?: number;
  markerId?: string;
  searchMode?: 'keyword' | 'smart';
}

export interface GuideSearchResult {
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
  matchReason?: string;
  semanticScore?: number;
  queryInterpretation?: string;
}

export interface GuideContentBlock {
  id: string;
  type: 'paragraph' | 'bullet-list' | 'section-title' | 'tips';
  text: string;
}

export interface GuideDocument {
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
  contentHtml?: string;
  aiSummary?: GuideAiSummary;
  blocks: GuideContentBlock[];
  fetchedAt: string;
}

export interface GuideAiSummary {
  highlights: string[];
  routeTips: string[];
  transportTips: string[];
  warnings: string[];
}

export interface GuideSearchResponse {
  items: GuideSearchResult[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  provider: string;
  fetchedAt: string;
}

export interface SavedGuide {
  id: string;
  markerId?: string;
  savedByUserId: string;
  keyword: string;
  result: GuideSearchResult | GuideDocument;
  savedAt: string;
}

export interface GuideSearchHistoryItem {
  id: string;
  keyword: string;
  scope: Scope | 'all';
  createdAt: string;
}

export interface GuideSearchCacheRecord {
  key: string;
  params: GuideSearchParams;
  response: GuideSearchResponse;
  expiresAt: string;
}

export interface GuideDocumentCacheRecord {
  key: string;
  document: GuideDocument;
  expiresAt: string;
}

export interface RegionOption {
  id: string;
  name: string;
  cities: string[];
}

export interface MapRegion extends RegionOption {
  x: number;
  y: number;
  width: number;
  height: number;
  continent?: string;
}

export interface TravelStore {
  users: UserProfile[];
  trips?: TripCollection[];
  markers: VisitMarker[];
  wishlistItems?: WishlistItem[];
  activeUserId: string;
  savedGuides: SavedGuide[];
  guideSearchHistory: GuideSearchHistoryItem[];
}
