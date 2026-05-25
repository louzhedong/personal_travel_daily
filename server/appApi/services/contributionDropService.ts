import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ContributionDropBox, ContributionInboxItem, Prisma } from '@prisma/client';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import {
  createForbiddenError,
  createNotFoundError,
  createValidationError,
} from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type {
  AcceptContributionInboxBodyDto,
  ContributionAcceptKindDto,
  ContributionAcceptedAsTypeDto,
  ContributionDropBoxDto,
  ContributionDropBoxListResponseDto,
  ContributionDropBoxWithTokenDto,
  ContributionInboxActionResponseDto,
  ContributionInboxItemDto,
  ContributionInboxKindDto,
  ContributionInboxListResponseDto,
  ContributionInboxStatusDto,
  ContributionPublicMetaDto,
  ContributionPublicSubmitBodyDto,
  ContributionPublicSubmitResponseDto,
  CreateContributionDropBoxBodyDto,
} from '../dto/contribution.js';

/**
 * G4 · Companion Contribution Drop-Box Service / 旅伴匿名只写贡献链接服务
 * Token-hash + sandbox 目录隔离；公开端只写不读，私有端审核入库。
 */

const CONTRIBUTION_INBOX_DIR =
  process.env.CONTRIBUTION_INBOX_DIR ?? 'var/contribution-inbox';
const PHOTO_MAX_BYTES = 10 * 1024 * 1024; // 10MB per photo
const DEFAULT_EXPIRES_DAYS = 7;
const DEFAULT_MAX_UPLOADS = 50;

interface ParsedDataUrl {
  bytes: Buffer;
  mimeType: string;
  ext: string;
}

function parseDataUrl(dataUrl: string): ParsedDataUrl {
  const match = dataUrl.match(/^data:([\w./+-]+);base64,(.+)$/);
  if (!match) {
    throw createValidationError('imageDataUrl must be a base64 data URL');
  }
  const mimeType = match[1];
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.byteLength > PHOTO_MAX_BYTES) {
    throw createValidationError('image exceeds 10MB upload limit');
  }
  const ext = mimeType.includes('png')
    ? 'png'
    : mimeType.includes('webp')
      ? 'webp'
      : mimeType.includes('gif')
        ? 'gif'
        : 'jpg';
  return { bytes, mimeType, ext };
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function generateToken() {
  return randomBytes(24).toString('base64url');
}

function generateSlug() {
  return randomBytes(9).toString('base64url').replace(/[-_]/g, '').slice(0, 12);
}

function buildPublicUrl(slug: string) {
  return `/c/${slug}`;
}

function isDropBoxActive(dropBox: ContributionDropBox, now = new Date()) {
  if (dropBox.revokedAt) return false;
  if (dropBox.expiresAt <= now) return false;
  if (dropBox.usedCount >= dropBox.maxUploads) return false;
  return true;
}

function serializeDropBox(
  dropBox: ContributionDropBox,
  tripName: string | null,
  pendingInboxCount: number,
): ContributionDropBoxDto {
  return {
    id: dropBox.id,
    tripId: dropBox.tripId,
    tripName,
    title: dropBox.title,
    slug: dropBox.slug,
    tokenPreview: dropBox.tokenPreview,
    acceptKind: dropBox.acceptKind as ContributionAcceptKindDto,
    expiresAt: dropBox.expiresAt.toISOString(),
    revokedAt: dropBox.revokedAt ? dropBox.revokedAt.toISOString() : null,
    maxUploads: dropBox.maxUploads,
    usedCount: dropBox.usedCount,
    pendingInboxCount,
    note: dropBox.note ?? null,
    publicUrl: buildPublicUrl(dropBox.slug),
    createdAt: dropBox.createdAt.toISOString(),
    updatedAt: dropBox.updatedAt.toISOString(),
  };
}

function serializeInboxItem(
  item: ContributionInboxItem,
  dropBoxTitle: string,
): ContributionInboxItemDto {
  return {
    id: item.id,
    dropBoxId: item.dropBoxId,
    dropBoxTitle,
    submittedAt: item.submittedAt.toISOString(),
    kind: item.kind as ContributionInboxKindDto,
    imageUrl: item.imagePath ? `/api/contribution/inbox/${item.id}/image` : null,
    imageByteSize: item.imageByteSize ?? null,
    noteText: item.noteText ?? null,
    submitterDisplayName: item.submitterDisplayName ?? null,
    eventDate: item.eventDate ? item.eventDate.toISOString() : null,
    status: item.status as ContributionInboxStatusDto,
    acceptedAsType: (item.acceptedAsType as ContributionAcceptedAsTypeDto | null) ?? null,
    reviewedAt: item.reviewedAt ? item.reviewedAt.toISOString() : null,
  };
}

