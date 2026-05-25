import { randomUUID, createHash } from 'node:crypto';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Prisma, WishlistMoodCard } from '@prisma/client';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import { createNotFoundError, createValidationError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type {
  WishlistMoodBoardDto,
  WishlistMoodCardActionResponseDto,
  WishlistMoodCardDto,
  WishlistMoodCardKindDto,
  DeleteWishlistMoodCardResponseDto,
} from '../dto/wishlistMood.js';
import type {
  CreateWishlistMoodCardBody,
  UpdateWishlistMoodCardBody,
} from '../schemas/wishlistMood.js';

/**
 * G1 · Wishlist Mood Board Service / 愿望灵感板服务
 * 复用 archive media cache 目录约定，按 SHA256 去重写入图片字节。
 */

const ARCHIVE_CACHE_DIR = process.env.ARCHIVE_MEDIA_CACHE_DIR ?? 'var/archive-cache';
const IMAGE_MAX_BYTES = 8 * 1024 * 1024; // 8MB per mood card image

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
  if (bytes.byteLength > IMAGE_MAX_BYTES) {
    throw createValidationError('image exceeds 8MB upload limit');
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

async function persistImageDataUrl(accountId: string, dataUrl: string) {
  const prisma = getPrismaClient();
  const parsed = parseDataUrl(dataUrl);
  const sha256 = createHash('sha256').update(parsed.bytes).digest('hex');
  const dir = join(ARCHIVE_CACHE_DIR, accountId);
  await mkdir(dir, { recursive: true });
  const localPath = join(dir, `${sha256}.${parsed.ext}`);
  let needsWrite = true;
  try {
    await stat(localPath);
    needsWrite = false;
  } catch {
    needsWrite = true;
  }
  if (needsWrite) {
    await writeFile(localPath, parsed.bytes);
  }
  const existing = await prisma.archiveMediaCache.findFirst({
    where: { accountId, sha256 },
  });
  const fetchedAt = new Date();
  if (existing) {
    await prisma.archiveMediaCache.update({
      where: { id: existing.id },
      data: {
        sourceUrl: `mood-card:${sha256}`,
        byteSize: parsed.bytes.byteLength,
        mimeType: parsed.mimeType,
        localPath,
        fetchedAt,
        lastUsedAt: fetchedAt,
      },
    });
    return existing.id;
  }
  const created = await prisma.archiveMediaCache.create({
    data: {
      id: randomUUID(),
      accountId,
      sourceUrl: `mood-card:${sha256}`,
      sha256,
      byteSize: parsed.bytes.byteLength,
      mimeType: parsed.mimeType,
      localPath,
      fetchedAt,
      lastUsedAt: fetchedAt,
    },
  });
  return created.id;
}

function serializeCard(card: WishlistMoodCard): WishlistMoodCardDto {
  return {
    id: card.id,
    wishlistItemId: card.wishlistItemId,
    kind: card.kind as WishlistMoodCardKindDto,
    imageMediaId: card.imageMediaId ?? null,
    imageUrl: card.imageMediaId ? `/api/wishlist/mood/cards/${card.id}/image` : null,
    quoteText: card.quoteText ?? null,
    noteText: card.noteText ?? null,
    seasonWindow: card.seasonWindow ?? null,
    budgetCents: card.budgetCents ?? null,
    currency: card.currency ?? null,
    positionX: card.positionX,
    positionY: card.positionY,
    colorTag: card.colorTag ?? null,
    sortOrder: card.sortOrder,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };
}

async function refreshMoodCardCount(wishlistItemId: string) {
  const prisma = getPrismaClient();
  const count = await prisma.wishlistMoodCard.count({ where: { wishlistItemId } });
  await prisma.wishlistItem.update({
    where: { id: wishlistItemId },
    data: { moodCardCount: count },
  });
  return count;
}

async function ensureWishlistOwned(account: AuthenticatedAccount, wishlistItemId: string) {
  const prisma = getPrismaClient();
  const item = await prisma.wishlistItem.findFirst({
    where: { id: wishlistItemId, accountId: account.id, isDeleted: false },
    select: { id: true, title: true },
  });
  if (!item) throw createNotFoundError('wishlist item not found');
  return item;
}

export async function getMoodBoard(
  account: AuthenticatedAccount,
  wishlistItemId: string,
): Promise<WishlistMoodBoardDto> {
  const item = await ensureWishlistOwned(account, wishlistItemId);
  const prisma = getPrismaClient();
  const cards = await prisma.wishlistMoodCard.findMany({
    where: { wishlistItemId, accountId: account.id },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return {
    wishlistItemId: item.id,
    wishlistTitle: item.title,
    cards: cards.map(serializeCard),
  };
}

export async function createMoodCard(
  account: AuthenticatedAccount,
  wishlistItemId: string,
  body: CreateWishlistMoodCardBody,
): Promise<WishlistMoodCardActionResponseDto> {
  await ensureWishlistOwned(account, wishlistItemId);
  if (body.kind === 'image' && !body.imageDataUrl) {
    throw createValidationError('imageDataUrl required for image card');
  }
  if (body.kind === 'quote' && !body.quoteText) {
    throw createValidationError('quoteText required for quote card');
  }
  if (body.kind === 'note' && !body.noteText) {
    throw createValidationError('noteText required for note card');
  }
  if (body.kind === 'season' && !body.seasonWindow) {
    throw createValidationError('seasonWindow required for season card');
  }
  if (body.kind === 'budget' && body.budgetCents === undefined) {
    throw createValidationError('budgetCents required for budget card');
  }
  const prisma = getPrismaClient();
  const imageMediaId = body.imageDataUrl
    ? await persistImageDataUrl(account.id, body.imageDataUrl)
    : null;
  const now = new Date();
  const created = await prisma.wishlistMoodCard.create({
    data: {
      id: randomUUID(),
      accountId: account.id,
      wishlistItemId,
      kind: body.kind,
      imageMediaId,
      quoteText: body.quoteText,
      noteText: body.noteText,
      seasonWindow: body.seasonWindow,
      budgetCents: body.budgetCents,
      currency: body.currency ?? 'CNY',
      colorTag: body.colorTag,
      positionX: body.positionX ?? 0,
      positionY: body.positionY ?? 0,
      sortOrder: body.sortOrder ?? Math.floor(now.getTime() / 1000),
      createdAt: now,
      updatedAt: now,
    },
  });
  const moodCardCount = await refreshMoodCardCount(wishlistItemId);
  return { card: serializeCard(created), moodCardCount };
}

export async function updateMoodCard(
  account: AuthenticatedAccount,
  cardId: string,
  body: UpdateWishlistMoodCardBody,
): Promise<WishlistMoodCardActionResponseDto> {
  const prisma = getPrismaClient();
  const card = await prisma.wishlistMoodCard.findFirst({
    where: { id: cardId, accountId: account.id },
  });
  if (!card) throw createNotFoundError('mood card not found');
  const data: Prisma.WishlistMoodCardUpdateInput = {};
  if (body.quoteText !== undefined) data.quoteText = body.quoteText;
  if (body.noteText !== undefined) data.noteText = body.noteText;
  if (body.seasonWindow !== undefined) data.seasonWindow = body.seasonWindow;
  if (body.budgetCents !== undefined) data.budgetCents = body.budgetCents;
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.colorTag !== undefined) data.colorTag = body.colorTag;
  if (body.positionX !== undefined) data.positionX = body.positionX;
  if (body.positionY !== undefined) data.positionY = body.positionY;
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
  const updated = await prisma.wishlistMoodCard.update({
    where: { id: cardId },
    data,
  });
  const moodCardCount = await refreshMoodCardCount(card.wishlistItemId);
  return { card: serializeCard(updated), moodCardCount };
}

export async function deleteMoodCard(
  account: AuthenticatedAccount,
  cardId: string,
): Promise<DeleteWishlistMoodCardResponseDto> {
  const prisma = getPrismaClient();
  const card = await prisma.wishlistMoodCard.findFirst({
    where: { id: cardId, accountId: account.id },
  });
  if (!card) throw createNotFoundError('mood card not found');
  await prisma.wishlistMoodCard.delete({ where: { id: cardId } });
  const moodCardCount = await refreshMoodCardCount(card.wishlistItemId);
  return { deletedId: cardId, moodCardCount };
}

export async function readMoodCardImage(account: AuthenticatedAccount, cardId: string) {
  const prisma = getPrismaClient();
  const card = await prisma.wishlistMoodCard.findFirst({
    where: { id: cardId, accountId: account.id },
  });
  if (!card || !card.imageMediaId) throw createNotFoundError('mood card image not found');
  const cache = await prisma.archiveMediaCache.findUnique({
    where: { id: card.imageMediaId },
  });
  if (!cache) throw createNotFoundError('mood card image cache missing');
  const { readFile } = await import('node:fs/promises');
  const bytes = await readFile(cache.localPath);
  return { bytes, mimeType: cache.mimeType ?? 'application/octet-stream' };
}
