import type {
  MarkerBudgetLevel,
  MarkerMood,
  MarkerTag,
  MarkerTransport,
  MarkerWeather,
  Scope,
  VisitMarker,
} from '../../../types';

export type AccountRoleDto = 'admin' | 'member';

export interface AppApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

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
