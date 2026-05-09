import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export interface CreateAdminAuditLogInput {
  id: string;
  adminAccountId: string;
  action: string;
  targetKind?: string;
  targetId?: string;
  metadataJson?: Prisma.InputJsonValue;
}

export interface ListAdminAuditLogsInput {
  action?: string;
  targetKind?: string;
  limit?: number;
}

export async function createAdminAuditLog(prisma: PrismaExecutor, input: CreateAdminAuditLogInput) {
  return prisma.adminAuditLog.create({
    data: {
      id: input.id,
      adminAccountId: input.adminAccountId,
      action: input.action,
      targetKind: input.targetKind,
      targetId: input.targetId,
      metadataJson: input.metadataJson,
    },
    include: {
      adminAccount: true,
    },
  });
}

export async function listAdminAuditLogs(prisma: PrismaExecutor, input: ListAdminAuditLogsInput = {}) {
  return prisma.adminAuditLog.findMany({
    where: {
      action: input.action,
      targetKind: input.targetKind,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: input.limit ?? 50,
    include: {
      adminAccount: true,
    },
  });
}
