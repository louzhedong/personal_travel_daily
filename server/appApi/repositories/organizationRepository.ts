import type { Prisma, PrismaClient } from '@prisma/client';

export type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function getOrganizationWorkbenchSources(prisma: PrismaExecutor, accountId: string) {
  const [trips, markers, images, guides] = await Promise.all([
    prisma.trip.findMany({
      where: { accountId, isDeleted: false },
      orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.visitMarker.findMany({
      where: { accountId, isDeleted: false },
      include: { trip: true, companion: true },
      orderBy: { visitedStartAt: 'desc' },
    }),
    prisma.visitMarkerImage.findMany({
      where: { marker: { accountId, isDeleted: false } },
      include: { marker: { include: { trip: true, companion: true } } },
      orderBy: [{ isFeatured: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.savedGuide.findMany({
      where: { accountId, isDeleted: false },
      include: { marker: true, companion: true },
      orderBy: { savedAt: 'desc' },
    }),
  ]);

  return { trips, markers, images, guides };
}

export async function listOwnedOrganizationMarkers(
  prisma: PrismaExecutor,
  accountId: string,
  markerIds: string[],
) {
  return prisma.visitMarker.findMany({
    where: { id: { in: markerIds }, accountId, isDeleted: false },
    include: { trip: true },
  });
}

export async function listOwnedOrganizationImages(
  prisma: PrismaExecutor,
  accountId: string,
  imageIds: string[],
) {
  return prisma.visitMarkerImage.findMany({
    where: { id: { in: imageIds }, marker: { accountId, isDeleted: false } },
    include: { marker: true },
  });
}

export async function assignOrganizationMarkersToTrip(
  prisma: PrismaExecutor,
  markerIds: string[],
  tripId: string,
) {
  return prisma.visitMarker.updateMany({
    where: { id: { in: markerIds }, isDeleted: false },
    data: { tripId },
  });
}

export async function updateOrganizationMarkerTags(
  prisma: PrismaExecutor,
  items: Array<{ markerId: string; tags: string[] }>,
) {
  await Promise.all(
    items.map((item) =>
      prisma.visitMarker.update({
        where: { id: item.markerId },
        data: { tags: item.tags },
      }),
    ),
  );
}

export async function featureOrganizationPhotos(prisma: PrismaExecutor, imageIds: string[]) {
  return prisma.visitMarkerImage.updateMany({
    where: { id: { in: imageIds } },
    data: { isFeatured: true },
  });
}

export async function updateOrganizationPhotoCaptions(
  prisma: PrismaExecutor,
  items: Array<{ imageId: string; caption: string }>,
) {
  await Promise.all(
    items.map((item) =>
      prisma.visitMarkerImage.update({
        where: { id: item.imageId },
        data: { caption: item.caption },
      }),
    ),
  );
}

