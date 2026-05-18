import type { AtlasPlaceIndexDto, AtlasReplayItemDto, AtlasTimelineSummaryDto } from './atlas';

export type MapReplayStoryTargetTypeDto = 'trip' | 'year' | 'companion';

export interface MapReplayStoryTargetDto {
  type: MapReplayStoryTargetTypeDto;
  id: string;
  label: string;
  subtitle?: string;
}

export interface MapReplayStoryPhotoDto {
  imageId: string;
  markerId: string;
  imageUrl: string;
  title: string;
  caption?: string;
  visitedStartAt: string;
}

export interface MapReplayStoryGuideDto {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
}

export interface MapReplayStoryChapterDto {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
}

export interface MapReplayStoryExportModelDto {
  filenameSlug: string;
  posterTitle: string;
  posterSubtitle: string;
  routeTitle: string;
  featuredPhotoUrl?: string;
}

export interface MapReplayStoryResponseDto {
  target: MapReplayStoryTargetDto;
  summary: AtlasTimelineSummaryDto;
  replay: AtlasReplayItemDto[];
  placeIndex: AtlasPlaceIndexDto;
  photos: MapReplayStoryPhotoDto[];
  guides: MapReplayStoryGuideDto[];
  chapters: MapReplayStoryChapterDto[];
  exportModel: MapReplayStoryExportModelDto;
  sourceLinks: Array<{ label: string; path: string }>;
  emptyStates: string[];
  generatedAt: string;
}
