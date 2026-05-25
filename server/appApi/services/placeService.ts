import { randomUUID } from 'node:crypto';
import type { Place, Prisma } from '@prisma/client';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import { createNotFoundError, createValidationError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type { PlaceDto, PlaceKindDto } from '../dto/places.js';
import type {
  CreatePlaceBody,
  PlaceListQuery,
  PromoteMarkerToPlaceBody,
  UpdatePlaceBody,
} from '../schemas/places.js';

/**
 * F2 · Place service / 旅行知识库（Place）服务
 * Cross-trip place sinkhole: hotels, restaurants, sights deduped across trips.
 * 跨行程地点沉淀池：酒店、餐厅、景点等去重沉淀。
 */

function serializePlace(place: Place): PlaceDto {
  const tags = Array.isArray(place.tagsJson)
    ? (place.tagsJson as unknown[]).filter((tag): tag is string => typeof tag === 'string')
    : [];
  return {
    id: place.id,
    kind: place.kind as PlaceKindDto,
    name: place.name,
    city: place.city,
    region: place.region,
    countryCode: place.countryCode,
    latitude: place.latitude ? Number(place.latitude) : null,
    longitude: place.longitude ? Number(place.longitude) : null,
    tags,
    privateRating: place.privateRating,
    myNotesMd: place.myNotesMd,
    isFavorite: place.isFavorite,
    visitCount: place.visitCount,
    firstVisitedAt: place.firstVisitedAt?.toISOString() ?? null,
    lastVisitedAt: place.lastVisitedAt?.toISOString() ?? null,
    createdAt: place.createdAt.toISOString(),
    updatedAt: place.updatedAt.toISOString(),
  };
}

export async function listPlaces(account: AuthenticatedAccount, query: PlaceListQuery) {
  const prisma = getPrismaClient();
  const where: Prisma.PlaceWhereInput = { accountId: account.id };
  if (query.kind) where.kind = query.kind;
  if (query.favoriteOnly) where.isFavorite = true;
  if (query.q) {
    where.OR = [
      { name: { contains: query.q } },
      { city: { contains: query.q } },
      { region: { contains: query.q } },
    ];
  }
  const items = await prisma.place.findMany({
    where,
    orderBy: [{ isFavorite: 'desc' }, { lastVisitedAt: 'desc' }, { name: 'asc' }],
    take: 200,
  });
  return {
    items: items.map(serializePlace),
    total: items.length,
  };
}

export async function getPlace(account: AuthenticatedAccount, placeId: string) {
  const prisma = getPrismaClient();
  const place = await prisma.place.findFirst({
    where: { id: placeId, accountId: account.id },
  });
  if (!place) throw createNotFoundError('place not found');
  const markers = await prisma.visitMarker.findMany({
    where: { placeId, accountId: account.id, isDeleted: false },
    select: { id: true, scopeName: true, city: true, visitedStartAt: true, tripId: true },
    orderBy: { visitedStartAt: 'desc' },
  });
  return {
    place: serializePlace(place),
    visits: markers.map((marker) => ({
      markerId: marker.id,
      scopeName: marker.scopeName,
      city: marker.city,
      visitedStartAt: marker.visitedStartAt.toISOString(),
      tripId: marker.tripId,
    })),
  };
}

export async function createPlace(account: AuthenticatedAccount, body: CreatePlaceBody) {
  const prisma = getPrismaClient();
  const now = new Date();
  const created = await prisma.place.create({
    data: {
      id: randomUUID(),
      accountId: account.id,
      kind: body.kind,
      name: body.name,
      city: body.city,
      region: body.region,
      countryCode: body.countryCode,
      latitude: body.latitude,
      longitude: body.longitude,
      tagsJson: body.tags ?? [],
      privateRating: body.privateRating,
      myNotesMd: body.myNotesMd,
      isFavorite: body.isFavorite ?? false,
      visitCount: 0,
      firstVisitedAt: null,
      lastVisitedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  });
  return serializePlace(created);
}

export async function updatePlace(
  account: AuthenticatedAccount,
  placeId: string,
  body: UpdatePlaceBody,
) {
  const prisma = getPrismaClient();
  const place = await prisma.place.findFirst({
    where: { id: placeId, accountId: account.id },
  });
  if (!place) throw createNotFoundError('place not found');
  const updated = await prisma.place.update({
    where: { id: placeId },
    data: {
      kind: body.kind ?? place.kind,
      name: body.name ?? place.name,
      city: body.city,
      region: body.region,
      countryCode: body.countryCode,
      latitude: body.latitude,
      longitude: body.longitude,
      tagsJson: body.tags ?? (place.tagsJson as Prisma.InputJsonValue),
      privateRating: body.privateRating,
      myNotesMd: body.myNotesMd,
      isFavorite: body.isFavorite ?? place.isFavorite,
    },
  });
  return serializePlace(updated);
}

export async function deletePlace(account: AuthenticatedAccount, placeId: string) {
  const prisma = getPrismaClient();
  const place = await prisma.place.findFirst({
    where: { id: placeId, accountId: account.id },
  });
  if (!place) throw createNotFoundError('place not found');
  await prisma.visitMarker.updateMany({
    where: { placeId, accountId: account.id },
    data: { placeId: null },
  });
  await prisma.place.delete({ where: { id: placeId } });
  return { deleted: true };
}

export async function promoteMarkerToPlace(
  account: AuthenticatedAccount,
  body: PromoteMarkerToPlaceBody,
) {
  const prisma = getPrismaClient();
  const marker = await prisma.visitMarker.findFirst({
    where: { id: body.markerId, accountId: account.id, isDeleted: false },
  });
  if (!marker) throw createNotFoundError('marker not found');
  if (marker.placeId) {
    throw createValidationError('marker already linked to a place');
  }

  const now = new Date();
  // Try to dedup by name + rounded coords
  const dedupKey = marker.scopeName.trim();
  const existing = await prisma.place.findFirst({
    where: {
      accountId: account.id,
      kind: body.kind,
      name: dedupKey,
    },
  });

  let place: Place;
  if (existing) {
    place = await prisma.place.update({
      where: { id: existing.id },
      data: {
        visitCount: { increment: 1 },
        lastVisitedAt: marker.visitedStartAt,
        firstVisitedAt: existing.firstVisitedAt ?? marker.visitedStartAt,
      },
    });
  } else {
    place = await prisma.place.create({
      data: {
        id: randomUUID(),
        accountId: account.id,
        kind: body.kind,
        name: dedupKey,
        city: marker.city,
        latitude: marker.latitude,
        longitude: marker.longitude,
        tagsJson: body.tags ?? [],
        visitCount: 1,
        firstVisitedAt: marker.visitedStartAt,
        lastVisitedAt: marker.visitedStartAt,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  await prisma.visitMarker.update({
    where: { id: marker.id },
    data: { placeId: place.id },
  });
  return serializePlace(place);
}
