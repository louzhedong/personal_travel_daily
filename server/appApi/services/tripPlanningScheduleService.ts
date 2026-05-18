import { randomUUID } from 'node:crypto';
import { createNotFoundError, createConflictError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import {
  createTripPlanningItem,
  findActiveTripPlanningItemById,
  getNextTripPlanningSortOrder,
  listActiveTripPlanningItemsByTripId,
  updateTripPlanningItem,
} from '../repositories/tripPlanningRepository.js';
import { listActiveTripChecklistItemsByTripId } from '../repositories/tripChecklistRepository.js';
import { findActiveTripById } from '../repositories/tripRepository.js';
import { findActiveWishlistItemById } from '../repositories/wishlistRepository.js';
import type {
  ImportTripPlanningScheduleWishlistBody,
  UpdateTripPlanningItemScheduleBody,
} from '../schemas/tripPlanning.js';
import {
  serializeTripPlanningItem,
  buildTripPlanningSummary,
} from '../serializers/tripPlanningSerializer.js';
import { serializeTripChecklistResponse } from '../serializers/tripChecklistSerializer.js';
import type { TripPlanningScheduleResponseDto } from '../types.js';

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function toDateOnlyString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

async function buildScheduleResponse(accountId: string, tripId: string): Promise<TripPlanningScheduleResponseDto> {
  const prisma = getPrismaClient();
  const [trip, planningItems, checklistItems] = await Promise.all([
    findActiveTripById(prisma, accountId, tripId),
    listActiveTripPlanningItemsByTripId(prisma, accountId, tripId),
    listActiveTripChecklistItemsByTripId(prisma, accountId, tripId),
  ]);

  if (!trip) {
    throw createNotFoundError('trip not found');
  }

  const serializedItems = planningItems.map(serializeTripPlanningItem);
  const checklistGroups = serializeTripChecklistResponse(checklistItems).groups;
  const tripStart = toDateOnlyString(trip.startsAt);
  const tripEnd = toDateOnlyString(trip.endsAt);
  const days: TripPlanningScheduleResponseDto['days'] = [];

  for (let cursor = parseDateOnly(tripStart), index = 0; toDateOnlyString(cursor) <= tripEnd; cursor = addDays(cursor, 1), index += 1) {
    const date = toDateOnlyString(cursor);
    const dayChecklistGroups = index === 0 ? checklistGroups.filter((group) => group.stage === 'pre_departure') : checklistGroups.filter((group) => group.stage === 'in_transit');
    days.push({
      date,
      dayIndex: index + 1,
      title: `Day ${index + 1}`,
      items: serializedItems.filter((item) => item.plannedDate === date),
      checklistGroups: dayChecklistGroups,
    });
  }

  return {
    summary: buildTripPlanningSummary(planningItems),
    days,
    unscheduledItems: serializedItems.filter((item) => !item.plannedDate),
    checklistGroups,
  };
}

export async function getTripPlanningSchedule(accountId: string, tripId: string) {
  return buildScheduleResponse(accountId, tripId);
}

export async function updateTripPlanningItemSchedule(
  accountId: string,
  tripId: string,
  itemId: string,
  input: UpdateTripPlanningItemScheduleBody,
) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    const existing = await findActiveTripPlanningItemById(tx, accountId, tripId, itemId);
    if (!existing) {
      throw createNotFoundError('planning item not found');
    }
    if (existing.status === 'converted') {
      throw createConflictError('converted planning item cannot be scheduled');
    }

    await updateTripPlanningItem(tx, itemId, {
      plannedDate: input.plannedDate ? parseDateOnly(input.plannedDate) : null,
    });
  });

  return buildScheduleResponse(accountId, tripId);
}

export async function importWishlistItemsToTripPlanningSchedule(
  accountId: string,
  tripId: string,
  input: ImportTripPlanningScheduleWishlistBody,
) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    const trip = await findActiveTripById(tx, accountId, tripId);
    if (!trip) {
      throw createNotFoundError('trip not found');
    }

    let sortOrder = await getNextTripPlanningSortOrder(tx, accountId, tripId);
    for (const wishlistId of input.wishlistIds) {
      const wishlistItem = await findActiveWishlistItemById(tx, accountId, wishlistId);
      if (!wishlistItem) {
        throw createNotFoundError('wishlist item not found');
      }

      await createTripPlanningItem(tx, {
        id: randomUUID(),
        accountId,
        tripId,
        createdByCompanionId: wishlistItem.createdByCompanionId,
        title: wishlistItem.title,
        scope: wishlistItem.scope,
        scopeId: wishlistItem.scopeId,
        scopeName: wishlistItem.scopeName,
        city: wishlistItem.city,
        note: wishlistItem.note ?? undefined,
        priority: wishlistItem.priority,
        plannedDate: parseDateOnly(input.plannedDate),
        sourceGuideIdentity: wishlistItem.sourceGuideIdentity ?? undefined,
        sourceGuideTitle: wishlistItem.sourceGuideTitle ?? undefined,
        sourceGuideSourceName: wishlistItem.sourceGuideSourceName ?? undefined,
        sourceGuideSourceUrl: wishlistItem.sourceGuideSourceUrl ?? undefined,
        sourceWishlistId: wishlistItem.id,
        sortOrder,
      });
      sortOrder += 1;
    }
  });

  return buildScheduleResponse(accountId, tripId);
}
