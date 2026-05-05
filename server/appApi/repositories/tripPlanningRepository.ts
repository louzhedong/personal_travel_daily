import type { Prisma, PrismaClient, TripPlanningPriority } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

const planningInclude = {
  createdByCompanion: true,
  trip: true,
} satisfies Prisma.TripPlanningItemInclude;

export async function listActiveTripPlanningItemsByTripId(
  prisma: PrismaExecutor,
  accountId: string,
  tripId: string,
) {
  if (!('tripPlanningItem' in prisma)) {
    return [];
  }

  return prisma.tripPlanningItem.findMany({
    where: {
      accountId,
      tripId,
      isDeleted: false,
    },
    orderBy: [
      { status: 'asc' },
      { sortOrder: 'asc' },
      { createdAt: 'asc' },
    ],
    include: planningInclude,
  });
}

export async function findActiveTripPlanningItemById(
  prisma: PrismaExecutor,
  accountId: string,
  tripId: string,
  itemId: string,
) {
  return prisma.tripPlanningItem.findFirst({
    where: {
      id: itemId,
      accountId,
      tripId,
      isDeleted: false,
    },
    include: planningInclude,
  });
}

export async function getNextTripPlanningSortOrder(
  prisma: PrismaExecutor,
  accountId: string,
  tripId: string,
) {
  const result = await prisma.tripPlanningItem.aggregate({
    where: {
      accountId,
      tripId,
      isDeleted: false,
    },
    _max: {
      sortOrder: true,
    },
  });

  return (result._max.sortOrder ?? -1) + 1;
}

export async function createTripPlanningItem(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    tripId: string;
    createdByCompanionId: string;
    title: string;
    scope: 'domestic' | 'international';
    scopeId: string;
    scopeName: string;
    city: string;
    note?: string;
    priority: TripPlanningPriority;
    plannedDate?: Date | null;
    sourceGuideIdentity?: string;
    sourceGuideTitle?: string;
    sourceGuideSourceName?: string;
    sourceGuideSourceUrl?: string;
    sourceWishlistId?: string;
    sortOrder: number;
  },
) {
  return prisma.tripPlanningItem.create({
    data: input,
    include: planningInclude,
  });
}

export async function updateTripPlanningItem(
  prisma: PrismaExecutor,
  itemId: string,
  input: {
    title?: string;
    scope?: 'domestic' | 'international';
    scopeId?: string;
    scopeName?: string;
    city?: string;
    note?: string | null;
    priority?: TripPlanningPriority;
    plannedDate?: Date | null;
    sortOrder?: number;
    convertedMarkerId?: string;
    sourceWishlistId?: string | null;
  },
) {
  return prisma.tripPlanningItem.update({
    where: { id: itemId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.scope !== undefined ? { scope: input.scope } : {}),
      ...(input.scopeId !== undefined ? { scopeId: input.scopeId } : {}),
      ...(input.scopeName !== undefined ? { scopeName: input.scopeName } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.plannedDate !== undefined ? { plannedDate: input.plannedDate } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.convertedMarkerId !== undefined
        ? { convertedMarkerId: input.convertedMarkerId, status: 'converted' }
        : {}),
      ...(input.sourceWishlistId !== undefined ? { sourceWishlistId: input.sourceWishlistId } : {}),
    },
    include: planningInclude,
  });
}

export async function softDeleteTripPlanningItem(
  prisma: PrismaExecutor,
  itemId: string,
  deletedAt: Date,
) {
  return prisma.tripPlanningItem.update({
    where: { id: itemId },
    data: {
      isDeleted: true,
      deletedAt,
    },
  });
}
