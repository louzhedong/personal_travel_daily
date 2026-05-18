import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { PrivateShareLink, PrivateShareResourceType } from '@prisma/client';
import { hashPassword, verifyPassword } from '../auth/password.js';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import { createForbiddenError, createNotFoundError, createUnauthorizedError, createValidationError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type {
  PrivateShareAccessLogDto,
  PrivateShareLinkDto,
  PrivateShareLinkListResponseDto,
  PublicShareAccessResponseDto,
  PublicShareResourceDto,
} from '../types.js';
import type {
  CreateShareLinkBody,
  PublicShareAccessBody,
  UpdateShareLinkBody,
} from '../schemas/shareLinks.js';
import {
  createPrivateShareLink,
  findPrivateShareLinkById,
  findPrivateShareLinkByTokenHash,
  listPrivateShareLinks,
  markPrivateShareAccessed,
  recordPrivateShareAccess,
  revokePrivateShareLink,
  updatePrivateShareLink,
} from '../repositories/shareLinkRepository.js';
import { getCompanionMemory } from './companionMemoryService.js';
import { getAccountMemoryCapsule } from './memoryCapsuleService.js';
import { getAnnualReview } from './statsService.js';
import { getTripDetail } from './tripDetailService.js';

type ShareLinkWithLogs = PrivateShareLink & {
  accessLogs?: Array<{
    id: string;
    success: boolean;
    failureReason: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    accessedAt: Date;
  }>;
};

interface AccessMeta {
  ipAddress?: string;
  userAgent?: string;
}

function hashShareToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function generateShareToken() {
  return randomBytes(32).toString('base64url');
}

function toIsoString(value?: Date | null) {
  return value ? value.toISOString() : undefined;
}

function getShareStatus(link: PrivateShareLink, now = new Date()) {
  if (link.revokedAt) return 'revoked' as const;
  if (link.expiresAt && link.expiresAt <= now) return 'expired' as const;
  if (link.maxAccessCount !== null && link.accessCount >= link.maxAccessCount) return 'depleted' as const;
  return 'active' as const;
}

function serializeAccessLog(log: NonNullable<ShareLinkWithLogs['accessLogs']>[number]): PrivateShareAccessLogDto {
  return {
    id: log.id,
    success: log.success,
    failureReason: log.failureReason ?? undefined,
    ipAddress: log.ipAddress ?? undefined,
    userAgent: log.userAgent ?? undefined,
    accessedAt: log.accessedAt.toISOString(),
  };
}

function serializeShareLink(link: ShareLinkWithLogs, url?: string): PrivateShareLinkDto {
  return {
    id: link.id,
    resourceType: link.resourceType,
    resourceId: link.resourceId,
    title: link.title,
    status: getShareStatus(link),
    url,
    tokenPreview: link.tokenPreview,
    passwordProtected: !!link.passwordHash,
    expiresAt: toIsoString(link.expiresAt),
    maxAccessCount: link.maxAccessCount ?? undefined,
    accessCount: link.accessCount,
    lastAccessedAt: toIsoString(link.lastAccessedAt),
    revokedAt: toIsoString(link.revokedAt),
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}

async function getShareOwner(accountId: string): Promise<AuthenticatedAccount> {
  const prisma = getPrismaClient();
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { id: true, name: true, username: true, role: true },
  });
  if (!account) {
    throw createNotFoundError('share owner not found');
  }
  return account;
}

async function composeSharedResource(link: PrivateShareLink): Promise<PublicShareResourceDto> {
  const owner = await getShareOwner(link.accountId);
  const generatedAt = new Date().toISOString();

  if (link.resourceType === 'trip_story') {
    return {
      kind: link.resourceType,
      title: link.title,
      generatedAt,
      tripStory: await getTripDetail(link.accountId, link.resourceId),
    };
  }
  if (link.resourceType === 'annual_review') {
    return {
      kind: link.resourceType,
      title: link.title,
      generatedAt,
      annualReview: await getAnnualReview(owner, { year: link.resourceId }),
    };
  }
  if (link.resourceType === 'companion_memory') {
    return {
      kind: link.resourceType,
      title: link.title,
      generatedAt,
      companionMemory: await getCompanionMemory(link.accountId, link.resourceId),
    };
  }

  const response = await getAccountMemoryCapsule(owner, link.resourceId);
  return {
    kind: link.resourceType,
    title: link.title,
    generatedAt,
    memoryCapsule: response.capsule,
  };
}

