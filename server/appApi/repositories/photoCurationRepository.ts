import type { Prisma, PrismaClient } from '@prisma/client';

export type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function listPhotoCurationImages(prisma: PrismaExecutor, accountId: string) {
  return prisma.visitMarkerImage.findMany({
    where: {
      marker: {
        accountId,
        isDeleted: false,
      },
    },
    orderBy: [
      {
        isFeatured: 'desc',
      },
      {
        curatedSortOrder: {
          sort: 'asc',
          nulls: 'last',
        },
      },
      {
        marker: {
          visitedStartAt: 'desc',
        },
      },
      {
        sortOrder: 'asc',
      },
    ],
    include: {
      marker: {
        include: {
          companion: true,
          trip: true,
        },
      },
    },
  });
}

export async function listOwnedPhotoImageIds(
  prisma: PrismaExecutor,
  accountId: string,
  imageIds: string[],
) {
  return prisma.visitMarkerImage.findMany({
    where: {
      id: {
        in: imageIds,
      },
      marker: {
        accountId,
        isDeleted: false,
      },
    },
    select: {
      id: true,
    },
  });
}

export async function updatePhotoCurationImages(
  prisma: PrismaClient,
  items: Array<{
    imageId: string;
    isFeatured?: boolean;
    caption?: string | null;
    curatedSortOrder?: number | null;
  }>,
) {
  await prisma.$transaction(
    items.map((item) =>
      prisma.visitMarkerImage.update({
        where: {
          id: item.imageId,
        },
        data: {
          ...(item.isFeatured !== undefined ? { isFeatured: item.isFeatured } : {}),
          ...(item.caption !== undefined ? { caption: item.caption || null } : {}),
          ...(item.curatedSortOrder !== undefined ? { curatedSortOrder: item.curatedSortOrder } : {}),
        },
      }),
    ),
  );
}
