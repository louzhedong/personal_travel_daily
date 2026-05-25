import { randomUUID } from 'node:crypto';
import type { JournalEntry, Prisma } from '@prisma/client';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import { createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type { JournalEntryDto, JournalMoodDto } from '../dto/journal.js';
import type {
  AcceptJournalDraftBody,
  GenerateJournalDraftBody,
  JournalListQuery,
  UpsertJournalEntryBody,
} from '../schemas/journal.js';

/**
 * F3 · Journal service / 智能日记服务
 * Aggregates markers/photos/expenses on a given day and weaves them into a Markdown draft.
 * 聚合当日 marker/photo/expense → 生成日记草稿，AI 不可用时回退到规则模板。
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_JOURNAL_MODEL ?? 'qwen2.5:3b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_JOURNAL_TIMEOUT_MS ?? 12_000);

function serialize(entry: JournalEntry): JournalEntryDto {
  return {
    id: entry.id,
    tripId: entry.tripId,
    entryDate: entry.entryDate.toISOString().slice(0, 10),
    mood: entry.mood as JournalMoodDto,
    weather: entry.weather,
    bodyMd: entry.bodyMd,
    aiDraftMd: entry.aiDraftMd,
    aiModel: entry.aiModel,
    aiGeneratedAt: entry.aiGeneratedAt?.toISOString() ?? null,
    isPinned: entry.isPinned,
    editedAt: entry.editedAt?.toISOString() ?? null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

async function findOwnedTrip(accountId: string, tripId: string) {
  const prisma = getPrismaClient();
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, accountId, isDeleted: false },
    select: { id: true, name: true, startsAt: true, endsAt: true },
  });
  if (!trip) throw createNotFoundError('trip not found');
  return trip;
}

function parseDateOnly(input: string) {
  return new Date(`${input}T00:00:00.000Z`);
}

export async function listJournalEntries(account: AuthenticatedAccount, query: JournalListQuery) {
  await findOwnedTrip(account.id, query.tripId);
  const prisma = getPrismaClient();
  const items = await prisma.journalEntry.findMany({
    where: { accountId: account.id, tripId: query.tripId },
    orderBy: { entryDate: 'asc' },
  });
  return { items: items.map(serialize) };
}

export async function upsertJournalEntry(
  account: AuthenticatedAccount,
  body: UpsertJournalEntryBody,
) {
  await findOwnedTrip(account.id, body.tripId);
  const prisma = getPrismaClient();
  const entryDate = parseDateOnly(body.entryDate);
  const now = new Date();

  const existing = await prisma.journalEntry.findFirst({
    where: { accountId: account.id, tripId: body.tripId, entryDate },
  });

  if (existing) {
    const updated = await prisma.journalEntry.update({
      where: { id: existing.id },
      data: {
        mood: body.mood ?? existing.mood,
        weather: body.weather ?? existing.weather,
        bodyMd: body.bodyMd ?? existing.bodyMd,
        isPinned: body.isPinned ?? existing.isPinned,
        editedAt: now,
      },
    });
    return serialize(updated);
  }

  const created = await prisma.journalEntry.create({
    data: {
      id: randomUUID(),
      accountId: account.id,
      tripId: body.tripId,
      entryDate,
      mood: body.mood ?? 'neutral',
      weather: body.weather ?? null,
      bodyMd: body.bodyMd ?? '',
      aiDraftMd: null,
      aiModel: null,
      aiGeneratedAt: null,
      isPinned: body.isPinned ?? false,
      editedAt: body.bodyMd ? now : null,
      createdAt: now,
      updatedAt: now,
    } satisfies Prisma.JournalEntryUncheckedCreateInput,
  });
  return serialize(created);
}

interface DayContext {
  tripTitle: string;
  date: string;
  markers: { scopeName: string; city: string; mood: string | null }[];
  photoCount: number;
  captions: string[];
  expenses: { title: string; category: string; amountCents: number; currency: string }[];
}

async function gatherDayContext(
  accountId: string,
  tripId: string,
  entryDate: Date,
): Promise<DayContext> {
  const prisma = getPrismaClient();
  const [trip, markers, photos, expenses] = await Promise.all([
    prisma.trip.findFirst({ where: { id: tripId, accountId }, select: { name: true } }),
    prisma.visitMarker.findMany({
      where: {
        accountId,
        tripId,
        isDeleted: false,
        visitedStartAt: {
          gte: entryDate,
          lt: new Date(entryDate.getTime() + 86_400_000),
        },
      },
      select: { scopeName: true, city: true, mood: true },
      take: 50,
    }),
    prisma.visitMarkerImage.findMany({
      where: {
        marker: {
          accountId,
          tripId,
          isDeleted: false,
          visitedStartAt: {
            gte: entryDate,
            lt: new Date(entryDate.getTime() + 86_400_000),
          },
        },
      },
      select: { caption: true },
      take: 80,
    }),
    prisma.tripExpense.findMany({
      where: {
        accountId,
        tripId,
        isDeleted: false,
        spentAt: {
          gte: entryDate,
          lt: new Date(entryDate.getTime() + 86_400_000),
        },
      },
      select: { title: true, category: true, amountCents: true, currency: true },
      take: 50,
    }),
  ]);

  return {
    tripTitle: trip?.name ?? 'Trip',
    date: entryDate.toISOString().slice(0, 10),
    markers: markers.map((m) => ({ scopeName: m.scopeName, city: m.city, mood: m.mood })),
    photoCount: photos.length,
    captions: photos.map((p) => p.caption ?? '').filter(Boolean).slice(0, 5),
    expenses: expenses.map((e) => ({
      title: e.title,
      category: e.category,
      amountCents: e.amountCents,
      currency: e.currency,
    })),
  };
}

function buildFallbackDraft(ctx: DayContext): string {
  const lines: string[] = [];
  lines.push(`# ${ctx.date} · ${ctx.tripTitle}`);
  lines.push('');
  if (ctx.markers.length > 0) {
    lines.push('## 今日足迹 / Today\u2019s Footprints');
    for (const m of ctx.markers) {
      lines.push(`- ${m.scopeName}（${m.city}）${m.mood ? `— ${m.mood}` : ''}`);
    }
    lines.push('');
  }
  if (ctx.photoCount > 0) {
    lines.push(`## 今日影像 / Photos`);
    lines.push(`记录了 ${ctx.photoCount} 张照片。`);
    if (ctx.captions.length > 0) {
      lines.push('');
      for (const c of ctx.captions) {
        lines.push(`> ${c}`);
      }
    }
    lines.push('');
  }
  if (ctx.expenses.length > 0) {
    lines.push('## 今日花销 / Expenses');
    for (const e of ctx.expenses) {
      const amount = (e.amountCents / 100).toFixed(2);
      lines.push(`- ${e.title}（${e.category}）${amount} ${e.currency}`);
    }
    lines.push('');
  }
  if (
    ctx.markers.length === 0 &&
    ctx.photoCount === 0 &&
    ctx.expenses.length === 0
  ) {
    lines.push('今天暂无记录，给自己留一句话吧。');
    lines.push('No records today — leave a note for the future you.');
  }
  return lines.join('\n').trim();
}

async function tryGenerateWithOllama(ctx: DayContext): Promise<string | null> {
  const prompt = [
    'You are a private travel journal writer. Output bilingual (Chinese first, English second).',
    'Use Markdown with H2 headings: 今日足迹/Footprints, 心境/Mood, 花销小记/Notes on Expenses.',
    'Be warm, concise, never invent facts. Return Markdown only, no preamble.',
    '',
    `Trip: ${ctx.tripTitle}`,
    `Date: ${ctx.date}`,
    `Markers: ${JSON.stringify(ctx.markers)}`,
    `PhotoCount: ${ctx.photoCount}`,
    `Captions: ${JSON.stringify(ctx.captions)}`,
    `Expenses: ${JSON.stringify(ctx.expenses)}`,
  ].join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { response?: string };
    const text = json.response?.trim();
    return text && text.length > 0 ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateJournalDraft(
  account: AuthenticatedAccount,
  body: GenerateJournalDraftBody,
) {
  await findOwnedTrip(account.id, body.tripId);
  const prisma = getPrismaClient();
  const entryDate = parseDateOnly(body.entryDate);
  const ctx = await gatherDayContext(account.id, body.tripId, entryDate);

  const llm = await tryGenerateWithOllama(ctx);
  const draft = llm ?? buildFallbackDraft(ctx);
  const source: 'llm' | 'fallback' = llm ? 'llm' : 'fallback';
  const now = new Date();

  const existing = await prisma.journalEntry.findFirst({
    where: { accountId: account.id, tripId: body.tripId, entryDate },
  });

  let entry: JournalEntry;
  if (existing) {
    entry = await prisma.journalEntry.update({
      where: { id: existing.id },
      data: {
        aiDraftMd: draft,
        aiModel: source === 'llm' ? OLLAMA_MODEL : 'fallback-rule',
        aiGeneratedAt: now,
      },
    });
  } else {
    entry = await prisma.journalEntry.create({
      data: {
        id: randomUUID(),
        accountId: account.id,
        tripId: body.tripId,
        entryDate,
        mood: 'neutral',
        weather: null,
        bodyMd: '',
        aiDraftMd: draft,
        aiModel: source === 'llm' ? OLLAMA_MODEL : 'fallback-rule',
        aiGeneratedAt: now,
        isPinned: false,
        editedAt: null,
        createdAt: now,
        updatedAt: now,
      } satisfies Prisma.JournalEntryUncheckedCreateInput,
    });
  }

  return { entry: serialize(entry), source };
}

export async function acceptJournalDraft(
  account: AuthenticatedAccount,
  body: AcceptJournalDraftBody,
) {
  const prisma = getPrismaClient();
  const entry = await prisma.journalEntry.findFirst({
    where: { id: body.entryId, accountId: account.id },
  });
  if (!entry) throw createNotFoundError('journal entry not found');
  if (!entry.aiDraftMd) {
    return serialize(entry);
  }
  const updated = await prisma.journalEntry.update({
    where: { id: entry.id },
    data: {
      bodyMd: entry.aiDraftMd,
      editedAt: new Date(),
    },
  });
  return serialize(updated);
}

export async function deleteJournalEntry(account: AuthenticatedAccount, entryId: string) {
  const prisma = getPrismaClient();
  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, accountId: account.id },
  });
  if (!entry) throw createNotFoundError('journal entry not found');
  await prisma.journalEntry.delete({ where: { id: entry.id } });
  return { deleted: true };
}
