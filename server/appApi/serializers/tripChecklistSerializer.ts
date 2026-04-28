import type { TravelCompanion, TripChecklistItem } from '@prisma/client';
import type {
  GenerateTripChecklistResultDto,
  TripChecklistGroupDto,
  TripChecklistItemDto,
  TripChecklistResponseDto,
  TripChecklistStageDto,
  TripChecklistSummaryDto,
} from '../types.js';
import { buildTripChecklistGroupMeta, serializeTripChecklistItem } from './tripDetailSerializer.js';

type ChecklistItemWithCompanion = TripChecklistItem & {
  createdByCompanion: TravelCompanion;
};

const STAGE_ORDER: TripChecklistStageDto[] = ['pre_departure', 'in_transit', 'done'];

export function buildTripChecklistSummary(items: ChecklistItemWithCompanion[]): TripChecklistSummaryDto {
  return {
    total: items.length,
    preDepartureCount: items.filter((item) => item.stage === 'pre_departure').length,
    inTransitCount: items.filter((item) => item.stage === 'in_transit').length,
    doneCount: items.filter((item) => item.stage === 'done').length,
  };
}

export function buildTripChecklistGroups(items: ChecklistItemWithCompanion[]): TripChecklistGroupDto[] {
  const grouped = new Map<TripChecklistStageDto, TripChecklistItemDto[]>();
  STAGE_ORDER.forEach((stage) => grouped.set(stage, []));

  items.forEach((item) => {
    grouped.get(item.stage)?.push(serializeTripChecklistItem(item));
  });

  return STAGE_ORDER.map((stage) => {
    const stageItems = grouped.get(stage) ?? [];
    const meta = buildTripChecklistGroupMeta(stage);
    return {
      stage,
      title: meta.title,
      description: meta.description,
      itemCount: stageItems.length,
      items: stageItems,
    };
  });
}

export function serializeTripChecklistResponse(
  items: ChecklistItemWithCompanion[],
): TripChecklistResponseDto {
  return {
    summary: buildTripChecklistSummary(items),
    groups: buildTripChecklistGroups(items),
  };
}

export function serializeGenerateTripChecklistResult(input: {
  createdCount: number;
  deduplicatedCount: number;
  items: ChecklistItemWithCompanion[];
}): GenerateTripChecklistResultDto {
  return {
    createdCount: input.createdCount,
    deduplicatedCount: input.deduplicatedCount,
    items: input.items.map(serializeTripChecklistItem),
  };
}
