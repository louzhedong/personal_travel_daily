// visitMarker 写路径 / Visit marker write-path mutations.
// 包含 create / update / softDelete 等写操作。
// Includes create / update / softDelete write operations.
import type {
  MarkerBudgetLevel,
  MarkerMood,
  MarkerTag,
  MarkerTransport,
  MarkerWeather,
} from '../../../../shared/markerMetadata.js';
import type { PrismaExecutor } from './types.js';

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
    tags?: MarkerTag[];
    mood?: MarkerMood | null;
    weather?: MarkerWeather | null;
    transport?: MarkerTransport | null;
    budgetLevel?: MarkerBudgetLevel | null;
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
      tags: input.tags ?? [],
      mood: input.mood ?? null,
      weather: input.weather ?? null,
      transport: input.transport ?? null,
      budgetLevel: input.budgetLevel ?? null,
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
    tags?: MarkerTag[];
    mood?: MarkerMood | null;
    weather?: MarkerWeather | null;
    transport?: MarkerTransport | null;
    budgetLevel?: MarkerBudgetLevel | null;
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
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.mood !== undefined ? { mood: input.mood } : {}),
      ...(input.weather !== undefined ? { weather: input.weather } : {}),
      ...(input.transport !== undefined ? { transport: input.transport } : {}),
      ...(input.budgetLevel !== undefined ? { budgetLevel: input.budgetLevel } : {}),
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
