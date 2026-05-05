import { createNotFoundError, createValidationError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type { UpdateTripPhotoCurationBody } from '../schemas/trips.js';
import { getTripDetail } from './tripDetailService.js';

export async function updateTripPhotoCuration(
  accountId: string,
  tripId: string,
  input: UpdateTripPhotoCurationBody,
) {
  const prisma = getPrismaClient();
  const imageIds = input.items.map((item) => item.imageId);
  const uniqueImageIds = new Set(imageIds);

  if (uniqueImageIds.size !== imageIds.length) {
    throw createValidationError('imageId values must be unique');
  }

  const images = await prisma.visitMarkerImage.findMany({
    where: {
      id: {
        in: imageIds,
      },
      marker: {
        accountId,
        tripId,
        isDeleted: false,
        trip: {
          accountId,
          isDeleted: false,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (images.length !== imageIds.length) {
    throw createNotFoundError('trip photo not found');
  }

  await prisma.$transaction(
    input.items.map((item) =>
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

  return getTripDetail(accountId, tripId);
}
