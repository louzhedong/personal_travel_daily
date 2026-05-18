import { randomUUID } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import { createConflictError, createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import {
  createTripPlanningItem,
  findActiveTripPlanningItemById,
  getNextTripPlanningSortOrder,
  listActiveTripPlanningItemsByTripId,
  softDeleteTripPlanningItem,
  updateTripPlanningItem,
} from '../repositories/tripPlanningRepository.js';
import { findActiveCompanionById } from '../repositories/travelCompanionRepository.js';
import { findActiveTripById } from '../repositories/tripRepository.js';
import { createMarker } from '../repositories/visitMarkerRepository.js';
import { findActiveWishlistItemById } from '../repositories/wishlistRepository.js';
import type {
  ConvertTripPlanningItemBody,
  CreateTripPlanningItemBody,
  UpdateTripPlanningItemBody,
} from '../schemas/tripPlanning.js';
import {
  serializeTripPlanningItem,
  serializeTripPlanningResponse,
} from '../serializers/tripPlanningSerializer.js';
import { buildCurrentStoreSnapshot } from './storeSnapshotService.js';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function normalizeGuideIdentity(sourceUrl?: string, identity?: string) {
  return identity?.trim() || sourceUrl?.trim().toLowerCase() || undefined;
}

async function assertTripAndCompanion(
  accountId: string,
  tripId: string,
  companionId: string,
  tx: PrismaExecutor,
) {
  const [trip, companion] = await Promise.all([
    findActiveTripById(tx, accountId, tripId),
    findActiveCompanionById(tx, accountId, companionId),
  ]);

  if (!trip) {
    throw createNotFoundError('trip not found');
  }

  if (!companion) {
    throw createNotFoundError('companion not found');
  }
}

export async function listTripPlanning(accountId: string, tripId: string) {
  const prisma = getPrismaClient();
  const trip = await findActiveTripById(prisma, accountId, tripId);
  if (!trip) {
    throw createNotFoundError('trip not found');
  }

  const items = await listActiveTripPlanningItemsByTripId(prisma, accountId, tripId);
  return serializeTripPlanningResponse(items);
}

export async function createTripPlanningItemResource(
  accountId: string,
  tripId: string,
  input: CreateTripPlanningItemBody,
) {
  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    await assertTripAndCompanion(accountId, tripId, input.companionId, tx);
    const sortOrder = await getNextTripPlanningSortOrder(tx, accountId, tripId);
    const created = await createTripPlanningItem(tx, {
      id: randomUUID(),
      accountId,
      tripId,
      createdByCompanionId: input.companionId,
      title: input.title.trim(),
      scope: input.scope,
      scopeId: input.scopeId.trim(),
      scopeName: input.scopeName.trim(),
      city: input.city.trim(),
      note: input.note?.trim() || undefined,
      priority: input.priority,
      plannedDate: input.plannedDate ? parseDateOnly(input.plannedDate) : null,
      sourceGuideIdentity: normalizeGuideIdentity(input.guide?.sourceUrl, input.guide?.identity),
      sourceGuideTitle: input.guide?.title,
      sourceGuideSourceName: input.guide?.sourceName,
      sourceGuideSourceUrl: input.guide?.sourceUrl,
      sourceWishlistId: undefined,
      sortOrder,
    });

    return serializeTripPlanningItem(created);
  });
}

export async function createTripPlanningItemFromWishlist(
  accountId: string,
  tripId: string,
  wishlistId: string,
  plannedDate?: string | null,
) {
  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    const [trip, wishlistItem] = await Promise.all([
      findActiveTripById(tx, accountId, tripId),
      findActiveWishlistItemById(tx, accountId, wishlistId),
    ]);

    if (!trip) {
      throw createNotFoundError('trip not found');
    }

    if (!wishlistItem) {
      throw createNotFoundError('wishlist item not found');
    }

    const sortOrder = await getNextTripPlanningSortOrder(tx, accountId, tripId);
    const created = await createTripPlanningItem(tx, {
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
      plannedDate: plannedDate ? parseDateOnly(plannedDate) : null,
      sourceGuideIdentity: wishlistItem.sourceGuideIdentity ?? undefined,
      sourceGuideTitle: wishlistItem.sourceGuideTitle ?? undefined,
      sourceGuideSourceName: wishlistItem.sourceGuideSourceName ?? undefined,
      sourceGuideSourceUrl: wishlistItem.sourceGuideSourceUrl ?? undefined,
      sourceWishlistId: wishlistItem.id,
      sortOrder,
    });

    return serializeTripPlanningItem(created);
  });
}

export async function updateTripPlanningItemResource(
  accountId: string,
  tripId: string,
  itemId: string,
  input: UpdateTripPlanningItemBody,
) {
  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    const existing = await findActiveTripPlanningItemById(tx, accountId, tripId, itemId);
    if (!existing) {
      throw createNotFoundError('planning item not found');
    }

    if (existing.status === 'converted') {
      throw createConflictError('converted planning item cannot be edited');
    }

    const updated = await updateTripPlanningItem(tx, itemId, {
      title: input.title?.trim(),
      scope: input.scope,
      scopeId: input.scopeId?.trim(),
      scopeName: input.scopeName?.trim(),
      city: input.city?.trim(),
      note: input.note === undefined ? undefined : input.note?.trim() || null,
      priority: input.priority,
      plannedDate:
        input.plannedDate === undefined
          ? undefined
          : input.plannedDate
            ? parseDateOnly(input.plannedDate)
            : null,
      sortOrder: input.sortOrder,
    });

    return serializeTripPlanningItem(updated);
  });
}

export async function deleteTripPlanningItemResource(accountId: string, tripId: string, itemId: string) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    const existing = await findActiveTripPlanningItemById(tx, accountId, tripId, itemId);
    if (!existing) {
      throw createNotFoundError('planning item not found');
    }

    await softDeleteTripPlanningItem(tx, itemId, new Date());
  });

  return {
    deletedId: itemId,
  };
}

export async function convertTripPlanningItemToMarker(
  accountId: string,
  tripId: string,
  itemId: string,
  input: ConvertTripPlanningItemBody,
) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    const item = await findActiveTripPlanningItemById(tx, accountId, tripId, itemId);
    if (!item) {
      throw createNotFoundError('planning item not found');
    }

    if (item.status === 'converted') {
      throw createConflictError('planning item already converted');
    }

    const marker = await createMarker(tx, {
      id: randomUUID(),
      accountId,
      companionId: item.createdByCompanionId,
      tripId,
      scope: item.scope,
      scopeId: item.scopeId,
      scopeName: item.scopeName,
      city: item.city,
      note: input.note?.trim() || item.note || item.title,
      visitedStartAt: parseDateOnly(input.visitedStartAt),
      visitedEndAt: parseDateOnly(input.visitedEndAt),
    });

    await updateTripPlanningItem(tx, itemId, {
      convertedMarkerId: marker.id,
    });
  });

  return buildCurrentStoreSnapshot(accountId);
}
