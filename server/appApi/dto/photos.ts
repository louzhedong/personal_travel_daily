import type { UpdateTripPhotoCurationItemDto } from './trips.js';

export type PhotoCurationFeaturedFilterDto = 'all' | 'featured' | 'unfeatured';
export type PhotoCurationCaptionFilterDto = 'all' | 'withCaption' | 'missingCaption';

export interface PhotoCurationQueryDto {
  tripId?: string;
  companionId?: string;
  year?: number;
  featured?: PhotoCurationFeaturedFilterDto;
  caption?: PhotoCurationCaptionFilterDto;
  limit?: number;
}

export interface PhotoCurationFilterOptionDto {
  id: string;
  name: string;
  photoCount: number;
}

export interface PhotoCurationCompanionFilterOptionDto extends PhotoCurationFilterOptionDto {
  color: string;
}

export interface PhotoCurationYearFilterOptionDto {
  year: number;
  photoCount: number;
}

export interface PhotoCurationItemDto {
  imageId: string;
  imageUrl: string;
  markerId: string;
  markerTitle: string;
  tripId?: string;
  tripName?: string;
  companionId: string;
  companionName: string;
  companionColor: string;
  scopeName: string;
  city: string;
  visitedStartAt: string;
  isFeatured: boolean;
  caption?: string;
  curatedSortOrder?: number;
}

export interface PhotoCurationResponseDto {
  summary: {
    totalPhotos: number;
    featuredPhotos: number;
    missingCaptionPhotos: number;
    tripCount: number;
    companionCount: number;
    yearCount: number;
  };
  filters: {
    trips: PhotoCurationFilterOptionDto[];
    companions: PhotoCurationCompanionFilterOptionDto[];
    years: PhotoCurationYearFilterOptionDto[];
  };
  sections: {
    featured: PhotoCurationItemDto[];
    missingCaptions: PhotoCurationItemDto[];
    recent: PhotoCurationItemDto[];
  };
  items: PhotoCurationItemDto[];
}

export type UpdatePhotoCurationItemDto = UpdateTripPhotoCurationItemDto;

export interface UpdatePhotoCurationInputDto {
  items: UpdatePhotoCurationItemDto[];
}
