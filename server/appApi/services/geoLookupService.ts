import { randomUUID, createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { getPrismaClient } from '../prisma.js';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import type { EnhancedMarkerGeoResponseDto, GeoLookupResponseDto, GeoPointDto, ResolveGeoLookupInputDto } from '../types.js';

function buildQuery(input: ResolveGeoLookupInputDto) {
  return [input.label, input.city, input.country, input.scope].filter(Boolean).join(', ');
}

function buildQueryKey(input: ResolveGeoLookupInputDto) {
  return createHash('sha256').update(buildQuery(input).toLowerCase()).digest('hex');
}

function serializePoint(item: { latitude: unknown; longitude: unknown; source: string; confidence: number; label: string; resolvedAt: Date }): GeoPointDto {
  return {
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    source: item.source,
    confidence: item.confidence,
    label: item.label,
    resolvedAt: item.resolvedAt.toISOString(),
  };
}

async function fetchGeoapifyPoint(query: string): Promise<{ latitude: number; longitude: number; raw: unknown } | null> {
  const apiKey = process.env.GUIDE_POI_GEOAPIFY_API_KEY;
  if (!apiKey) return null;
  const url = new URL('https://api.geoapify.com/v1/geocode/search');
  url.searchParams.set('text', query);
  url.searchParams.set('limit', '1');
  url.searchParams.set('apiKey', apiKey);
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) return null;
  const payload = await response.json() as { features?: Array<{ properties?: { lat?: number; lon?: number } }> };
  const first = payload.features?.[0]?.properties;
  if (typeof first?.lat !== 'number' || typeof first?.lon !== 'number') return null;
  return { latitude: first.lat, longitude: first.lon, raw: payload };
}

function fallbackPoint(query: string) {
  const hash = createHash('sha256').update(query).digest();
  const lat = 18 + (hash[0] / 255) * 35;
  const lng = 73 + (hash[1] / 255) * 62;
  return { latitude: Number(lat.toFixed(7)), longitude: Number(lng.toFixed(7)), raw: { fallback: true } };
}

export async function resolveGeoLookup(account: AuthenticatedAccount, input: ResolveGeoLookupInputDto): Promise<GeoLookupResponseDto> {
  const prisma = getPrismaClient();
  const queryKey = buildQueryKey(input);
  const cached = await prisma.geoLookup.findUnique({ where: { accountId_queryKey: { accountId: account.id, queryKey } } });
  if (cached) {
    return { point: serializePoint(cached), cached: true };
  }
  const query = buildQuery(input);
  const external = await fetchGeoapifyPoint(query).catch(() => null);
  const point = external ?? fallbackPoint(query);
  const created = await prisma.geoLookup.create({
    data: {
      id: randomUUID(),
      accountId: account.id,
      queryKey,
      label: input.label,
      scope: input.scope,
      latitude: point.latitude,
      longitude: point.longitude,
      source: external ? 'geoapify' : 'fallback',
      confidence: external ? 92 : 45,
      rawJson: point.raw as Prisma.InputJsonValue,
    },
  });
  return { point: serializePoint(created), cached: false };
}

export async function enhanceMarkerGeo(account: AuthenticatedAccount, markerId: string, label?: string): Promise<EnhancedMarkerGeoResponseDto> {
  const prisma = getPrismaClient();
  const marker = await prisma.visitMarker.findFirst({ where: { id: markerId, accountId: account.id, isDeleted: false } });
  if (!marker) throw new Error('marker not found');
  const response = await resolveGeoLookup(account, {
    label: label ?? `${marker.scopeName} ${marker.city}`,
    scope: marker.scope,
    city: marker.city,
    country: marker.scopeName,
  });
  await prisma.visitMarker.update({
    where: { id: marker.id },
    data: {
      latitude: response.point.latitude,
      longitude: response.point.longitude,
      geoSource: response.point.source,
      geoConfidence: response.point.confidence,
      geoResolvedAt: new Date(response.point.resolvedAt),
    },
  });
  return { markerId: marker.id, point: response.point };
}
