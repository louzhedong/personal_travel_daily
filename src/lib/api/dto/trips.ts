import type {
  GuideDocument,
  GuideSearchResult,
  MarkerBudgetLevel,
  MarkerMood,
  MarkerTag,
  MarkerTransport,
  MarkerWeather,
  Scope,
  TripChecklistGroup,
  TripChecklistItem,
  TripChecklistStage,
  TripChecklistSummary,
  TripCollection,
  TripPlanningItem,
  TripPlanningPriority,
  TripPlanningSchedule,
  TripPlanningSummary,
} from '../../../types';
import type { TripExpenseListResponseDto } from './expenses';
import type { GuideSourceInput } from './guides';

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

export interface UpdateTripPlanningItemScheduleInput {
  plannedDate: string | null;
}

export interface ImportWishlistToTripPlanningScheduleInput {
  wishlistIds: string[];
  plannedDate: string;
}

export interface TripPlanningResponseDto {
  summary: TripPlanningSummary;
  items: TripPlanningItem[];
}

export type TripPlanningScheduleResponseDto = TripPlanningSchedule;

export interface DeleteTripPlanningItemResponseDto {
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
  expenses: TripExpenseListResponseDto;
  meta: {
    generatedAt: string;
  };
}
