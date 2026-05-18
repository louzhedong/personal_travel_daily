import type { Prisma, PrismaClient } from '@prisma/client';

export type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function listMarkerTagVocabularyRows(prisma: PrismaExecutor, accountId: string) {
  if (!('markerTagVocabulary' in prisma)) {
    return [];
  }
  return prisma.markerTagVocabulary.findMany({
    where: { accountId },
    orderBy: [{ isHidden: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
  });
}

export async function findMarkerTagVocabularyRow(prisma: PrismaExecutor, accountId: string, value: string) {
  return prisma.markerTagVocabulary.findUnique({
    where: {
      accountId_value: { accountId, value },
    },
  });
}

export async function createMarkerTagVocabularyRow(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    value: string;
    label: string;
    source: string;
    sortOrder: number;
  },
) {
  return prisma.markerTagVocabulary.create({ data: input });
}

export async function upsertMarkerTagVocabularyRow(
  prisma: PrismaExecutor,
  accountId: string,
  value: string,
  input: { id: string; label: string; source: string; isHidden: boolean; sortOrder: number },
) {
  return prisma.markerTagVocabulary.upsert({
    where: {
      accountId_value: { accountId, value },
    },
    create: {
      id: input.id,
      accountId,
      value,
      label: input.label,
      source: input.source,
      isHidden: input.isHidden,
      sortOrder: input.sortOrder,
    },
    update: {
      label: input.label,
      isHidden: input.isHidden,
      sortOrder: input.sortOrder,
    },
  });
}

export async function updateMarkerTagVocabularyRow(
  prisma: PrismaExecutor,
  accountId: string,
  value: string,
  input: { label?: string; isHidden?: boolean; sortOrder?: number },
) {
  return prisma.markerTagVocabulary.update({
    where: {
      accountId_value: { accountId, value },
    },
    data: input,
  });
}

export async function deleteMarkerTagVocabularyRow(prisma: PrismaExecutor, accountId: string, value: string) {
  return prisma.markerTagVocabulary.delete({
    where: {
      accountId_value: { accountId, value },
    },
  });
}

export async function listActiveMarkerTagPayloads(prisma: PrismaExecutor, accountId: string) {
  if (!('visitMarker' in prisma)) {
    return [];
  }
  return prisma.visitMarker.findMany({
    where: { accountId, isDeleted: false },
    select: { tags: true },
  });
}
