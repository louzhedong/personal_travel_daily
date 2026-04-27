// visitMarker 读路径 / Visit marker read-path queries.
// 纯读取函数，不做写入副作用。
// Pure read-only queries; no write side-effects.
import type { PrismaExecutor } from './types.js';

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
