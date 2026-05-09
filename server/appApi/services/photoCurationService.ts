import { createNotFoundError, createValidationError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import {
  listOwnedPhotoImageIds,
  listPhotoCurationImages,
  updatePhotoCurationImages,
} from '../repositories/photoCurationRepository.js';
import type { PhotoCurationQuery, UpdatePhotoCurationBody } from '../schemas/photoCuration.js';
import {
  serializePhotoCurationItem,
  serializePhotoCurationResponse,
} from '../serializers/photoCurationSerializer.js';

function filterPhotoItems(
  sources: Awaited<ReturnType<typeof listPhotoCurationImages>>,
  query: PhotoCurationQuery,
) {
  return sources
    .map(serializePhotoCurationItem)
    .filter((item) => {
      if (query.tripId && item.tripId !== query.tripId) {
        return false;
      }

      if (query.companionId && item.companionId !== query.companionId) {
        return false;
      }

      if (query.year && new Date(item.visitedStartAt).getFullYear() !== query.year) {
        return false;
      }

      if (query.featured === 'featured' && !item.isFeatured) {
        return false;
      }

      if (query.featured === 'unfeatured' && item.isFeatured) {
        return false;
      }

      if (query.caption === 'withCaption' && !item.caption?.trim()) {
        return false;
      }

      if (query.caption === 'missingCaption' && item.caption?.trim()) {
        return false;
      }

      return true;
    })
    .slice(0, query.limit);
}

export async function listPhotoCurationResource(accountId: string, query: PhotoCurationQuery) {
  const prisma = getPrismaClient();
  const sources = await listPhotoCurationImages(prisma, accountId);
  const filteredItems = filterPhotoItems(sources, query);

  return serializePhotoCurationResponse(sources, filteredItems);
}

export async function updatePhotoCurationResource(
  accountId: string,
  input: UpdatePhotoCurationBody,
  query: PhotoCurationQuery,
) {
  const imageIds = input.items.map((item) => item.imageId);
  const uniqueImageIds = new Set(imageIds);

  if (uniqueImageIds.size !== imageIds.length) {
    throw createValidationError('imageId values must be unique');
  }

  const prisma = getPrismaClient();
  const ownedImages = await listOwnedPhotoImageIds(prisma, accountId, imageIds);

  if (ownedImages.length !== imageIds.length) {
    throw createNotFoundError('photo not found');
  }

  await updatePhotoCurationImages(prisma, input.items);

  return listPhotoCurationResource(accountId, query);
}
