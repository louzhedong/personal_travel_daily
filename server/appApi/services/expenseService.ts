import { randomUUID } from 'node:crypto';
import { createNotFoundError, createValidationError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type {
  CreateTripExpenseBody,
  CreateTripExpenseDraftFromPlanningBody,
  UpdateTripExpenseBody,
} from '../schemas/expenses.js';
import {
  createTripExpense,
  findActiveTripExpenseById,
  listActiveTripExpensesByTripId,
  softDeleteTripExpense,
  updateTripExpense,
} from '../repositories/expenseRepository.js';
import { serializeTripExpense, serializeTripExpenseList } from '../serializers/expenseSerializer.js';

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function countTripDays(startsAt: Date, endsAt: Date) {
  const start = Date.UTC(startsAt.getUTCFullYear(), startsAt.getUTCMonth(), startsAt.getUTCDate());
  const end = Date.UTC(endsAt.getUTCFullYear(), endsAt.getUTCMonth(), endsAt.getUTCDate());
  return Math.max(1, Math.floor((end - start) / 86_400_000) + 1);
}

async function findActiveTrip(prisma: ReturnType<typeof getPrismaClient>, accountId: string, tripId: string) {
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      accountId,
      isDeleted: false,
    },
    include: {
      markers: {
        where: {
          isDeleted: false,
        },
        select: {
          companionId: true,
        },
      },
    },
  });

  if (!trip) {
    throw createNotFoundError('trip not found');
  }

  return trip;
}

async function assertCompanion(
  prisma: ReturnType<typeof getPrismaClient>,
  accountId: string,
  companionId?: string | null,
) {
  if (!companionId) {
    return;
  }

  const companion = await prisma.travelCompanion.findFirst({
    where: {
      id: companionId,
      accountId,
      isDeleted: false,
    },
  });

  if (!companion) {
    throw createNotFoundError('companion not found');
  }
}

function buildListOptions(trip: Awaited<ReturnType<typeof findActiveTrip>>) {
  return {
    travelDays: countTripDays(trip.startsAt, trip.endsAt),
    companionCount: new Set(trip.markers.map((marker) => marker.companionId)).size || undefined,
  };
}

export async function listTripExpenses(accountId: string, tripId: string) {
  const prisma = getPrismaClient();
  const trip = await findActiveTrip(prisma, accountId, tripId);
  const expenses = await listActiveTripExpensesByTripId(prisma, accountId, tripId);
  return serializeTripExpenseList(tripId, expenses, buildListOptions(trip));
}

export async function createTripExpenseResource(accountId: string, input: CreateTripExpenseBody) {
  const prisma = getPrismaClient();
  await findActiveTrip(prisma, accountId, input.tripId);
  await assertCompanion(prisma, accountId, input.companionId);

  if (input.sourcePlanningItemId) {
    const planningItem = await prisma.tripPlanningItem.findFirst({
      where: {
        id: input.sourcePlanningItemId,
        accountId,
        tripId: input.tripId,
        isDeleted: false,
      },
    });
    if (!planningItem) {
      throw createNotFoundError('planning item not found');
    }
  }

  const expense = await createTripExpense(prisma, {
    id: randomUUID(),
    accountId,
    tripId: input.tripId,
    companionId: input.companionId ?? null,
    sourcePlanningItemId: input.sourcePlanningItemId ?? null,
    title: input.title,
    category: input.category,
    amountCents: input.amountCents,
    currency: input.currency.toUpperCase(),
    spentAt: parseDateOnly(input.spentAt),
    note: input.note ?? null,
    status: input.status,
  });

  return serializeTripExpense(expense);
}

export async function updateTripExpenseResource(accountId: string, expenseId: string, input: UpdateTripExpenseBody) {
  const prisma = getPrismaClient();
  const current = await findActiveTripExpenseById(prisma, accountId, expenseId);

  if (!current) {
    throw createNotFoundError('expense not found');
  }

  await assertCompanion(prisma, accountId, input.companionId);
  if (input.sourcePlanningItemId) {
    const planningItem = await prisma.tripPlanningItem.findFirst({
      where: {
        id: input.sourcePlanningItemId,
        accountId,
        tripId: current.tripId,
        isDeleted: false,
      },
    });
    if (!planningItem) {
      throw createNotFoundError('planning item not found');
    }
  }

  const expense = await updateTripExpense(prisma, expenseId, {
    ...input,
    currency: input.currency?.toUpperCase(),
    spentAt: input.spentAt ? parseDateOnly(input.spentAt) : undefined,
  });

  return serializeTripExpense(expense);
}

export async function deleteTripExpenseResource(accountId: string, expenseId: string) {
  const prisma = getPrismaClient();
  const current = await findActiveTripExpenseById(prisma, accountId, expenseId);

  if (!current) {
    throw createNotFoundError('expense not found');
  }

  await softDeleteTripExpense(prisma, expenseId, new Date());
  return { deletedId: expenseId };
}

export async function createExpenseDraftFromPlanningItem(
  accountId: string,
  tripId: string,
  itemId: string,
  input: CreateTripExpenseDraftFromPlanningBody,
) {
  const prisma = getPrismaClient();
  await findActiveTrip(prisma, accountId, tripId);
  const planningItem = await prisma.tripPlanningItem.findFirst({
    where: {
      id: itemId,
      accountId,
      tripId,
      isDeleted: false,
    },
  });

  if (!planningItem) {
    throw createNotFoundError('planning item not found');
  }
  if (planningItem.status === 'converted') {
    throw createValidationError('converted planning item cannot create expense draft');
  }

  const expense = await createTripExpense(prisma, {
    id: randomUUID(),
    accountId,
    tripId,
    companionId: planningItem.createdByCompanionId,
    sourcePlanningItemId: planningItem.id,
    title: planningItem.title,
    category: input.category,
    amountCents: input.amountCents,
    currency: input.currency.toUpperCase(),
    spentAt: planningItem.plannedDate ?? new Date(),
    note: input.note ?? planningItem.note ?? null,
    status: 'draft',
  });

  return serializeTripExpense(expense);
}
