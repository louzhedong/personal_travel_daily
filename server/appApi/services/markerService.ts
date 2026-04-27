import { randomUUID } from 'node:crypto';
import { createNotFoundError, createValidationError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type {
  BatchUpdateMarkersTripBody,
  CreateMarkerBody,
  UpdateMarkerBody,
} from '../schemas/markers.js';
import type { SearchMarkersQuery } from '../schemas/markers.js';
import {
  findActiveCompanionById,
} from '../repositories/travelCompanionRepository.js';
import { findActiveTripById } from '../repositories/tripRepository.js';
import {
  createMarker,
  findActiveMarkersByIds,
  findActiveMarkerById,
  searchActiveMarkersByAccountId,
  softDeleteMarker,
  updateMarker,
  updateMarkersTripId,
} from '../repositories/visitMarkerRepository.js';
import { softDeleteSavedGuidesByMarkerId } from '../repositories/savedGuideRepository.js';
import { createMarkerSearchEvent } from '../repositories/markerSearchEventRepository.js';
import { buildCurrentStoreSnapshot } from './storeSnapshotService.js';
import { serializeMarker } from '../serializers/bootstrapSerializer.js';
import type { MarkerSearchResponseDto } from '../types.js';

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function createMarkerRecord(accountId: string, input: CreateMarkerBody) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    const companion = await findActiveCompanionById(tx, accountId, input.companionId);
    if (!companion) {
      throw createNotFoundError('companion not found');
    }

    if (input.tripId) {
      const trip = await findActiveTripById(tx, accountId, input.tripId);
      if (!trip) {
        throw createNotFoundError('trip not found');
      }
    }

    await createMarker(tx, {
      id: randomUUID(),
      accountId,
      companionId: input.companionId,
      tripId: input.tripId,
      scope: input.scope,
      scopeId: input.scopeId,
      scopeName: input.scopeName,
      city: input.city,
      note: input.note,
      visitedStartAt: parseDateOnly(input.visitedStartAt),
      visitedEndAt: parseDateOnly(input.visitedEndAt),
      imageUrls: input.imageUrls,
    });
  });

  return buildCurrentStoreSnapshot(accountId);
}

export async function updateMarkerRecord(
  accountId: string,
  markerId: string,
  input: UpdateMarkerBody,
) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    const marker = await findActiveMarkerById(tx, accountId, markerId);

    if (!marker) {
      throw createNotFoundError('marker not found');
    }

    const nextStartAt = input.visitedStartAt ?? marker.visitedStartAt.toISOString().slice(0, 10);
    const nextEndAt = input.visitedEndAt ?? marker.visitedEndAt.toISOString().slice(0, 10);

    if (nextEndAt < nextStartAt) {
      throw createValidationError('visitedEndAt must be later than or equal to visitedStartAt');
    }

    if (input.tripId) {
      const trip = await findActiveTripById(tx, accountId, input.tripId);
      if (!trip) {
        throw createNotFoundError('trip not found');
      }
    }

    await updateMarker(tx, markerId, {
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.visitedStartAt !== undefined ? { visitedStartAt: parseDateOnly(input.visitedStartAt) } : {}),
      ...(input.visitedEndAt !== undefined ? { visitedEndAt: parseDateOnly(input.visitedEndAt) } : {}),
      ...(input.tripId !== undefined ? { tripId: input.tripId } : {}),
      ...(input.imageUrls !== undefined ? { imageUrls: input.imageUrls } : {}),
    });
  });

  return buildCurrentStoreSnapshot(accountId);
}

export async function deleteMarkerRecord(accountId: string, markerId: string) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    const marker = await findActiveMarkerById(tx, accountId, markerId);

    if (!marker) {
      throw createNotFoundError('marker not found');
    }

    const deletedAt = new Date();
    await softDeleteMarker(tx, markerId, deletedAt);
    await softDeleteSavedGuidesByMarkerId(tx, markerId, deletedAt);
  });

  return buildCurrentStoreSnapshot(accountId);
}

export async function batchUpdateMarkersTrip(
  accountId: string,
  input: BatchUpdateMarkersTripBody,
) {
  const prisma = getPrismaClient();
  const markerIds = Array.from(new Set(input.markerIds));

  await prisma.$transaction(async (tx) => {
    const markers = await findActiveMarkersByIds(tx, accountId, markerIds);

    if (markers.length !== markerIds.length) {
      throw createNotFoundError('marker not found');
    }

    if (input.tripId) {
      const trip = await findActiveTripById(tx, accountId, input.tripId);
      if (!trip) {
        throw createNotFoundError('trip not found');
      }
    }

    await updateMarkersTripId(tx, markerIds, input.tripId ?? null);
  });

  return buildCurrentStoreSnapshot(accountId);
}

export async function searchMarkerRecords(
  accountId: string,
  query: SearchMarkersQuery,
): Promise<MarkerSearchResponseDto> {
  const prisma = getPrismaClient();
  const keyword = query.keyword?.trim();
  const { items, total } = await searchActiveMarkersByAccountId(prisma, {
    accountId,
    keyword: keyword || undefined,
    companionId: query.companionId,
    scope: query.scope,
    year: query.year,
    page: query.page,
    pageSize: query.pageSize,
  });

  await createMarkerSearchEvent(prisma, {
    id: randomUUID(),
    accountId,
    companionId: query.companionId,
    keyword: keyword || '',
    scope: query.scope,
    year: query.year,
    resultCount: total,
    page: query.page,
    pageSize: query.pageSize,
  });

  return {
    items: items.map(serializeMarker),
    page: query.page,
    pageSize: query.pageSize,
    total,
    hasMore: query.page * query.pageSize < total,
  };
}
