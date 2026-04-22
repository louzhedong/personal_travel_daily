import type { Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import { createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type { CreateSavedGuideBody, ListSavedGuidesQuery } from '../schemas/savedGuides.js';
import { ensureDefaultAppState } from './appContextService.js';
import { findActiveCompanionById } from '../repositories/travelCompanionRepository.js';
import { findActiveMarkerById } from '../repositories/visitMarkerRepository.js';
import {
  createSavedGuide,
  findActiveSavedGuideById,
  findActiveSavedGuideByIdentity,
  listActiveSavedGuidesByAccountId,
  softDeleteSavedGuideById,
} from '../repositories/savedGuideRepository.js';
import {
  serializeDeleteSavedGuide,
  serializeSavedGuideMutation,
  serializeSavedGuidesList,
} from '../serializers/bootstrapSerializer.js';

function normalizeGuideIdentity(sourceUrl: string) {
  return sourceUrl.trim().toLowerCase();
}

function buildSaveContextKey(markerId?: string) {
  return markerId ? `marker:${markerId}` : 'favorite';
}

function parseGuidePublishedAt(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function listSavedGuidesResource(query: ListSavedGuidesQuery) {
  const prisma = getPrismaClient();
  const context = await prisma.$transaction(async (tx) => ensureDefaultAppState(tx));
  const savedGuides = await listActiveSavedGuidesByAccountId(prisma, context.accountId);

  const filtered = savedGuides.filter((item) => {
    if (query.companionId && item.savedByCompanionId !== query.companionId) {
      return false;
    }
    if (query.markerId && item.markerId !== query.markerId) {
      return false;
    }
    return true;
  });

  return serializeSavedGuidesList(filtered);
}

export async function createSavedGuideResource(input: CreateSavedGuideBody) {
  const prisma = getPrismaClient();

  const result = await prisma.$transaction(async (tx) => {
    const context = await ensureDefaultAppState(tx);
    const companion = await findActiveCompanionById(tx, context.accountId, input.savedByUserId);
    if (!companion) {
      throw createNotFoundError('companion not found');
    }

    if (input.markerId) {
      const marker = await findActiveMarkerById(tx, context.accountId, input.markerId);
      if (!marker) {
        throw createNotFoundError('marker not found');
      }
    }

    const guideIdentity = normalizeGuideIdentity(input.result.sourceUrl);
    const saveContextKey = buildSaveContextKey(input.markerId);
    const duplicate = await findActiveSavedGuideByIdentity(tx, {
      accountId: context.accountId,
      savedByCompanionId: input.savedByUserId,
      saveContextKey,
      guideIdentity,
    });

    if (duplicate) {
      return {
        savedGuide: duplicate,
        deduplicated: true,
      };
    }

    const payload = input.result as Prisma.InputJsonValue;
    const created = await createSavedGuide(tx, {
      id: ulid(),
      accountId: context.accountId,
      savedByCompanionId: input.savedByUserId,
      markerId: input.markerId,
      saveContextKey,
      keyword: input.keyword,
      guideIdentity,
      guideTitle: input.result.title,
      guideSummary: input.result.summary,
      guideSourceName: input.result.sourceName,
      guideSourceUrl: input.result.sourceUrl,
      guideCoverImageUrl: input.result.coverImageUrl,
      guideAuthorName: input.result.authorName,
      guidePublishedAt: parseGuidePublishedAt(input.result.publishedAt),
      guideDestinationLabel: input.result.destinationLabel,
      guidePayloadJson: payload,
      savedAt: new Date(),
    });

    return {
      savedGuide: created,
      deduplicated: false,
    };
  });

  return serializeSavedGuideMutation(result.savedGuide, result.deduplicated);
}

export async function deleteSavedGuideResource(savedGuideId: string) {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    const context = await ensureDefaultAppState(tx);
    const existing = await findActiveSavedGuideById(tx, context.accountId, savedGuideId);
    if (!existing) {
      throw createNotFoundError('saved guide not found');
    }

    await softDeleteSavedGuideById(tx, savedGuideId, new Date());
  });

  return serializeDeleteSavedGuide(savedGuideId);
}
