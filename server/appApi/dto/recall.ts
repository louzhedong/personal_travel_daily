/**
 * G3 · Event-Centric Recall DTOs / 事件维度回想 DTO
 */
export type RecallEventKindDto = 'marker' | 'photo' | 'expense' | 'journal' | 'guide';

export interface RecallEventDto {
  id: string;
  kind: RecallEventKindDto;
  sourceId: string;
  eventDate: string;
  tripId: string | null;
  tripName: string | null;
  title: string | null;
  city: string | null;
  weather: string | null;
  mood: string | null;
  latitude: number | null;
  longitude: number | null;
  companionIds: string[];
  tagSlugs: string[];
}

export interface RecallFacetCountDto {
  value: string;
  label: string;
  count: number;
}

export interface RecallFacetsDto {
  companions: RecallFacetCountDto[];
  weathers: RecallFacetCountDto[];
  moods: RecallFacetCountDto[];
  tags: RecallFacetCountDto[];
  cities: RecallFacetCountDto[];
}

export interface RecallQueryFiltersDto {
  companionIds?: string[];
  cities?: string[];
  weathers?: string[];
  moods?: string[];
  tagSlugs?: string[];
  kinds?: RecallEventKindDto[];
  startDate?: string;
  endDate?: string;
  searchKeyword?: string;
}

export interface RecallQueryResponseDto {
  total: number;
  events: RecallEventDto[];
  facets: RecallFacetsDto;
  groupsByMonth: Array<{ month: string; count: number }>;
}

export interface RecallRebuildResponseDto {
  rebuiltCount: number;
  generatedAt: string;
}
