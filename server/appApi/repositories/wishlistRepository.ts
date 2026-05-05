import type { Prisma, PrismaClient, WishlistPriority } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

const wishlistInclude = {
  createdByCompanion: true,
  planningItems: {
    where: {
      isDeleted: false,
      trip: {
        isDeleted: false,
      },
    },
    include: {
      trip: true,
    },
  },
} satisfies Prisma.WishlistItemInclude;

export async function listActiveWishlistItemsByAccountId(prisma: PrismaExecutor, accountId: string) {
  if (!('wishlistItem' in prisma)) {
    return [];
  }

  return prisma.wishlistItem.findMany({
    where: {
      accountId,
      isDeleted: false,
    },
    orderBy: [
      { priority: 'desc' },
      { targetYear: 'asc' },
      { createdAt: 'desc' },
    ],
    include: wishlistInclude,
  });
}

export async function findActiveWishlistItemById(
  prisma: PrismaExecutor,
  accountId: string,
  itemId: string,
) {
  return prisma.wishlistItem.findFirst({
    where: {
      id: itemId,
      accountId,
      isDeleted: false,
    },
    include: wishlistInclude,
  });
}

export async function findDuplicateActiveWishlistItem(
  prisma: PrismaExecutor,
  input: {
    accountId: string;
    companionId: string;
    scope: 'domestic' | 'international';
    scopeId: string;
    city: string;
    excludeId?: string;
  },
) {
  return prisma.wishlistItem.findFirst({
    where: {
      accountId: input.accountId,
      createdByCompanionId: input.companionId,
      scope: input.scope,
      scopeId: input.scopeId,
      city: input.city,
      isDeleted: false,
      ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
    },
    include: wishlistInclude,
  });
}

export async function createWishlistItem(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    createdByCompanionId: string;
    title: string;
    scope: 'domestic' | 'international';
    scopeId: string;
    scopeName: string;
    city: string;
    note?: string;
    priority: WishlistPriority;
    targetYear?: string | null;
    sourceGuideIdentity?: string;
    sourceGuideTitle?: string;
    sourceGuideSourceName?: string;
    sourceGuideSourceUrl?: string;
  },
) {
  return prisma.wishlistItem.create({
    data: input,
    include: wishlistInclude,
  });
}

export async function updateWishlistItem(
  prisma: PrismaExecutor,
  itemId: string,
  input: {
    title?: string;
    scope?: 'domestic' | 'international';
    scopeId?: string;
    scopeName?: string;
    city?: string;
    note?: string | null;
    priority?: WishlistPriority;
    targetYear?: string | null;
  },
) {
  return prisma.wishlistItem.update({
    where: { id: itemId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.scope !== undefined ? { scope: input.scope } : {}),
      ...(input.scopeId !== undefined ? { scopeId: input.scopeId } : {}),
      ...(input.scopeName !== undefined ? { scopeName: input.scopeName } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.targetYear !== undefined ? { targetYear: input.targetYear } : {}),
    },
    include: wishlistInclude,
  });
}

export async function softDeleteWishlistItem(
  prisma: PrismaExecutor,
  itemId: string,
  deletedAt: Date,
) {
  return prisma.wishlistItem.update({
    where: { id: itemId },
    data: {
      isDeleted: true,
      deletedAt,
    },
  });
}
