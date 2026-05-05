import { randomUUID } from 'node:crypto';
import { getPrismaClient } from '../prisma.js';
import { createConflictError, createNotFoundError } from '../errors.js';
import { findActiveCompanionById } from '../repositories/travelCompanionRepository.js';
import { createTrip } from '../repositories/tripRepository.js';
import {
  createTripPlanningItem,
  getNextTripPlanningSortOrder,
} from '../repositories/tripPlanningRepository.js';
import {
  createWishlistItem,
  findDuplicateActiveWishlistItem,
  findActiveWishlistItemById,
  listActiveWishlistItemsByAccountId,
  softDeleteWishlistItem,
  updateWishlistItem,
} from '../repositories/wishlistRepository.js';
import type {
  ConvertWishlistToTripBody,
  CreateWishlistItemBody,
  UpdateWishlistItemBody,
} from '../schemas/wishlist.js';
import { serializeWishlistItem } from '../serializers/wishlistSerializer.js';
import { buildCurrentStoreSnapshot } from './storeSnapshotService.js';

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeGuideIdentity(sourceUrl?: string, identity?: string) {
  return identity?.trim() || sourceUrl?.trim().toLowerCase() || undefined;
}

export async function listWishlistItems(accountId: string) {
  const prisma = getPrismaClient();
  const items = await listActiveWishlistItemsByAccountId(prisma, accountId);
  return {
    items: items.map(serializeWishlistItem),
  };
}

export async function createWishlistItemResource(accountId: string, input: CreateWishlistItemBody) {
  const prisma = getPrismaClient();

  const created = await prisma.$transaction(async (tx) => {
    const companion = await findActiveCompanionById(tx, accountId, input.companionId);
    if (!companion) {
      throw createNotFoundError('companion not found');
    }

    const duplicate = await findDuplicateActiveWishlistItem(tx, {
      accountId,
      companionId: input.companionId,
      scope: input.scope,
      scopeId: input.scopeId.trim(),
      city: input.city.trim(),
    });

    if (duplicate) {
      throw createConflictError('wishlist item already exists');
    }

    return createWishlistItem(tx, {
      id: randomUUID(),
      accountId,
      createdByCompanionId: input.companionId,
      title: input.title.trim(),
      scope: input.scope,
      scopeId: input.scopeId.trim(),
      scopeName: input.scopeName.trim(),
      city: input.city.trim(),
      note: input.note?.trim() || undefined,
      priority: input.priority,
      targetYear: input.targetYear || null,
      sourceGuideIdentity: normalizeGuideIdentity(input.guide?.sourceUrl, input.guide?.identity),
      sourceGuideTitle: input.guide?.title,
      sourceGuideSourceName: input.guide?.sourceName,
      sourceGuideSourceUrl: input.guide?.sourceUrl,
    });
  });

  return serializeWishlistItem(created);
}

export async function updateWishlistItemResource(
  accountId: string,
  itemId: string,
  input: UpdateWishlistItemBody,
) {
  const prisma = getPrismaClient();

  const updated = await prisma.$transaction(async (tx) => {
    const existing = await findActiveWishlistItemById(tx, accountId, itemId);
    if (!existing) {
      throw createNotFoundError('wishlist item not found');
    }

    return updateWishlistItem(tx, itemId, {
      title: input.title?.trim(),
      scope: input.scope,
      scopeId: input.scopeId?.trim(),
      scopeName: input.scopeName?.trim(),
      city: input.city?.trim(),
      note: input.note === undefined ? undefined : input.note?.trim() || null,
      priority: input.priority,
      targetYear: input.targetYear === undefined ? undefined : input.targetYear || null,
    });
  });

  return serializeWishlistItem(updated);
}

export async function convertWishlistItemToTrip(
  accountId: string,
  itemId: string,
  input: ConvertWishlistToTripBody,
) {
  const prisma = getPrismaClient();
  const tripId = randomUUID();

  await prisma.$transaction(async (tx) => {
    const wishlistItem = await findActiveWishlistItemById(tx, accountId, itemId);
    if (!wishlistItem) {
      throw createNotFoundError('wishlist item not found');
    }

    const defaultDate = wishlistItem.targetYear ? `${wishlistItem.targetYear}-01-01` : todayDateOnly();
    const startsAt = input.startsAt ?? defaultDate;
    const endsAt = input.endsAt ?? startsAt;
    const name = input.name?.trim() || wishlistItem.title;

    await createTrip(tx, {
      id: tripId,
      accountId,
      name,
      note: input.note?.trim() || wishlistItem.note || `从愿望地图创建：${wishlistItem.scopeName} · ${wishlistItem.city}`,
      startsAt: parseDateOnly(startsAt),
      endsAt: parseDateOnly(endsAt),
    });

    const sortOrder = await getNextTripPlanningSortOrder(tx, accountId, tripId);
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
      plannedDate: null,
      sourceGuideIdentity: wishlistItem.sourceGuideIdentity ?? undefined,
      sourceGuideTitle: wishlistItem.sourceGuideTitle ?? undefined,
      sourceGuideSourceName: wishlistItem.sourceGuideSourceName ?? undefined,
      sourceGuideSourceUrl: wishlistItem.sourceGuideSourceUrl ?? undefined,
      sourceWishlistId: wishlistItem.id,
      sortOrder,
    });
  });

  return {
    tripId,
    store: await buildCurrentStoreSnapshot(accountId),
  };
}

export async function deleteWishlistItemResource(accountId: string, itemId: string) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    const existing = await findActiveWishlistItemById(tx, accountId, itemId);
    if (!existing) {
      throw createNotFoundError('wishlist item not found');
    }

    await softDeleteWishlistItem(tx, itemId, new Date());
  });

  return {
    deletedId: itemId,
  };
}

export async function getWishlistBackedStore(accountId: string) {
  return buildCurrentStoreSnapshot(accountId);
}
