export type Scope = 'domestic' | 'international';
export type AccountRoleDto = 'admin' | 'member';

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

export interface GuideDocumentDto extends GuideSearchResultDto {
  contentHtml?: string;
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

export interface AdminCompanionNodeDto {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  markers: AdminMarkerNodeDto[];
  savedGuides: AdminSavedGuideNodeDto[];
  guideSearchHistory: AdminGuideSearchHistoryNodeDto[];
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
  };
}

export interface AdminOverviewResponseDto {
  accounts: AdminAccountNodeDto[];
  meta: {
    fetchedAt: string;
    accountCount: number;
  };
}
