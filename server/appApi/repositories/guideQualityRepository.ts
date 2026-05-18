import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function createGuideQualitySnapshot(
  prisma: PrismaExecutor,
  input: {
    id: string;
    logId: string;
    sourceName?: string;
    sourceDomain?: string;
    score: number;
    level: 'high' | 'medium' | 'low';
    relevanceScore: number;
    completenessScore: number;
    readabilityScore: number;
    sourceStabilityScore: number;
    saveRateScore: number;
    priorityWeight: number;
    reasons: string[];
  },
) {
  return prisma.guideQualitySnapshot.create({
    data: {
      id: input.id,
      logId: input.logId,
      sourceName: input.sourceName,
      sourceDomain: input.sourceDomain,
      score: input.score,
      level: input.level,
      relevanceScore: input.relevanceScore,
      completenessScore: input.completenessScore,
      readabilityScore: input.readabilityScore,
      sourceStabilityScore: input.sourceStabilityScore,
      saveRateScore: input.saveRateScore,
      priorityWeight: input.priorityWeight,
      reasonsJson: input.reasons,
    },
  });
}
