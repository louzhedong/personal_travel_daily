import { getResourceBaseUrl, httpClient } from './httpClient';
import type { EnhancedMarkerGeoResponseDto, GeoLookupResponseDto, ResolveGeoLookupInputDto } from './types';

const baseUrl = getResourceBaseUrl();

export function resolveGeoLookup(input: ResolveGeoLookupInputDto) {
  return httpClient.post<GeoLookupResponseDto>(baseUrl, '/geo/resolve', input);
}

export function enhanceMarkerGeo(markerId: string, label?: string) {
  return httpClient.post<EnhancedMarkerGeoResponseDto>(baseUrl, `/markers/${encodeURIComponent(markerId)}/geo/enhance`, { label });
}
