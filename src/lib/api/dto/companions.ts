export interface CreateCompanionInput {
  name: string;
  color: string;
}

export interface UpdateCompanionInput {
  name?: string;
  color?: string;
}

import type { Scope } from '../../../types';

export interface CompanionMemoryYearPointDto {
  year: string;
  markerCount: number;
  travelDays: number;
  photoCount: number;
}

export interface CompanionMemoryRegionDto {
  scope: Scope;
  scopeId: string;
  scopeName: string;
  markerCount: number;
}

export interface CompanionMemoryCityDto {
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  markerCount: number;
}

export interface CompanionMemoryThemeDto {
  type: 'tag' | 'mood' | 'transport' | 'budgetLevel';
  value: string;
  label: string;
  markerCount: number;
}

export interface CompanionMemoryTripDto {
  tripId: string;
  tripName: string;
  startsAt: string;
  endsAt: string;
  coverImageUrl?: string;
  note: string;
  markerCount: number;
  photoCount: number;
}

export interface CompanionMemoryPhotoDto {
  imageId: string;
  markerId: string;
  imageUrl: string;
  markerTitle: string;
  scopeName: string;
  city: string;
  visitedStartAt: string;
  isFeatured: boolean;
  caption?: string;
}

export interface CompanionMemoryGuideDto {
  id: string;
  markerId?: string;
  keyword: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  coverImageUrl?: string;
  savedAt: string;
}

export interface CompanionMemoryMilestoneDto {
  id: string;
  title: string;
  description: string;
  happenedAt?: string;
}

export interface CompanionMemoryResponseDto {
  companion: {
    id: string;
    name: string;
    color: string;
  };
  summary: {
    markerCount: number;
    travelDays: number;
    tripCount: number;
    cityCount: number;
    regionCount: number;
    photoCount: number;
    guideCount: number;
    firstSharedAt?: string;
    latestSharedAt?: string;
    headline: string;
  };
  yearlySeries: CompanionMemoryYearPointDto[];
  topRegions: CompanionMemoryRegionDto[];
  topCities: CompanionMemoryCityDto[];
  themes: CompanionMemoryThemeDto[];
  trips: CompanionMemoryTripDto[];
  photos: CompanionMemoryPhotoDto[];
  guides: CompanionMemoryGuideDto[];
  milestones: CompanionMemoryMilestoneDto[];
  snapshot: {
    generatedAt: string;
    expiresAt: string;
    stale: boolean;
    sourceMarkerCount: number;
    sourcePhotoCount: number;
    sourceGuideCount: number;
  };
}
