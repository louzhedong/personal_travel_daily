/**
 * F2 · Place DTOs / 旅行知识库 DTO（前端镜像）
 */
export type PlaceKindDto = 'hotel' | 'restaurant' | 'sight' | 'cafe' | 'onsen' | 'shop' | 'other';

export interface PlaceDto {
  id: string;
  kind: PlaceKindDto;
  name: string;
  city: string | null;
  region: string | null;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
  tags: string[];
  privateRating: number | null;
  myNotesMd: string | null;
  isFavorite: boolean;
  visitCount: number;
  firstVisitedAt: string | null;
  lastVisitedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceListResponseDto {
  items: PlaceDto[];
  total: number;
}

export interface PlaceDetailVisitDto {
  markerId: string;
  scopeName: string;
  city: string;
  visitedStartAt: string;
  tripId: string | null;
}

export interface PlaceDetailResponseDto {
  place: PlaceDto;
  visits: PlaceDetailVisitDto[];
}

export interface CreatePlaceBodyDto {
  kind: PlaceKindDto;
  name: string;
  city?: string;
  region?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  privateRating?: number;
  myNotesMd?: string;
  isFavorite?: boolean;
}

export type UpdatePlaceBodyDto = Partial<CreatePlaceBodyDto>;

export interface PromoteMarkerToPlaceBodyDto {
  markerId: string;
  kind: PlaceKindDto;
  tags?: string[];
}
