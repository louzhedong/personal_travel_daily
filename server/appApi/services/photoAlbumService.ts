import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { createNotFoundError, createValidationError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import type { PhotoAlbumsResponseDto } from '../types.js';
import type { UpdatePhotoAlbumPreferencesBody } from '../schemas/photoAlbums.js';
import {
  listOwnedPhotoAlbumImageIds,
  listPhotoAlbumImages,
  listPhotoAlbumPreferences,
  upsertPhotoAlbumPreferences,
} from '../repositories/photoAlbumRepository.js';
import { serializePhotoAlbumsResponse } from '../serializers/photoAlbumSerializer.js';

function uniqueStrings(values: string[] = []) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function assertUniquePreferenceTargets(input: UpdatePhotoAlbumPreferencesBody) {
  const keys = input.preferences.map((preference) => `${preference.targetKind}:${preference.targetId}`);
  if (new Set(keys).size !== keys.length) {
    throw createValidationError('photo album preference targets must be unique');
  }
}

export async function getPhotoAlbums(account: AuthenticatedAccount): Promise<PhotoAlbumsResponseDto> {
  const prisma = getPrismaClient();
  const [images, preferences] = await Promise.all([
    listPhotoAlbumImages(prisma, account.id),
    listPhotoAlbumPreferences(prisma, account.id),
  ]);

  return serializePhotoAlbumsResponse(images, preferences);
}

export async function updatePhotoAlbumPreferences(
  account: AuthenticatedAccount,
  input: UpdatePhotoAlbumPreferencesBody,
): Promise<PhotoAlbumsResponseDto> {
  assertUniquePreferenceTargets(input);

  const pinnedImageIds = uniqueStrings(input.preferences.flatMap((preference) => preference.pinnedImageIds ?? []));
  const sortOrderImageIds = uniqueStrings(input.preferences.flatMap((preference) => preference.sortOrder ?? []));
  const referencedImageIds = uniqueStrings([...pinnedImageIds, ...sortOrderImageIds]);
  const prisma = getPrismaClient();

  if (referencedImageIds.length > 0) {
    const ownedImages = await listOwnedPhotoAlbumImageIds(prisma, account.id, referencedImageIds);
    if (ownedImages.length !== referencedImageIds.length) {
      throw createNotFoundError('photo album image not found');
    }
  }

  await upsertPhotoAlbumPreferences(
    prisma,
    input.preferences.map((preference) => ({
      id: randomUUID(),
      accountId: account.id,
      targetKind: preference.targetKind,
      targetId: preference.targetId,
      pinnedImageIds: uniqueStrings(preference.pinnedImageIds).slice(0, 12) as Prisma.InputJsonValue,
      sortOrderJson: uniqueStrings(preference.sortOrder).slice(0, 80) as Prisma.InputJsonValue,
    })),
  );

  return getPhotoAlbums(account);
}
