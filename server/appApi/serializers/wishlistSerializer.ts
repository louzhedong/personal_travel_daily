import type { TravelCompanion, Trip, TripPlanningItem, WishlistItem } from '@prisma/client';
import type { WishlistItemDto } from '../types.js';
import { toIsoString } from './bootstrap/shared.js';

export type WishlistItemWithRelations = WishlistItem & {
  createdByCompanion: TravelCompanion;
  planningItems?: Array<TripPlanningItem & { trip: Trip }>;
};

export function serializeWishlistItem(item: WishlistItemWithRelations): WishlistItemDto {
  return {
    id: item.id,
    companionId: item.createdByCompanionId,
    companionName: item.createdByCompanion.name,
    companionColor: item.createdByCompanion.color,
    title: item.title,
    scope: item.scope,
    scopeId: item.scopeId,
    scopeName: item.scopeName,
    city: item.city,
    note: item.note ?? undefined,
    priority: item.priority,
    targetYear: item.targetYear ?? undefined,
    sourceGuideIdentity: item.sourceGuideIdentity ?? undefined,
    sourceGuideTitle: item.sourceGuideTitle ?? undefined,
    sourceGuideSourceName: item.sourceGuideSourceName ?? undefined,
    sourceGuideSourceUrl: item.sourceGuideSourceUrl ?? undefined,
    importedTrips: Array.from(
      new Map(
        (item.planningItems ?? [])
          .filter((planningItem) => !planningItem.trip.isDeleted)
          .map((planningItem) => [planningItem.trip.id, {
            id: planningItem.trip.id,
            name: planningItem.trip.name,
          }]),
      ).values(),
    ),
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
  };
}
