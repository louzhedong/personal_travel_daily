import type { Prisma, PrismaClient, TripExpenseStatus } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

const expenseInclude = {
  companion: true,
  trip: true,
} satisfies Prisma.TripExpenseInclude;

export async function listActiveTripExpensesByTripId(
  prisma: PrismaExecutor,
  accountId: string,
  tripId: string,
) {
  return prisma.tripExpense.findMany({
    where: {
      accountId,
      tripId,
      isDeleted: false,
    },
    include: expenseInclude,
    orderBy: [{ spentAt: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function listActiveTripExpensesByAccount(prisma: PrismaExecutor, accountId: string) {
  return prisma.tripExpense.findMany({
    where: {
      accountId,
      isDeleted: false,
    },
    include: expenseInclude,
    orderBy: [{ spentAt: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function findActiveTripExpenseById(
  prisma: PrismaExecutor,
  accountId: string,
  expenseId: string,
) {
  return prisma.tripExpense.findFirst({
    where: {
      id: expenseId,
      accountId,
      isDeleted: false,
    },
    include: expenseInclude,
  });
}

export async function createTripExpense(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    tripId: string;
    companionId?: string | null;
    sourcePlanningItemId?: string | null;
    title: string;
    category: string;
    amountCents: number;
    currency: string;
    spentAt: Date;
    note?: string | null;
    status: TripExpenseStatus;
  },
) {
  return prisma.tripExpense.create({
    data: input,
    include: expenseInclude,
  });
}

export async function updateTripExpense(
  prisma: PrismaExecutor,
  expenseId: string,
  input: {
    companionId?: string | null;
    sourcePlanningItemId?: string | null;
    title?: string;
    category?: string;
    amountCents?: number;
    currency?: string;
    spentAt?: Date;
    note?: string | null;
    status?: TripExpenseStatus;
  },
) {
  return prisma.tripExpense.update({
    where: { id: expenseId },
    data: input,
    include: expenseInclude,
  });
}

export async function softDeleteTripExpense(
  prisma: PrismaExecutor,
  expenseId: string,
  deletedAt: Date,
) {
  return prisma.tripExpense.update({
    where: { id: expenseId },
    data: {
      isDeleted: true,
      deletedAt,
    },
  });
}