async function ensureTripOwned(
  account: AuthenticatedAccount,
  tripId: string,
): Promise<{ id: string; name: string }> {
  const prisma = getPrismaClient();
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, accountId: account.id, isDeleted: false },
    select: { id: true, name: true },
  });
  if (!trip) throw createNotFoundError('trip not found');
  return trip;
}

export async function createDropBox(
  account: AuthenticatedAccount,
  body: CreateContributionDropBoxBodyDto,
): Promise<{ dropBox: ContributionDropBoxWithTokenDto }> {
  const prisma = getPrismaClient();
  let tripName: string | null = null;
  if (body.tripId) {
    const trip = await ensureTripOwned(account, body.tripId);
    tripName = trip.name;
  }
  const token = generateToken();
  const tokenHash = hashToken(token);
  const slug = generateSlug();
  const expiresAt = new Date(
    Date.now() + (body.expiresInDays ?? DEFAULT_EXPIRES_DAYS) * 24 * 60 * 60 * 1000,
  );
  const created = await prisma.contributionDropBox.create({
    data: {
      id: randomUUID(),
      accountId: account.id,
      tripId: body.tripId ?? null,
      title: body.title,
      tokenHash,
      tokenPreview: token.slice(-8),
      slug,
      acceptKind: body.acceptKind ?? 'both',
      expiresAt,
      maxUploads: body.maxUploads ?? DEFAULT_MAX_UPLOADS,
      note: body.note ?? null,
    },
  });
  return {
    dropBox: { ...serializeDropBox(created, tripName, 0), token },
  };
}

export async function listDropBoxes(
  account: AuthenticatedAccount,
): Promise<ContributionDropBoxListResponseDto> {
  const prisma = getPrismaClient();
  const dropBoxes = await prisma.contributionDropBox.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: 'desc' },
    include: {
      trip: { select: { id: true, name: true } },
      _count: { select: { inboxItems: { where: { status: 'pending' } } } },
    },
  });
  return {
    dropBoxes: dropBoxes.map((d) =>
      serializeDropBox(d, d.trip?.name ?? null, d._count.inboxItems),
    ),
  };
}

export async function revokeDropBox(
  account: AuthenticatedAccount,
  dropBoxId: string,
): Promise<{ dropBox: ContributionDropBoxDto }> {
  const prisma = getPrismaClient();
  const dropBox = await prisma.contributionDropBox.findFirst({
    where: { id: dropBoxId, accountId: account.id },
  });
  if (!dropBox) throw createNotFoundError('drop box not found');
  const updated = dropBox.revokedAt
    ? dropBox
    : await prisma.contributionDropBox.update({
        where: { id: dropBox.id },
        data: { revokedAt: new Date() },
      });
  const trip = updated.tripId
    ? await prisma.trip.findUnique({ where: { id: updated.tripId }, select: { name: true } })
    : null;
  const pendingInboxCount = await prisma.contributionInboxItem.count({
    where: { dropBoxId: dropBox.id, status: 'pending' },
  });
  return {
    dropBox: serializeDropBox(updated, trip?.name ?? null, pendingInboxCount),
  };
}

export async function getPublicDropBoxMeta(
  slug: string,
): Promise<ContributionPublicMetaDto> {
  const prisma = getPrismaClient();
  const dropBox = await prisma.contributionDropBox.findUnique({ where: { slug } });
  if (!dropBox) throw createNotFoundError('drop box not found');
  const active = isDropBoxActive(dropBox);
  return {
    title: dropBox.title,
    acceptKind: dropBox.acceptKind as ContributionAcceptKindDto,
    remainingUploads: Math.max(dropBox.maxUploads - dropBox.usedCount, 0),
    expiresAt: dropBox.expiresAt.toISOString(),
    active,
    note: dropBox.note ?? null,
  };
}

