import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { getPrismaClient } from '../prisma.js';
import {
  createAdminAuditLog,
  listAdminAuditLogs,
} from '../repositories/adminAuditRepository.js';
import type { AdminAuditLogBody, AdminAuditLogQuery } from '../schemas/admin.js';
import type { AdminAuditLogDto } from '../types.js';

type AdminAuditLogRecord = Awaited<ReturnType<typeof createAdminAuditLog>>;

function normalizeMetadata(value: Prisma.JsonValue | null): Record<string, unknown> | undefined {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function serializeAdminAuditLog(log: AdminAuditLogRecord): AdminAuditLogDto {
  return {
    id: log.id,
    adminAccountId: log.adminAccountId,
    adminAccountName: log.adminAccount.name,
    action: log.action as AdminAuditLogDto['action'],
    targetKind: log.targetKind ?? undefined,
    targetId: log.targetId ?? undefined,
    metadata: normalizeMetadata(log.metadataJson),
    createdAt: log.createdAt.toISOString(),
  };
}

export async function recordAdminAuditLog(adminAccountId: string, input: AdminAuditLogBody) {
  const prisma = getPrismaClient();
  const log = await createAdminAuditLog(prisma, {
    id: randomUUID(),
    adminAccountId,
    action: input.action,
    targetKind: input.targetKind,
    targetId: input.targetId,
    metadataJson: input.metadata as Prisma.InputJsonValue | undefined,
  });

  return serializeAdminAuditLog(log);
}

export async function listAdminAuditTrail(query: AdminAuditLogQuery = {}) {
  const prisma = getPrismaClient();
  const logs = await listAdminAuditLogs(prisma, {
    action: query.action,
    targetKind: query.targetKind,
    limit: query.limit ?? 50,
  });

  return {
    logs: logs.map(serializeAdminAuditLog),
  };
}
