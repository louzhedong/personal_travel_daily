import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function listActiveTripsByAccountId(prisma: PrismaExecutor, accountId: string) {
  return prisma.trip.findMany({
    where: {
      accountId,
      isDeleted: false,
    },
    orderBy: [
      {
        startsAt: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
  });
}

export async function findActiveTripById(
  prisma: PrismaExecutor,
  accountId: string,
  tripId: string,
) {
  return prisma.trip.findFirst({
    where: {
      id: tripId,
      accountId,
      isDeleted: false,
    },
  });
}

export async function createTrip(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    name: string;
    coverImageUrl?: string;
    note: string;
    startsAt: Date;
    endsAt: Date;
  },
) {
  return prisma.trip.create({
    data: {
      id: input.id,
      accountId: input.accountId,
      name: input.name,
      coverImageUrl: input.coverImageUrl,
      note: input.note,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    },
  });
}

export async function updateTrip(
  prisma: PrismaExecutor,
  tripId: string,
  input: {
    name?: string;
    coverImageUrl?: string | null;
    note?: string;
    startsAt?: Date;
    endsAt?: Date;
  },
) {
  return prisma.trip.update({
    where: {
      id: tripId,
    },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.coverImageUrl !== undefined ? { coverImageUrl: input.coverImageUrl } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
    },
  });
}

export async function softDeleteTrip(
  prisma: PrismaExecutor,
  tripId: string,
  deletedAt: Date,
) {
  await prisma.visitMarker.updateMany({
    where: {
      tripId,
      isDeleted: false,
    },
    data: {
      tripId: null,
    },
  });

  return prisma.trip.update({
    where: {
      id: tripId,
    },
    data: {
      isDeleted: true,
      deletedAt,
    },
  });
}