async function assertShareResourceExists(account: AuthenticatedAccount, resourceType: PrivateShareResourceType, resourceId: string) {
  if (resourceType === 'trip_story') {
    await getTripDetail(account.id, resourceId);
    return;
  }
  if (resourceType === 'annual_review') {
    if (!/^\d{4}$/.test(resourceId)) {
      throw createValidationError('annual review resourceId must be a four-digit year');
    }
    await getAnnualReview(account, { year: resourceId });
    return;
  }
  if (resourceType === 'companion_memory') {
    await getCompanionMemory(account.id, resourceId);
    return;
  }
  await getAccountMemoryCapsule(account, resourceId);
}

function defaultShareTitle(resourceType: PrivateShareResourceType, resourceId: string) {
  const labels: Record<PrivateShareResourceType, string> = {
    trip_story: '行程故事',
    annual_review: '年度回顾',
    companion_memory: '旅伴回忆',
    memory_capsule: '旅行胶囊',
  };
  return `${labels[resourceType]} · ${resourceId}`;
}

async function recordAccess(link: PrivateShareLink, success: boolean, meta: AccessMeta, failureReason?: string) {
  await recordPrivateShareAccess(getPrismaClient(), {
    id: randomUUID(),
    shareLinkId: link.id,
    success,
    failureReason,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    accessedAt: new Date(),
  });
}

export async function listAccountPrivateShareLinks(account: AuthenticatedAccount): Promise<PrivateShareLinkListResponseDto> {
  const links = await listPrivateShareLinks(getPrismaClient(), account.id);
  return { links: links.map((link) => serializeShareLink(link)) };
}

export async function createAccountPrivateShareLink(account: AuthenticatedAccount, input: CreateShareLinkBody) {
  await assertShareResourceExists(account, input.resourceType, input.resourceId);

  const token = generateShareToken();
  const tokenHash = hashShareToken(token);
  const link = await createPrivateShareLink(getPrismaClient(), {
    id: randomUUID(),
    accountId: account.id,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    title: input.title ?? defaultShareTitle(input.resourceType, input.resourceId),
    tokenHash,
    tokenPreview: token.slice(-8),
    passwordHash: input.password ? await hashPassword(input.password) : undefined,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    maxAccessCount: input.maxAccessCount,
  });

  return {
    link: serializeShareLink(link, `/share/${encodeURIComponent(token)}`),
  };
}

export async function updateAccountPrivateShareLink(
  account: AuthenticatedAccount,
  linkId: string,
  input: UpdateShareLinkBody,
) {
  const current = await findPrivateShareLinkById(getPrismaClient(), account.id, linkId);
  if (!current) {
    throw createNotFoundError('share link not found');
  }
  if (current.revokedAt) {
    throw createValidationError('revoked share link cannot be updated');
  }

  const link = await updatePrivateShareLink(getPrismaClient(), current.id, {
    title: input.title,
    expiresAt: input.expiresAt === undefined ? undefined : input.expiresAt ? new Date(input.expiresAt) : null,
    passwordHash:
      input.password === undefined ? undefined : input.password ? await hashPassword(input.password) : null,
    maxAccessCount: input.maxAccessCount,
  });
  return { link: serializeShareLink(link) };
}

export async function revokeAccountPrivateShareLink(account: AuthenticatedAccount, linkId: string) {
  const current = await findPrivateShareLinkById(getPrismaClient(), account.id, linkId);
  if (!current) {
    throw createNotFoundError('share link not found');
  }
  const link = current.revokedAt ? current : await revokePrivateShareLink(getPrismaClient(), current.id, new Date());
  return { link: serializeShareLink(link) };
}

export async function accessPublicPrivateShareLink(
  token: string,
  input: PublicShareAccessBody,
  meta: AccessMeta,
): Promise<PublicShareAccessResponseDto> {
  const link = await findPrivateShareLinkByTokenHash(getPrismaClient(), hashShareToken(token));
  if (!link) {
    throw createNotFoundError('share link not found');
  }

  const status = getShareStatus(link);
  if (status !== 'active') {
    await recordAccess(link, false, meta, status);
    throw createForbiddenError(`share link is ${status}`);
  }

  if (link.passwordHash && !input.password) {
    await recordAccess(link, false, meta, 'password_required');
    return {
      passwordRequired: true,
      link: serializeShareLink(link),
    };
  }

  if (link.passwordHash && !(await verifyPassword(input.password ?? '', link.passwordHash))) {
    await recordAccess(link, false, meta, 'invalid_password');
    throw createUnauthorizedError('share password is invalid');
  }

  const resource = await composeSharedResource(link);
  await recordAccess(link, true, meta);
  await markPrivateShareAccessed(getPrismaClient(), link.id, new Date());

  return {
    link: serializeShareLink({ ...link, accessCount: link.accessCount + 1, lastAccessedAt: new Date() }),
    resource,
  };
}

export { serializeAccessLog };
