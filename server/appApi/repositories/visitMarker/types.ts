// visitMarker 共享类型 / Shared types for visit marker repository.
// 从 visitMarkerRepository.ts 平迁而来的内部类型定义，供 read/write/batch/search 子模块共用。
// Internal types extracted from visitMarkerRepository.ts, reused across read/write/batch/search sub-modules.
import type { Prisma, PrismaClient } from '@prisma/client';

export type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export type MarkerSearchRow = {
  id: string;
  accountId: string;
  companionId: string;
  tripId: string | null;
  scope: 'domestic' | 'international';
  scopeId: string;
  scopeName: string;
  city: string;
  note: string;
  tags: unknown;
  mood: string | null;
  weather: string | null;
  transport: string | null;
  budgetLevel: string | null;
  isDeleted: boolean;
  visitedStartAt: Date;
  visitedEndAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  searchScore: number;
};
