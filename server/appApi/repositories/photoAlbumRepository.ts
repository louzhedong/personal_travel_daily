import type { Prisma, PrismaClient } from '@prisma/client';

export type PhotoAlbumPrismaClient = PrismaClient | Prisma.TransactionClient;

export async function listPhotoAlbumImages(prisma: PhotoAlbumPrismaClient, accountId: string) {
  return prisma.visitMarkerImage.findMany({
    where: {
      marker: {
        accountId,
        isDeleted: false,
      },
    },
    orderBy: [
      { isFeatured: 'desc' },
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
      { sortOrder: 'asc' },
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

export async function listPhotoAlbumPreferences(prisma: PhotoAlbumPrismaClient, accountId: string) {
  return prisma.photoAlbumPreference.findMany({
    where: { accountId },
    orderBy: [{ updatedAt: 'desc' }],
  });
}

export async function listOwnedPhotoAlbumImageIds(
  prisma: PhotoAlbumPrismaClient,
  accountId: string,
  imageIds: string[],
) {
  if (imageIds.length === 0) {
    return [];
  }

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

export async function upsertPhotoAlbumPreferences(
  prisma: PrismaClient,
  inputs: Array<{
    id: string;
    accountId: string;
    targetKind: string;
    targetId: string;
    pinnedImageIds: Prisma.InputJsonValue;
    sortOrderJson: Prisma.InputJsonValue;
  }>,
) {
  await prisma.$transaction(
    inputs.map((input) =>
      prisma.photoAlbumPreference.upsert({
        where: {
          accountId_targetKind_targetId: {
            accountId: input.accountId,
            targetKind: input.targetKind,
            targetId: input.targetId,
          },
        },
        create: input,
        update: {
          pinnedImageIds: input.pinnedImageIds,
          sortOrderJson: input.sortOrderJson,
        },
      }),
    ),
  );
}
