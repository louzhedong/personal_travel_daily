import type { Prisma, PrismaClient, PrivateShareResourceType } from '@prisma/client';

type ShareLinkPrismaClient = Prisma.TransactionClient | PrismaClient;

export interface CreatePrivateShareLinkInput {
  id: string;
  accountId: string;
  resourceType: PrivateShareResourceType;
  resourceId: string;
  title: string;
  tokenHash: string;
  tokenPreview: string;
  passwordHash?: string;
  expiresAt?: Date;
  maxAccessCount?: number;
}

export interface UpdatePrivateShareLinkInput {
  title?: string;
  passwordHash?: string | null;
  expiresAt?: Date | null;
  maxAccessCount?: number | null;
}

export function listPrivateShareLinks(prisma: ShareLinkPrismaClient, accountId: string) {
  return prisma.privateShareLink.findMany({
    where: { accountId },
    include: {
      accessLogs: {
        orderBy: { accessedAt: 'desc' },
        take: 3,
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  });
}

export function findPrivateShareLinkById(prisma: ShareLinkPrismaClient, accountId: string, id: string) {
  return prisma.privateShareLink.findFirst({
    where: { id, accountId },
    include: {
      accessLogs: {
        orderBy: { accessedAt: 'desc' },
        take: 5,
      },
    },
  });
}

export function findPrivateShareLinkByTokenHash(prisma: ShareLinkPrismaClient, tokenHash: string) {
  return prisma.privateShareLink.findUnique({
    where: { tokenHash },
  });
}

export function createPrivateShareLink(prisma: ShareLinkPrismaClient, input: CreatePrivateShareLinkInput) {
  return prisma.privateShareLink.create({
    data: input,
    include: {
      accessLogs: {
        orderBy: { accessedAt: 'desc' },
        take: 3,
      },
    },
  });
}

export function updatePrivateShareLink(
  prisma: ShareLinkPrismaClient,
  id: string,
  input: UpdatePrivateShareLinkInput,
) {
  return prisma.privateShareLink.update({
    where: { id },
    data: input,
    include: {
      accessLogs: {
        orderBy: { accessedAt: 'desc' },
        take: 3,
      },
    },
  });
}

export function revokePrivateShareLink(prisma: ShareLinkPrismaClient, id: string, revokedAt: Date) {
  return prisma.privateShareLink.update({
    where: { id },
    data: { revokedAt },
    include: {
      accessLogs: {
        orderBy: { accessedAt: 'desc' },
        take: 3,
      },
    },
  });
}

export function recordPrivateShareAccess(
  prisma: ShareLinkPrismaClient,
  input: {
    id: string;
    shareLinkId: string;
    success: boolean;
    failureReason?: string;
    ipAddress?: string;
    userAgent?: string;
    accessedAt: Date;
  },
) {
  return prisma.privateShareAccessLog.create({
    data: input,
  });
}

export function markPrivateShareAccessed(prisma: ShareLinkPrismaClient, id: string, accessedAt: Date) {
  return prisma.privateShareLink.update({
    where: { id },
    data: {
      accessCount: { increment: 1 },
      lastAccessedAt: accessedAt,
    },
  });
}
