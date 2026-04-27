import { Prisma, type PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

type MarkerSearchRow = {
  id: string;
  accountId: string;
  companionId: string;
  tripId: string | null;
  scope: 'domestic' | 'international';
  scopeId: string;
  scopeName: string;
  city: string;
  note: string;
  isDeleted: boolean;
  visitedStartAt: Date;
  visitedEndAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  searchScore: number;
};

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

export async function findActiveMarkersByIds(
  prisma: PrismaExecutor,
  accountId: string,
  markerIds: string[],
) {
  if (markerIds.length === 0) {
    return [];
  }

  return prisma.visitMarker.findMany({
    where: {
      id: {
        in: markerIds,
      },
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

export async function searchActiveMarkersByAccountId(
  prisma: PrismaExecutor,
  input: {
    accountId: string;
    keyword?: string;
    companionId?: string;
    scope?: 'domestic' | 'international' | 'all';
    year?: string;
    page: number;
    pageSize: number;
  },
) {
  const offset = (input.page - 1) * input.pageSize;
  const normalizedKeyword = input.keyword?.trim() ?? '';
  const hasKeyword = normalizedKeyword.length > 0;
  const usesLikeFallback = normalizedKeyword.length > 0 && normalizedKeyword.length < 2;
  const likeKeyword = `%${normalizedKeyword.replace(/[%_\\]/g, '\\$&')}%`;
  const startOfYear = input.year ? new Date(`${input.year}-01-01T00:00:00.000Z`) : null;
  const startOfNextYear = input.year ? new Date(`${Number(input.year) + 1}-01-01T00:00:00.000Z`) : null;

  const whereParts: Prisma.Sql[] = [
    Prisma.sql`m.account_id = ${input.accountId}`,
    Prisma.sql`m.is_deleted = false`,
  ];

  if (input.companionId) {
    whereParts.push(Prisma.sql`m.companion_id = ${input.companionId}`);
  }

  if (input.scope && input.scope !== 'all') {
    whereParts.push(Prisma.sql`m.scope = ${input.scope}`);
  }

  if (startOfYear && startOfNextYear) {
    whereParts.push(Prisma.sql`m.visited_start_at >= ${startOfYear}`);
    whereParts.push(Prisma.sql`m.visited_start_at < ${startOfNextYear}`);
  }

  if (hasKeyword) {
    whereParts.push(
      usesLikeFallback
        ? Prisma.sql`(m.scope_name LIKE ${likeKeyword} ESCAPE '\\' OR m.city LIKE ${likeKeyword} ESCAPE '\\' OR m.note LIKE ${likeKeyword} ESCAPE '\\')`
        : Prisma.sql`MATCH(m.scope_name, m.city, m.note) AGAINST (${normalizedKeyword} IN NATURAL LANGUAGE MODE)`,
    );
  }

  const whereClause = Prisma.sql`WHERE ${Prisma.join(whereParts, ' AND ')}`;
  const scoreSelect =
    hasKeyword && !usesLikeFallback
      ? Prisma.sql`MATCH(m.scope_name, m.city, m.note) AGAINST (${normalizedKeyword} IN NATURAL LANGUAGE MODE) AS searchScore`
      : Prisma.sql`0 AS searchScore`;

  const items = await prisma.$queryRaw<MarkerSearchRow[]>(
    Prisma.sql`
      SELECT
        m.id,
        m.account_id AS accountId,
        m.companion_id AS companionId,
        m.trip_id AS tripId,
        m.scope,
        m.scope_id AS scopeId,
        m.scope_name AS scopeName,
        m.city,
        m.note,
        m.is_deleted AS isDeleted,
        m.visited_start_at AS visitedStartAt,
        m.visited_end_at AS visitedEndAt,
        m.created_at AS createdAt,
        m.updated_at AS updatedAt,
        m.deleted_at AS deletedAt,
        ${scoreSelect}
      FROM visit_markers m
      ${whereClause}
      ORDER BY searchScore DESC, m.visited_start_at DESC, m.created_at DESC
      LIMIT ${input.pageSize}
      OFFSET ${offset}
    `,
  );

  const countRows = await prisma.$queryRaw<Array<{ total: bigint }>>(
    Prisma.sql`
      SELECT COUNT(*) AS total
      FROM visit_markers m
      ${whereClause}
    `,
  );
  const total = Number(countRows[0]?.total ?? 0);
  const markerIds = items.map((item) => item.id);
  const images =
    markerIds.length > 0
      ? await prisma.visitMarkerImage.findMany({
          where: {
            markerId: {
              in: markerIds,
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        })
      : [];
  const imagesByMarkerId = new Map<string, typeof images>();
  images.forEach((image) => {
    const markerImages = imagesByMarkerId.get(image.markerId) ?? [];
    markerImages.push(image);
    imagesByMarkerId.set(image.markerId, markerImages);
  });

  return {
    items: items.map((item) => ({
      ...item,
      images: imagesByMarkerId.get(item.id) ?? [],
    })),
    total,
  };
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

export async function updateMarkersTripId(
  prisma: PrismaExecutor,
  markerIds: string[],
  tripId: string | null,
) {
  if (markerIds.length === 0) {
    return { count: 0 };
  }

  return prisma.visitMarker.updateMany({
    where: {
      id: {
        in: markerIds,
      },
      isDeleted: false,
    },
    data: {
      tripId,
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
