import { randomUUID } from 'node:crypto';
import { getPrismaClient } from '../prisma.js';
import type { CreateGuideSearchLogBody } from '../schemas/guideSearchLogs.js';
import { findActiveCompanionById } from '../repositories/travelCompanionRepository.js';
import { createNotFoundError } from '../errors.js';
import { createGuideSearchLog } from '../repositories/guideSearchLogRepository.js';
import { createGuideQualitySnapshot } from '../repositories/guideQualityRepository.js';
import {
  findGuideSourcePreference,
  upsertGuideSourceHealth,
} from '../repositories/guideSourceHealthRepository.js';
import { serializeGuideSearchLogMutation } from '../serializers/bootstrapSerializer.js';
import { calculateGuideQualityScore } from './guideQualityService.js';

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase();
}

function normalizeSourceName(sourceName?: string) {
  const trimmed = sourceName?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeSourceDomain(sourceDomain?: string) {
  const trimmed = sourceDomain?.trim().toLowerCase();
  return trimmed ? trimmed : undefined;
}

export async function createGuideSearchLogResource(
  accountId: string,
  input: CreateGuideSearchLogBody,
) {
  const prisma = getPrismaClient();

  const result = await prisma.$transaction(async (tx) => {
    const companion = await findActiveCompanionById(tx, accountId, input.companionId);
    if (!companion) {
      throw createNotFoundError('companion not found');
    }

    const log = await createGuideSearchLog(tx, {
      id: randomUUID(),
      accountId,
      companionId: input.companionId,
      keyword: input.keyword.trim(),
      keywordNormalized: normalizeKeyword(input.keyword),
      scope: input.scope,
      provider: input.provider.trim(),
      page: input.page,
      pageSize: input.pageSize,
      resultCount: input.resultCount,
      hasMore: input.hasMore,
      durationMs: input.durationMs,
      status: input.status,
      errorCode: input.errorCode?.trim() || undefined,
      sourceName: normalizeSourceName(input.sourceName),
      sourceDomain: normalizeSourceDomain(input.sourceDomain),
    });

    if (log.sourceName && log.sourceDomain) {
      const preference = await findGuideSourcePreference(tx, {
        sourceName: log.sourceName,
        sourceDomain: log.sourceDomain,
      });
      const health = await upsertGuideSourceHealth(tx, {
        id: randomUUID(),
        sourceName: log.sourceName,
        sourceDomain: log.sourceDomain,
        wasSuccessful: log.status !== 'error',
        failureReason: log.errorCode ?? undefined,
        occurredAt: log.createdAt,
      });
      const quality = calculateGuideQualityScore({
        keyword: log.keyword,
        resultCount: log.resultCount,
        status: log.status,
        durationMs: log.durationMs,
        sourceSuccessCount: health.recentSuccess,
        sourceFailureCount: health.recentFailure,
        priorityWeight: preference?.priorityWeight ?? 0,
      });
      await createGuideQualitySnapshot(tx, {
        id: randomUUID(),
        logId: log.id,
        sourceName: log.sourceName,
        sourceDomain: log.sourceDomain,
        ...quality,
      });
    }

    return log;
  });

  return serializeGuideSearchLogMutation(result);
}