export async function submitToDropBox(
  slug: string,
  body: ContributionPublicSubmitBodyDto,
): Promise<ContributionPublicSubmitResponseDto> {
  const prisma = getPrismaClient();
  const dropBox = await prisma.contributionDropBox.findUnique({ where: { slug } });
  if (!dropBox) throw createNotFoundError('drop box not found');
  if (!isDropBoxActive(dropBox)) {
    throw createForbiddenError('drop box is not active');
  }
  if (
    (dropBox.acceptKind === 'photo' && body.kind !== 'photo') ||
    (dropBox.acceptKind === 'note' && body.kind !== 'note')
  ) {
    throw createValidationError(`drop box only accepts ${dropBox.acceptKind}`);
  }

  let imagePath: string | null = null;
  let imageByteSize: number | null = null;
  let imageMimeType: string | null = null;
  if (body.kind === 'photo') {
    if (!body.imageDataUrl) {
      throw createValidationError('imageDataUrl required for photo kind');
    }
    const parsed = parseDataUrl(body.imageDataUrl);
    const dir = join(CONTRIBUTION_INBOX_DIR, dropBox.accountId, dropBox.id);
    await mkdir(dir, { recursive: true });
    const filename = `${Date.now()}-${randomBytes(4).toString('hex')}.${parsed.ext}`;
    imagePath = join(dir, filename);
    await writeFile(imagePath, parsed.bytes);
    imageByteSize = parsed.bytes.byteLength;
    imageMimeType = parsed.mimeType;
  }

  const eventDate = body.eventDate ? new Date(body.eventDate) : null;
  await prisma.$transaction(async (tx) => {
    await tx.contributionInboxItem.create({
      data: {
        id: randomUUID(),
        accountId: dropBox.accountId,
        dropBoxId: dropBox.id,
        submittedAt: new Date(),
        kind: body.kind,
        imagePath,
        imageByteSize,
        imageMimeType,
        noteText: body.noteText ?? null,
        submitterDisplayName: body.submitterDisplayName ?? null,
        eventDate,
        status: 'pending',
      },
    });
    await tx.contributionDropBox.update({
      where: { id: dropBox.id },
      data: { usedCount: { increment: 1 } },
    });
  });

  return {
    ok: true,
    remainingUploads: Math.max(dropBox.maxUploads - (dropBox.usedCount + 1), 0),
  };
}

export async function listInbox(
  account: AuthenticatedAccount,
): Promise<ContributionInboxListResponseDto> {
  const prisma = getPrismaClient();
  const items = await prisma.contributionInboxItem.findMany({
    where: { accountId: account.id },
    orderBy: { submittedAt: 'desc' },
    include: { dropBox: { select: { title: true } } },
  });
  return {
    items: items.map((item) => serializeInboxItem(item, item.dropBox.title)),
  };
}

export async function readInboxItemImage(
  account: AuthenticatedAccount,
  itemId: string,
): Promise<{ bytes: Buffer; mimeType: string }> {
  const prisma = getPrismaClient();
  const item = await prisma.contributionInboxItem.findFirst({
    where: { id: itemId, accountId: account.id },
  });
  if (!item || !item.imagePath) {
    throw createNotFoundError('inbox image not found');
  }
  try {
    await stat(item.imagePath);
  } catch {
    throw createNotFoundError('inbox image missing on disk');
  }
  const bytes = await readFile(item.imagePath);
  return { bytes, mimeType: item.imageMimeType ?? 'application/octet-stream' };
}

async function persistAcceptedPhoto(
  accountId: string,
  bytes: Buffer,
  mimeType: string,
): Promise<{ mediaId: string; localPath: string }> {
  const prisma = getPrismaClient();
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const archiveDir = process.env.ARCHIVE_MEDIA_CACHE_DIR ?? 'var/archive-cache';
  const dir = join(archiveDir, accountId);
  await mkdir(dir, { recursive: true });
  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  const localPath = join(dir, `${sha256}.${ext}`);
  let needsWrite = true;
  try {
    await stat(localPath);
    needsWrite = false;
  } catch {
    needsWrite = true;
  }
  if (needsWrite) {
    await writeFile(localPath, bytes);
  }
  const existing = await prisma.archiveMediaCache.findFirst({
    where: { accountId, sha256 },
  });
  const fetchedAt = new Date();
  if (existing) {
    await prisma.archiveMediaCache.update({
      where: { id: existing.id },
      data: { lastUsedAt: fetchedAt },
    });
    return { mediaId: existing.id, localPath: existing.localPath };
  }
  const created = await prisma.archiveMediaCache.create({
    data: {
      id: randomUUID(),
      accountId,
      sourceUrl: `contribution:${sha256}`,
      sha256,
      byteSize: bytes.byteLength,
      mimeType,
      localPath,
      fetchedAt,
      lastUsedAt: fetchedAt,
    },
  });
  return { mediaId: created.id, localPath: created.localPath };
}

