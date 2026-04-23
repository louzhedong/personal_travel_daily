import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function listActiveMarkersByAccountId(
  prisma: PrismaExecutor,
  accountId: string,
) {
  return prisma.visitMarker.findMany({
    where: {
      accountId,
      isDeleted: false,
    },
    include: {
      images: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function findActiveMarkerById(
  prisma: PrismaExecutor,
  accountId: string,
  markerId: string,
) {
  return prisma.visitMarker.findFirst({
    where: {
      id: markerId,
      accountId,
      isDeleted: false,
    },
    include: {
      images: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });
}

export async function createMarker(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    companionId: string;
    tripId?: string;
    scope: 'domestic' | 'international';
    scopeId: string;
    scopeName: string;
    city: string;
    note: string;
    visitedStartAt: Date;
    visitedEndAt: Date;
    imageUrls?: string[];
  },
) {
  return prisma.visitMarker.create({
    data: {
      id: input.id,
      accountId: input.accountId,
      companionId: input.companionId,
      tripId: input.tripId,
      scope: input.scope,
      scopeId: input.scopeId,
      scopeName: input.scopeName,
      city: input.city,
      note: input.note,
      visitedStartAt: input.visitedStartAt,
      visitedEndAt: input.visitedEndAt,
      images:
        input.imageUrls && input.imageUrls.length > 0
          ? {
              create: input.imageUrls.map((imageUrl, index) => ({
                id: `${input.id}_img_${index}`,
                imageUrl,
                sortOrder: index,
              })),
            }
          : undefined,
    },
    include: {
      images: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });
}

export async function updateMarker(
  prisma: PrismaExecutor,
  markerId: string,
  input: {
    note?: string;
    visitedStartAt?: Date;
    visitedEndAt?: Date;
    tripId?: string | null;
    imageUrls?: string[];
  },
) {
  if (input.imageUrls !== undefined) {
    await prisma.visitMarkerImage.deleteMany({
      where: {
        markerId,
      },
    });
  }

  return prisma.visitMarker.update({
    where: { id: markerId },
    data: {
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.visitedStartAt !== undefined ? { visitedStartAt: input.visitedStartAt } : {}),
      ...(input.visitedEndAt !== undefined ? { visitedEndAt: input.visitedEndAt } : {}),
      ...(input.tripId !== undefined ? { tripId: input.tripId } : {}),
      ...(input.imageUrls !== undefined
        ? {
            images: {
              create: input.imageUrls.map((imageUrl, index) => ({
                id: `${markerId}_img_${index}`,
                imageUrl,
                sortOrder: index,
              })),
            },
          }
        : {}),
    },
    include: {
      images: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });
}

export async function softDeleteMarker(
  prisma: PrismaExecutor,
  markerId: string,
  deletedAt: Date,
) {
  return prisma.visitMarker.update({
    where: { id: markerId },
    data: {
      isDeleted: true,
      deletedAt,
    },
  });
}
