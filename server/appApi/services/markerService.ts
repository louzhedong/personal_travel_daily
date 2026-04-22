import { ulid } from 'ulid';
import { createNotFoundError, createValidationError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type { CreateMarkerBody, UpdateMarkerBody } from '../schemas/markers.js';
import { ensureDefaultAppState } from './appContextService.js';
import {
  findActiveCompanionById,
} from '../repositories/travelCompanionRepository.js';
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

export async function createMarkerRecord(input: CreateMarkerBody) {
  const prisma = getPrismaClient();

  const accountId = await prisma.$transaction(async (tx) => {
    const context = await ensureDefaultAppState(tx);
    const companion = await findActiveCompanionById(tx, context.accountId, input.companionId);
    if (!companion) {
      throw createNotFoundError('companion not found');
    }

    await createMarker(tx, {
      id: ulid(),
      accountId: context.accountId,
      companionId: input.companionId,
      scope: input.scope,
      scopeId: input.scopeId,
      scopeName: input.scopeName,
      city: input.city,
      note: input.note,
      visitedStartAt: parseDateOnly(input.visitedStartAt),
      visitedEndAt: parseDateOnly(input.visitedEndAt),
      imageUrls: input.imageUrls,
    });

    return context.accountId;
  });

  return buildCurrentStoreSnapshot(accountId);
}

export async function updateMarkerRecord(
  markerId: string,
  input: UpdateMarkerBody,
) {
  const prisma = getPrismaClient();

  const accountId = await prisma.$transaction(async (tx) => {
    const context = await ensureDefaultAppState(tx);
    const marker = await findActiveMarkerById(tx, context.accountId, markerId);

    if (!marker) {
      throw createNotFoundError('marker not found');
    }

    const nextStartAt = input.visitedStartAt ?? marker.visitedStartAt.toISOString().slice(0, 10);
    const nextEndAt = input.visitedEndAt ?? marker.visitedEndAt.toISOString().slice(0, 10);

    if (nextEndAt < nextStartAt) {
      throw createValidationError('visitedEndAt must be later than or equal to visitedStartAt');
    }

    await updateMarker(tx, markerId, {
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.visitedStartAt !== undefined ? { visitedStartAt: parseDateOnly(input.visitedStartAt) } : {}),
      ...(input.visitedEndAt !== undefined ? { visitedEndAt: parseDateOnly(input.visitedEndAt) } : {}),
      ...(input.imageUrls !== undefined ? { imageUrls: input.imageUrls } : {}),
    });

    return context.accountId;
  });

  return buildCurrentStoreSnapshot(accountId);
}

export async function deleteMarkerRecord(markerId: string) {
  const prisma = getPrismaClient();

  const accountId = await prisma.$transaction(async (tx) => {
    const context = await ensureDefaultAppState(tx);
    const marker = await findActiveMarkerById(tx, context.accountId, markerId);

    if (!marker) {
      throw createNotFoundError('marker not found');
    }

    const deletedAt = new Date();
    await softDeleteMarker(tx, markerId, deletedAt);
    await softDeleteSavedGuidesByMarkerId(tx, markerId, deletedAt);

    return context.accountId;
  });

  return buildCurrentStoreSnapshot(accountId);
}
