import { randomUUID } from 'node:crypto';
import type { Prisma, PrismaClient, TripChecklistStage } from '@prisma/client';
import { createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import {
  createTripChecklistItem,
  findActiveTripChecklistItemById,
  getNextTripChecklistSortOrder,
  listActiveTripChecklistItemsByTripId,
  softDeleteTripChecklistItem,
  updateTripChecklistItem,
} from '../repositories/tripChecklistRepository.js';
import { findActiveCompanionById } from '../repositories/travelCompanionRepository.js';
import { findActiveTripById } from '../repositories/tripRepository.js';
import type {
  CreateTripChecklistItemBody,
  GenerateTripChecklistBody,
  UpdateTripChecklistItemBody,
} from '../schemas/tripChecklist.js';
import {
  serializeGenerateTripChecklistResult,
  serializeTripChecklistResponse,
} from '../serializers/tripChecklistSerializer.js';
import { serializeTripChecklistItem } from '../serializers/tripDetailSerializer.js';
import { buildGeneratedTripChecklistDrafts } from './tripChecklistGenerationService.js';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

function normalizeGuideIdentity(sourceUrl?: string) {
  return sourceUrl?.trim().toLowerCase() || undefined;
}

function normalizeChecklistTitle(title: string) {
  return title.trim().replace(/\s+/g, ' ').toLowerCase();
}

async function assertTripAndCompanion(
  accountId: string,
  tripId: string,
  companionId: string,
  tx: PrismaExecutor = getPrismaClient(),
) {
  const [trip, companion] = await Promise.all([
    findActiveTripById(tx, accountId, tripId),
    findActiveCompanionById(tx, accountId, companionId),
  ]);

  if (!trip) {
    throw createNotFoundError('trip not found');
  }

  if (!companion) {
    throw createNotFoundError('companion not found');
  }

  return { trip, companion };
}

export async function listTripChecklist(accountId: string, tripId: string) {
  const prisma = getPrismaClient();
  const trip = await findActiveTripById(prisma, accountId, tripId);
  if (!trip) {
    throw createNotFoundError('trip not found');
  }

  const items = await listActiveTripChecklistItemsByTripId(prisma, accountId, tripId);
  return serializeTripChecklistResponse(items);
}

export async function createTripChecklistItemResource(
  accountId: string,
  tripId: string,
  input: CreateTripChecklistItemBody,
) {
  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    await assertTripAndCompanion(accountId, tripId, input.companionId, tx);
    const sortOrder = await getNextTripChecklistSortOrder(tx, accountId, tripId, input.stage);
    const created = await createTripChecklistItem(tx, {
      id: randomUUID(),
      accountId,
      tripId,
      createdByCompanionId: input.companionId,
      title: input.title.trim(),
      note: input.note?.trim() || undefined,
      stage: input.stage,
      sortOrder,
      origin: 'manual',
    });

    return serializeTripChecklistItem(created);
  });
}

export async function updateTripChecklistItemResource(
  accountId: string,
  tripId: string,
  itemId: string,
  input: UpdateTripChecklistItemBody,
) {
  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    const existing = await findActiveTripChecklistItemById(tx, accountId, tripId, itemId);
    if (!existing) {
      throw createNotFoundError('trip checklist item not found');
    }

    const nextStage: TripChecklistStage | undefined =
      input.stage && input.stage !== existing.stage ? input.stage : undefined;
    const nextSortOrder =
      input.sortOrder !== undefined
        ? input.sortOrder
        : nextStage
          ? await getNextTripChecklistSortOrder(tx, accountId, tripId, nextStage)
          : undefined;

    const updated = await updateTripChecklistItem(tx, itemId, {
      title: input.title?.trim(),
      note: input.note === undefined ? undefined : input.note?.trim() || null,
      stage: input.stage,
      sortOrder: nextSortOrder,
    });

    return serializeTripChecklistItem(updated);
  });
}

export async function deleteTripChecklistItemResource(accountId: string, tripId: string, itemId: string) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    const existing = await findActiveTripChecklistItemById(tx, accountId, tripId, itemId);
    if (!existing) {
      throw createNotFoundError('trip checklist item not found');
    }

    await softDeleteTripChecklistItem(tx, itemId, new Date());
  });

  return {
    deletedId: itemId,
  };
}

export async function generateTripChecklist(accountId: string, tripId: string, input: GenerateTripChecklistBody) {
  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    await assertTripAndCompanion(accountId, tripId, input.companionId, tx);

    const [existingItems, drafts] = await Promise.all([
      listActiveTripChecklistItemsByTripId(tx, accountId, tripId),
      buildGeneratedTripChecklistDrafts(input),
    ]);

    const existingKeys = new Set(
      existingItems.map((item) => {
        const sourceUrl = item.sourceGuideSourceUrl ?? undefined;
        return `${normalizeGuideIdentity(sourceUrl)}::${normalizeChecklistTitle(item.title)}`;
      }),
    );
    const guideIdentity = normalizeGuideIdentity(input.guide.sourceUrl);
    const stageSortOrderMap = new Map<TripChecklistStage, number>();

    const uniqueDrafts = drafts.filter((draft) => {
      const key = `${guideIdentity}::${normalizeChecklistTitle(draft.title)}`;
      if (existingKeys.has(key)) {
        return false;
      }
      existingKeys.add(key);
      return true;
    });

    const createdItems = [];
    for (const draft of uniqueDrafts) {
      const currentSortOrder =
        stageSortOrderMap.get(draft.stage) ??
        (await getNextTripChecklistSortOrder(tx, accountId, tripId, draft.stage));

      const created = await createTripChecklistItem(tx, {
        id: randomUUID(),
        accountId,
        tripId,
        createdByCompanionId: input.companionId,
        title: draft.title,
        note: draft.note,
        stage: draft.stage,
        sortOrder: currentSortOrder,
        origin: 'generated',
        sourceGuideIdentity: guideIdentity,
        sourceGuideTitle: input.guide.title,
        sourceGuideSourceName: input.guide.sourceName,
        sourceGuideSourceUrl: input.guide.sourceUrl,
        sourceSnippet: draft.sourceSnippet,
      });

      stageSortOrderMap.set(draft.stage, currentSortOrder + 1);
      createdItems.push(created);
    }

    return serializeGenerateTripChecklistResult({
      createdCount: createdItems.length,
      deduplicatedCount: drafts.length - uniqueDrafts.length,
      items: createdItems,
    });
  });
}