export async function acceptInboxItem(
  account: AuthenticatedAccount,
  itemId: string,
  body: AcceptContributionInboxBodyDto,
): Promise<ContributionInboxActionResponseDto> {
  const prisma = getPrismaClient();
  const item = await prisma.contributionInboxItem.findFirst({
    where: { id: itemId, accountId: account.id },
    include: { dropBox: { select: { title: true, tripId: true } } },
  });
  if (!item) throw createNotFoundError('inbox item not found');
  if (item.status !== 'pending') {
    throw createValidationError('inbox item already reviewed');
  }
  const targetTripId = body.tripId ?? item.dropBox.tripId ?? null;
  if (targetTripId) {
    await ensureTripOwned(account, targetTripId);
  }

  if (body.acceptedAsType === 'journal') {
    if (!item.noteText) throw createValidationError('note item required for journal');
    if (!targetTripId) throw createValidationError('tripId required to accept as journal');
    const entryDate = item.eventDate ?? new Date();
    await prisma.journalEntry.upsert({
      where: { tripId_entryDate: { tripId: targetTripId, entryDate } } as Prisma.JournalEntryWhereUniqueInput,
      create: {
        id: randomUUID(),
        accountId: account.id,
        tripId: targetTripId,
        entryDate,
        bodyMd: item.noteText,
      },
      update: {
        bodyMd: item.noteText,
      },
    });
  } else if (body.acceptedAsType === 'photo' || body.acceptedAsType === 'marker') {
    if (!item.imagePath) throw createValidationError('photo item required');
    const bytes = await readFile(item.imagePath);
    const { mediaId, localPath } = await persistAcceptedPhoto(
      account.id,
      bytes,
      item.imageMimeType ?? 'image/jpeg',
    );
    if (body.acceptedAsType === 'marker') {
      const inbox = item.dropBox;
      const visitedAt = item.eventDate ?? new Date();
      const companion = await prisma.travelCompanion.findFirst({
        where: { accountId: account.id },
        select: { id: true },
      });
      if (!companion) throw createValidationError('account has no companion to attach marker');
      const markerId = randomUUID();
      await prisma.visitMarker.create({
        data: {
          id: markerId,
          accountId: account.id,
          companionId: companion.id,
          tripId: targetTripId ?? inbox.tripId ?? null,
          scope: 'domestic',
          scopeId: body.city ?? 'unknown',
          scopeName: body.title ?? item.dropBox.title,
          city: body.city ?? '',
          note: item.noteText ?? '',
          visitedStartAt: visitedAt,
          visitedEndAt: visitedAt,
          images: {
            create: {
              id: randomUUID(),
              imageUrl: localPath,
              sortOrder: 0,
              isFeatured: true,
            },
          },
        },
      });
    }
    void mediaId;
  } else {
    throw createValidationError('unsupported acceptedAsType');
  }

  const updated = await prisma.contributionInboxItem.update({
    where: { id: item.id },
    data: {
      status: 'accepted',
      acceptedAsType: body.acceptedAsType,
      reviewedAt: new Date(),
    },
  });
  return { item: serializeInboxItem(updated, item.dropBox.title) };
}

export async function rejectInboxItem(
  account: AuthenticatedAccount,
  itemId: string,
): Promise<ContributionInboxActionResponseDto> {
  const prisma = getPrismaClient();
  const item = await prisma.contributionInboxItem.findFirst({
    where: { id: itemId, accountId: account.id },
    include: { dropBox: { select: { title: true } } },
  });
  if (!item) throw createNotFoundError('inbox item not found');
  if (item.status !== 'pending') {
    throw createValidationError('inbox item already reviewed');
  }
  const updated = await prisma.contributionInboxItem.update({
    where: { id: item.id },
    data: { status: 'rejected', reviewedAt: new Date() },
  });
  return { item: serializeInboxItem(updated, item.dropBox.title) };
}
