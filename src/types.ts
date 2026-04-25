export type Scope = 'domestic' | 'international';

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

export interface VisitMarker {
  id: string;
  userId: string;
  tripId?: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note: string;
  imageUrls?: string[];
  visitedStartAt: string;
  visitedEndAt: string;
  createdAt: string;
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
  activeUserId: string;
  savedGuides: SavedGuide[];
  guideSearchHistory: GuideSearchHistoryItem[];
}
