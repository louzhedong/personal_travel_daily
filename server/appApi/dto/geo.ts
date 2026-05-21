export interface GeoPointDto {
  latitude: number;
  longitude: number;
  source: string;
  confidence: number;
  label: string;
  resolvedAt: string;
}

export interface GeoLookupResponseDto {
  point: GeoPointDto;
  cached: boolean;
}

export interface ResolveGeoLookupInputDto {
  label: string;
  scope?: string;
  city?: string;
  country?: string;
}

export interface EnhanceMarkerGeoInputDto {
  label?: string;
}

export interface EnhancedMarkerGeoResponseDto {
  markerId: string;
  point: GeoPointDto;
}
