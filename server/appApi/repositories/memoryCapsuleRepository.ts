import type { MemoryCapsuleStatus, MemoryCapsuleType, Prisma, PrismaClient } from '@prisma/client';

type MemoryCapsulePrismaClient = Prisma.TransactionClient | PrismaClient;

export interface CreateMemoryCapsuleRecordInput {
  id: string;
  accountId: string;
  type: MemoryCapsuleType;
  targetId: string;
  title: string;
  subtitle?: string;
  template: string;
  configJson: Prisma.InputJsonValue;
}

export interface UpdateMemoryCapsuleRecordInput {
  title?: string;
  subtitle?: string | null;
  template?: string;
  status?: Exclude<MemoryCapsuleStatus, 'archived'>;
  configJson?: Prisma.InputJsonValue;
}

export function listMemoryCapsules(
  prisma: MemoryCapsulePrismaClient,
  accountId: string,
  includeArchived = false,
) {
  return prisma.memoryCapsule.findMany({
    where: {
      accountId,
      ...(includeArchived ? {} : { status: { not: 'archived' as const } }),
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  });
}

export function findMemoryCapsuleById(prisma: MemoryCapsulePrismaClient, accountId: string, id: string) {
  return prisma.memoryCapsule.findFirst({
    where: {
      id,
      accountId,
    },
  });
}

export function createMemoryCapsule(prisma: MemoryCapsulePrismaClient, input: CreateMemoryCapsuleRecordInput) {
  return prisma.memoryCapsule.create({
    data: input,
  });
}

export function updateMemoryCapsule(
  prisma: MemoryCapsulePrismaClient,
  id: string,
  input: UpdateMemoryCapsuleRecordInput,
) {
  return prisma.memoryCapsule.update({
    where: { id },
    data: input,
  });
}

export function archiveMemoryCapsule(prisma: MemoryCapsulePrismaClient, id: string, archivedAt: Date) {
  return prisma.memoryCapsule.update({
    where: { id },
    data: {
      status: 'archived',
      archivedAt,
    },
  });
}
