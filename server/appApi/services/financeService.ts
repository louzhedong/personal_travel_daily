import { randomUUID } from 'node:crypto';
import type { FinanceAccount, FxRateSnapshot } from '@prisma/client';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import { createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type {
  FinanceAccountDto,
  FinanceAccountKindDto,
  FinanceAnnualReportDto,
  FinanceAnnualReportSliceDto,
  FxRateSnapshotDto,
} from '../dto/finance.js';
import type {
  CreateFinanceAccountBody,
  FinanceAnnualReportQuery,
  RecordFxRateSnapshotBody,
  UpdateFinanceAccountBody,
} from '../schemas/finance.js';

/**
 * F5 · Finance service / 旅行财务深耕服务
 * Multi-account, FX history, annual report.
 * 多账户 / 汇率历史 / 年度报告。
 */

function serializeFinanceAccount(record: FinanceAccount): FinanceAccountDto {
  return {
    id: record.id,
    kind: record.kind as FinanceAccountKindDto,
    name: record.name,
    currency: record.currency,
    isArchived: record.isArchived,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function serializeFxSnapshot(record: FxRateSnapshot): FxRateSnapshotDto {
  return {
    id: record.id,
    baseCurrency: record.baseCurrency,
    quoteCurrency: record.quoteCurrency,
    rate: Number(record.rate),
    source: record.source,
    takenAt: record.takenAt.toISOString(),
  };
}

export async function listFinanceAccounts(account: AuthenticatedAccount) {
  const prisma = getPrismaClient();
  const items = await prisma.financeAccount.findMany({
    where: { accountId: account.id },
    orderBy: [{ isArchived: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  });
  return { items: items.map(serializeFinanceAccount) };
}

export async function createFinanceAccount(
  account: AuthenticatedAccount,
  body: CreateFinanceAccountBody,
) {
  const prisma = getPrismaClient();
  const now = new Date();
  const created = await prisma.financeAccount.create({
    data: {
      id: randomUUID(),
      accountId: account.id,
      kind: body.kind,
      name: body.name,
      currency: (body.currency ?? 'CNY').toUpperCase(),
      isArchived: false,
      sortOrder: body.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    },
  });
  return serializeFinanceAccount(created);
}

export async function updateFinanceAccount(
  account: AuthenticatedAccount,
  resourceId: string,
  body: UpdateFinanceAccountBody,
) {
  const prisma = getPrismaClient();
  const existing = await prisma.financeAccount.findFirst({
    where: { id: resourceId, accountId: account.id },
  });
  if (!existing) throw createNotFoundError('finance account not found');
  const updated = await prisma.financeAccount.update({
    where: { id: resourceId },
    data: {
      kind: body.kind ?? existing.kind,
      name: body.name ?? existing.name,
      currency: body.currency ? body.currency.toUpperCase() : existing.currency,
      isArchived: body.isArchived ?? existing.isArchived,
      sortOrder: body.sortOrder ?? existing.sortOrder,
    },
  });
  return serializeFinanceAccount(updated);
}

export async function deleteFinanceAccount(account: AuthenticatedAccount, resourceId: string) {
  const prisma = getPrismaClient();
  const existing = await prisma.financeAccount.findFirst({
    where: { id: resourceId, accountId: account.id },
  });
  if (!existing) throw createNotFoundError('finance account not found');
  // never hard delete if expenses reference it; soft-archive instead
  const referenced = await prisma.tripExpense.count({
    where: { financeAccountId: resourceId, isDeleted: false },
  });
  if (referenced > 0) {
    const updated = await prisma.financeAccount.update({
      where: { id: resourceId },
      data: { isArchived: true },
    });
    return { archived: true, account: serializeFinanceAccount(updated) };
  }
  await prisma.financeAccount.delete({ where: { id: resourceId } });
  return { archived: false, deleted: true };
}

export async function recordFxSnapshot(
  account: AuthenticatedAccount,
  body: RecordFxRateSnapshotBody,
) {
  const prisma = getPrismaClient();
  const created = await prisma.fxRateSnapshot.create({
    data: {
      id: randomUUID(),
      accountId: account.id,
      baseCurrency: body.baseCurrency.toUpperCase(),
      quoteCurrency: body.quoteCurrency.toUpperCase(),
      rate: body.rate,
      source: body.source ?? 'manual',
      takenAt: body.takenAt ? new Date(body.takenAt) : new Date(),
    },
  });
  return serializeFxSnapshot(created);
}

export async function listRecentFxSnapshots(
  account: AuthenticatedAccount,
  limit = 50,
) {
  const prisma = getPrismaClient();
  const items = await prisma.fxRateSnapshot.findMany({
    where: { accountId: account.id },
    orderBy: { takenAt: 'desc' },
    take: limit,
  });
  return { items: items.map(serializeFxSnapshot) };
}

function makeSliceMap() {
  return new Map<string, { label: string; amountCents: number; currency: string; count: number }>();
}

function aggregateSlice(
  map: ReturnType<typeof makeSliceMap>,
  key: string,
  label: string,
  amountCents: number,
  currency: string,
) {
  const existing = map.get(key);
  if (existing) {
    existing.amountCents += amountCents;
    existing.count += 1;
  } else {
    map.set(key, { label, amountCents, currency, count: 1 });
  }
}

function toSliceArray(
  map: ReturnType<typeof makeSliceMap>,
): FinanceAnnualReportSliceDto[] {
  return Array.from(map.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.amountCents - a.amountCents);
}

export async function getAnnualReport(
  account: AuthenticatedAccount,
  query: FinanceAnnualReportQuery,
): Promise<FinanceAnnualReportDto> {
  const prisma = getPrismaClient();
  const yearStart = new Date(`${query.year}-01-01T00:00:00.000Z`);
  const yearEnd = new Date(`${query.year + 1}-01-01T00:00:00.000Z`);
  const baseCurrency = (query.baseCurrency ?? 'CNY').toUpperCase();

  const [expenses, accounts, trips] = await Promise.all([
    prisma.tripExpense.findMany({
      where: {
        accountId: account.id,
        isDeleted: false,
        spentAt: { gte: yearStart, lt: yearEnd },
      },
      select: {
        id: true,
        category: true,
        amountCents: true,
        currency: true,
        spentAt: true,
        tripId: true,
        financeAccountId: true,
      },
    }),
    prisma.financeAccount.findMany({
      where: { accountId: account.id },
      select: { id: true, name: true, kind: true },
    }),
    prisma.trip.findMany({
      where: { accountId: account.id, isDeleted: false },
      select: { id: true, name: true, startsAt: true, endsAt: true },
    }),
  ]);

  const accountLabel = new Map(accounts.map((a) => [a.id, `${a.name}（${a.kind}）`] as const));
  const tripLabel = new Map(trips.map((t) => [t.id, t.name] as const));

  const byCategory = makeSliceMap();
  const byAccount = makeSliceMap();
  const byTrip = makeSliceMap();
  const monthly = new Map<number, number>();

  let totalCents = 0;
  for (const e of expenses) {
    // For now we treat amountCents in baseCurrency directly when currency matches;
    // mismatched currencies fall back to recorded amount (FX historical conversion is opt-in).
    const amount = e.currency.toUpperCase() === baseCurrency ? e.amountCents : e.amountCents;
    totalCents += amount;
    aggregateSlice(byCategory, e.category, e.category, amount, baseCurrency);
    const accountKey = e.financeAccountId ?? 'default-cash';
    aggregateSlice(
      byAccount,
      accountKey,
      accountLabel.get(accountKey) ?? '默认现金 / Default Cash',
      amount,
      baseCurrency,
    );
    if (e.tripId) {
      aggregateSlice(
        byTrip,
        e.tripId,
        tripLabel.get(e.tripId) ?? e.tripId,
        amount,
        baseCurrency,
      );
    }
    const month = e.spentAt.getUTCMonth() + 1;
    monthly.set(month, (monthly.get(month) ?? 0) + amount);
  }

  // Travel days within the year
  const dayMs = 86_400_000;
  const days = new Set<string>();
  for (const trip of trips) {
    const start = trip.startsAt < yearStart ? yearStart : trip.startsAt;
    const end = trip.endsAt > yearEnd ? yearEnd : trip.endsAt;
    if (end <= yearStart || start >= yearEnd) continue;
    for (let cursor = start.getTime(); cursor < end.getTime(); cursor += dayMs) {
      days.add(new Date(cursor).toISOString().slice(0, 10));
    }
  }
  const travelDays = days.size;

  return {
    year: query.year,
    baseCurrency,
    totalCents,
    travelDays,
    perDayCents: travelDays > 0 ? Math.round(totalCents / travelDays) : null,
    byCategory: toSliceArray(byCategory),
    byAccount: toSliceArray(byAccount),
    byTrip: toSliceArray(byTrip),
    monthly: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      amountCents: monthly.get(i + 1) ?? 0,
    })),
  };
}
