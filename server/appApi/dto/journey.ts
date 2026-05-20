export interface JourneyHighlightDto {
  id: string;
  kind: 'trip' | 'photo' | 'guide' | 'achievement';
  title: string;
  description: string;
  path?: string;
}

export interface JourneyRouteSegmentDto {
  from: string;
  to: string;
  label: string;
  precision: 'coordinate' | 'region' | 'country';
}

export interface JourneyBucketDto {
  id: string;
  title: string;
  periodLabel: string;
  markerCount: number;
  tripCount: number;
  photoCount: number;
  highlights: JourneyHighlightDto[];
  routeSegments: JourneyRouteSegmentDto[];
}

export interface JourneyTimelineResponseDto {
  buckets: JourneyBucketDto[];
  generatedAt: string;
}
