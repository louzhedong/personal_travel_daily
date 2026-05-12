import type {
  MarkerBudgetLevel,
  MarkerMood,
  MarkerTag,
  MarkerTransport,
  MarkerWeather,
} from '../../../../shared/markerMetadata';
import type { Scope } from '../../../types';
import type { StatsTripFilterDto } from './stats';

export type AtlasScopeDto = Scope | 'all';
export type AtlasYearFilterDto = string | 'all';
export type AtlasMonthFilterDto = string | 'all';
export type AtlasMarkerTagFilterDto = MarkerTag | 'all';
export type AtlasMarkerMoodFilterDto = MarkerMood | 'all';
export type AtlasMarkerWeatherFilterDto = MarkerWeather | 'all';
export type AtlasMarkerTransportFilterDto = MarkerTransport | 'all';
export type AtlasMarkerBudgetFilterDto = MarkerBudgetLevel | 'all';

export interface AtlasTimelineQueryDto {
  year?: AtlasYearFilterDto;
  month?: AtlasMonthFilterDto;
  scope?: AtlasScopeDto;
  companionId?: string;
  tripId?: StatsTripFilterDto;
  tag?: AtlasMarkerTagFilterDto;
  mood?: AtlasMarkerMoodFilterDto;
  weather?: AtlasMarkerWeatherFilterDto;
  transport?: AtlasMarkerTransportFilterDto;
  budgetLevel?: AtlasMarkerBudgetFilterDto;
}

export interface AtlasTimelineFiltersDto {
  year: AtlasYearFilterDto;
  month: AtlasMonthFilterDto;
  scope: AtlasScopeDto;
  companionId?: string;
  tripId?: StatsTripFilterDto;
  tag?: AtlasMarkerTagFilterDto;
  mood?: AtlasMarkerMoodFilterDto;
  weather?: AtlasMarkerWeatherFilterDto;
  transport?: AtlasMarkerTransportFilterDto;
  budgetLevel?: AtlasMarkerBudgetFilterDto;
}

export interface AtlasCompanionOptionDto {
  id: string;
  name: string;
  color: string;
}

export interface AtlasTripOptionDto {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
}

export interface AtlasTimelineSummaryDto {
  markerCount: number;
  travelDays: number;
  cityCount: number;
  regionCount: number;
  countryCount: number;
  photoCount: number;
  companionCount: number;
  tripCount: number;
  firstVisitedAt?: string;
  latestVisitedAt?: string;
}

export interface AtlasReplayItemDto {
  id: string;
  order: number;
  markerId: string;
  title: string;
  description: string;
  visitedStartAt: string;
  visitedEndAt: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  companion: AtlasCompanionOptionDto;
  trip?: AtlasTripOptionDto;
  photo?: {
    imageId: string;
    imageUrl: string;
    caption?: string;
    isFeatured: boolean;
  };
  metadata: {
    tags: MarkerTag[];
    mood?: MarkerMood;
    weather?: MarkerWeather;
    transport?: MarkerTransport;
    budgetLevel?: MarkerBudgetLevel;
  };
}

export interface AtlasPlaceCityDto {
  city: string;
  markerCount: number;
  photoCount: number;
  firstVisitedAt?: string;
  latestVisitedAt?: string;
}

export interface AtlasPlaceRegionDto {
  scope: Scope;
  scopeId: string;
  scopeName: string;
  markerCount: number;
  photoCount: number;
  firstVisitedAt?: string;
  latestVisitedAt?: string;
  cities: AtlasPlaceCityDto[];
}

export interface AtlasPlaceIndexDto {
  regions: AtlasPlaceRegionDto[];
}

export interface AtlasYearCompareItemDto {
  year: string;
  markerCount: number;
  travelDays: number;
  cityCount: number;
  photoCount: number;
}

export interface AtlasCompanionCompareItemDto {
  companionId: string;
  companionName: string;
  color: string;
  markerCount: number;
  travelDays: number;
  cityCount: number;
  photoCount: number;
}

export interface AtlasScopeCompareItemDto {
  scope: Scope;
  markerCount: number;
  cityCount: number;
  regionCount: number;
  photoCount: number;
}

export interface AtlasCompareDto {
  years: AtlasYearCompareItemDto[];
  companions: AtlasCompanionCompareItemDto[];
  scopes: AtlasScopeCompareItemDto[];
}

export interface AtlasExportModelDto {
  posterTitle: string;
  posterSubtitle: string;
  routeTitle: string;
  indexTitle: string;
  featuredPhotoUrl?: string;
}

export interface AtlasTimelineResponseDto {
  filters: AtlasTimelineFiltersDto;
  availableYears: string[];
  companions: AtlasCompanionOptionDto[];
  trips: AtlasTripOptionDto[];
  summary: AtlasTimelineSummaryDto;
  replay: AtlasReplayItemDto[];
  placeIndex: AtlasPlaceIndexDto;
  compare: AtlasCompareDto;
  exportModel: AtlasExportModelDto;
  generatedAt: string;
}
