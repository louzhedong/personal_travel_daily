import { randomUUID } from 'node:crypto';
import { createNotFoundError, createValidationError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type { CreateMarkerBody, UpdateMarkerBody } from '../schemas/markers.js';
import {
  findActiveCompanionById,
} from '../repositories/travelCompanionRepository.js';
import { findActiveTripById } from '../repositories/tripRepository.js';
import {
  createMarker,
  findActiveMarkerById,
  softDeleteMarker,
  updateMarker,
} from '../repositories/visitMarkerRepository.js';
import { softDeleteSavedGuidesByMarkerId } from '../repositories/savedGuideRepository.js';
import { buildCurrentStoreSnapshot } from './storeSnapshotService.js';

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
