import type {
  MarkerBudgetLevel,
  MarkerMood,
  MarkerTag,
  MarkerTransport,
  MarkerWeather,
} from '../../../shared/markerMetadata.js';

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
  tags?: MarkerTag[];
  mood?: MarkerMood;
  weather?: MarkerWeather;
  transport?: MarkerTransport;
  budgetLevel?: MarkerBudgetLevel;
  latitude?: number;
  longitude?: number;
  geoSource?: string;
  geoConfidence?: number;
  geoResolvedAt?: string;
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
