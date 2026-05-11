import type {
  MarkerBudgetLevel,
  MarkerMood,
  MarkerTag,
  MarkerTransport,
  MarkerWeather,
} from '../../../shared/markerMetadata.js';
import type { Scope, TripDto } from './common.js';
import type { GuideDocumentDto, GuideSearchResultDto } from './guides.js';

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
