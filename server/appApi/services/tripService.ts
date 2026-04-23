import { randomUUID } from 'node:crypto';
import { createNotFoundError, createValidationError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import {
  createTrip,
  findActiveTripById,
  softDeleteTrip,
  updateTrip,
} from '../repositories/tripRepository.js';
import type { CreateTripBody, UpdateTripBody } from '../schemas/trips.js';
import { buildCurrentStoreSnapshot } from './storeSnapshotService.js';

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function createTripCollection(accountId: string, input: CreateTripBody) {
  const prisma = getPrismaClient();

  await createTrip(prisma, {
    id: randomUUID(),
    accountId,
    name: input.name,
    coverImageUrl: input.coverImageUrl,
    note: input.note,
    startsAt: parseDateOnly(input.startsAt),
    endsAt: parseDateOnly(input.endsAt),
  });

  return buildCurrentStoreSnapshot(accountId);
}

export async function updateTripCollection(
  accountId: string,
  tripId: string,
  input: UpdateTripBody,
) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    const trip = await findActiveTripById(tx, accountId, tripId);

    if (!trip) {
      throw createNotFoundError('trip not found');
    }

    const nextStartsAt = input.startsAt ?? trip.startsAt.toISOString().slice(0, 10);
    const nextEndsAt = input.endsAt ?? trip.endsAt.toISOString().slice(0, 10);

    if (nextEndsAt < nextStartsAt) {
      throw createValidationError('endsAt must be later than or equal to startsAt');
    }

    await updateTrip(tx, tripId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.coverImageUrl !== undefined ? { coverImageUrl: input.coverImageUrl } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.startsAt !== undefined ? { startsAt: parseDateOnly(input.startsAt) } : {}),
      ...(input.endsAt !== undefined ? { endsAt: parseDateOnly(input.endsAt) } : {}),
    });
  });

  return buildCurrentStoreSnapshot(accountId);
}

export async function deleteTripCollection(accountId: string, tripId: string) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    const trip = await findActiveTripById(tx, accountId, tripId);

    if (!trip) {
      throw createNotFoundError('trip not found');
    }

    await softDeleteTrip(tx, tripId, new Date());
  });

  return buildCurrentStoreSnapshot(accountId);
}
