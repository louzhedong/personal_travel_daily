// bootstrap serializer - markers / 打卡点序列化。
// bootstrap serializer - visit marker serialization.
import type { VisitMarker, VisitMarkerImage } from '@prisma/client';
import type { VisitMarkerDto } from '../../types.js';
import { toDateOnlyString, toIsoString } from './shared.js';

export type MarkerWithImages = VisitMarker & {
  images: VisitMarkerImage[];
};

export function serializeMarker(marker: MarkerWithImages): VisitMarkerDto {
  const imageUrls = marker.images.map((image) => image.imageUrl).filter(Boolean);

  return {
    id: marker.id,
    userId: marker.companionId,
    tripId: marker.tripId ?? undefined,
    scope: marker.scope,
    scopeId: marker.scopeId,
    scopeName: marker.scopeName,
    city: marker.city,
    note: marker.note,
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    visitedStartAt: toDateOnlyString(marker.visitedStartAt),
    visitedEndAt: toDateOnlyString(marker.visitedEndAt),
    createdAt: toIsoString(marker.createdAt),
  };
}
