import type { TravelCompanion, Trip, TripPlanningItem } from '@prisma/client';
import type {
  TripPlanningItemDto,
  TripPlanningResponseDto,
  TripPlanningSummaryDto,
} from '../types.js';

export type TripPlanningItemWithRelations = TripPlanningItem & {
  createdByCompanion: TravelCompanion;
  trip?: Trip;
};

function toIsoString(value: Date) {
  return value.toISOString();
}

function toDateOnlyString(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function buildTripPlanningSummary(
  items: Array<Pick<TripPlanningItem, 'status' | 'priority'>>,
): TripPlanningSummaryDto {
  return {
    total: items.length,
    plannedCount: items.filter((item) => item.status === 'planned').length,
    convertedCount: items.filter((item) => item.status === 'converted').length,
    highPriorityCount: items.filter((item) => item.priority === 'high').length,
  };
}

export function serializeTripPlanningItem(item: TripPlanningItemWithRelations): TripPlanningItemDto {
  return {
    id: item.id,
    tripId: item.tripId,
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
    plannedDate: item.plannedDate ? toDateOnlyString(item.plannedDate) : undefined,
    status: item.status,
    convertedMarkerId: item.convertedMarkerId ?? undefined,
    sourceGuideIdentity: item.sourceGuideIdentity ?? undefined,
    sourceGuideTitle: item.sourceGuideTitle ?? undefined,
    sourceGuideSourceName: item.sourceGuideSourceName ?? undefined,
    sourceGuideSourceUrl: item.sourceGuideSourceUrl ?? undefined,
    sortOrder: item.sortOrder,
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
  };
}

export function serializeTripPlanningResponse(
  items: TripPlanningItemWithRelations[],
): TripPlanningResponseDto {
  return {
    summary: buildTripPlanningSummary(items),
    items: items.map(serializeTripPlanningItem),
  };
}
