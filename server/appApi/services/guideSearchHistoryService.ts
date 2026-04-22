import { ulid } from 'ulid';
import { createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type {
  CreateGuideSearchHistoryBody,
  ListGuideSearchHistoriesQuery,
} from '../schemas/guideSearchHistories.js';
import { ensureDefaultAppState } from './appContextService.js';
import { findActiveCompanionById } from '../repositories/travelCompanionRepository.js';
import {
  createGuideSearchHistory,
  findActiveGuideSearchHistoryByIdentity,
  listActiveGuideSearchHistoriesByAccountId,
  refreshGuideSearchHistory,
} from '../repositories/guideSearchHistoryRepository.js';
import {
  serializeGuideSearchHistoryList,
  serializeGuideSearchHistoryMutation,
} from '../serializers/bootstrapSerializer.js';

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase();
}

export async function listGuideSearchHistoriesResource(query: ListGuideSearchHistoriesQuery) {
  const prisma = getPrismaClient();
  const context = await prisma.$transaction(async (tx) => ensureDefaultAppState(tx));
  const histories = await listActiveGuideSearchHistoriesByAccountId(prisma, context.accountId);

  const filtered = histories
    .filter((item) => (query.companionId ? item.companionId === query.companionId : true))
    .slice(0, query.limit ?? 20);

  return serializeGuideSearchHistoryList(filtered);
}

export async function createGuideSearchHistoryResource(
  input: CreateGuideSearchHistoryBody,
) {
  const prisma = getPrismaClient();

  const result = await prisma.$transaction(async (tx) => {
    const context = await ensureDefaultAppState(tx);
    const companion = await findActiveCompanionById(tx, context.accountId, input.companionId);
    if (!companion) {
      throw createNotFoundError('companion not found');
    }

    const keywordNormalized = normalizeKeyword(input.keyword);
    const duplicate = await findActiveGuideSearchHistoryByIdentity(tx, {
      accountId: context.accountId,
      companionId: input.companionId,
      keywordNormalized,
      scope: input.scope,
    });

    if (duplicate) {
      const refreshed = await refreshGuideSearchHistory(tx, duplicate.id, input.keyword.trim());
      return {
        history: refreshed,
        deduplicated: true,
      };
    }

    const created = await createGuideSearchHistory(tx, {
      id: ulid(),
      accountId: context.accountId,
      companionId: input.companionId,
      keyword: input.keyword.trim(),
      keywordNormalized,
      scope: input.scope,
    });

    return {
      history: created,
      deduplicated: false,
    };
  });

  return serializeGuideSearchHistoryMutation(result.history, result.deduplicated);
}
