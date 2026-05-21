import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { getPrismaClient } from '../prisma.js';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import type { AssistantPreferenceResponseDto, AssistantSuggestionActionDto, AssistantSuggestionDto, AssistantSuggestionListResponseDto, AssistantSuggestionResponseDto, CreateAssistantSuggestionInputDto, UpdateAssistantPreferenceInputDto } from '../types.js';

function serializeSuggestion(item: { id: string; contextType: string; contextId: string | null; style: string; promptSummary: string; outputJson: unknown; status: string; createdAt: Date; confirmedAt: Date | null }): AssistantSuggestionDto {
  const output = item.outputJson as { actions?: AssistantSuggestionActionDto[] } | null;
  return {
    id: item.id,
    contextType: item.contextType as AssistantSuggestionDto['contextType'],
    contextId: item.contextId ?? undefined,
    style: item.style as AssistantSuggestionDto['style'],
    promptSummary: item.promptSummary,
    actions: Array.isArray(output?.actions) ? output.actions : [],
    status: item.status as AssistantSuggestionDto['status'],
    createdAt: item.createdAt.toISOString(),
    confirmedAt: item.confirmedAt?.toISOString(),
  };
}

async function buildContextSummary(accountId: string, contextType: string, contextId?: string) {
  const prisma = getPrismaClient();
  const [trips, openReminders, uncaptainedPhotos] = await Promise.all([
    prisma.trip.findMany({ where: { accountId, isDeleted: false }, orderBy: [{ startsAt: 'desc' }], take: 3 }),
    prisma.reminderState.count({ where: { accountId, status: 'open' } }),
    prisma.visitMarkerImage.count({ where: { caption: null, marker: { accountId, isDeleted: false } } }),
  ]);
  const focusTrip = contextId ? trips.find((trip) => trip.id === contextId) : trips[0];
  return {
    tripNames: trips.map((trip) => trip.name),
    focusTripName: focusTrip?.name,
    openReminders,
    uncaptainedPhotos,
    contextType,
  };
}

function buildRuleBasedActions(summary: Awaited<ReturnType<typeof buildContextSummary>>): AssistantSuggestionActionDto[] {
  const base = summary.contextType === 'photos'
    ? `优先补齐 ${summary.uncaptainedPhotos} 张缺说明照片，并把重复图片加入整理工作台。`
    : summary.contextType === 'trip'
      ? `围绕「${summary.focusTripName ?? '当前行程'}」整理当天规划、清单与缺说明照片。`
      : `从 ${summary.openReminders} 条提醒、${summary.uncaptainedPhotos} 张照片和最近行程中选出今天最值得处理的三件事。`;
  return [
    {
      id: randomUUID(),
      type: summary.contextType === 'photos' ? 'photo_caption' : 'planning_note',
      title: summary.contextType === 'journey' ? '故事线索建议' : 'AI 整理建议',
      description: base,
      payload: { aiSuggested: true, contextType: summary.contextType, source: 'rule-fallback' },
    },
    {
      id: randomUUID(),
      type: 'story_preface',
      title: '可确认后使用的文案草稿',
      description: `用 ${summary.tripNames.join('、') || '最近旅行'} 写一段低饱和旅行杂志风格导语。`,
      payload: { aiSuggested: true, writingStyle: 'travel-magazine' },
    },
  ];
}

export async function createAssistantSuggestion(account: AuthenticatedAccount, input: CreateAssistantSuggestionInputDto): Promise<AssistantSuggestionResponseDto> {
  const prisma = getPrismaClient();
  const preference = await prisma.assistantPreference.findUnique({ where: { accountId: account.id } });
  const style = input.style ?? preference?.style ?? 'magazine';
  const summary = await buildContextSummary(account.id, input.contextType, input.contextId);
  const outputJson = { actions: buildRuleBasedActions(summary), summary } as unknown as Prisma.InputJsonObject;
  const suggestion = await prisma.assistantSuggestion.create({
    data: {
      id: randomUUID(),
      accountId: account.id,
      contextType: input.contextType,
      contextId: input.contextId,
      style,
      promptSummary: `Private assistant suggestion for ${input.contextType}: reminders=${summary.openReminders}, photos=${summary.uncaptainedPhotos}`,
      outputJson,
    },
  });
  return { suggestion: serializeSuggestion(suggestion) };
}

export async function confirmAssistantSuggestion(account: AuthenticatedAccount, suggestionId: string): Promise<AssistantSuggestionResponseDto> {
  const prisma = getPrismaClient();
  const suggestion = await prisma.assistantSuggestion.update({
    where: { id: suggestionId },
    data: { status: 'confirmed', confirmedAt: new Date(), targetKind: 'assistant_action' },
  });
  if (suggestion.accountId !== account.id) {
    throw new Error('assistant suggestion not found');
  }
  return { suggestion: serializeSuggestion(suggestion) };
}

export async function dismissAssistantSuggestion(account: AuthenticatedAccount, suggestionId: string): Promise<AssistantSuggestionResponseDto> {
  const prisma = getPrismaClient();
  const suggestion = await prisma.assistantSuggestion.update({
    where: { id: suggestionId },
    data: { status: 'dismissed' },
  });
  if (suggestion.accountId !== account.id) {
    throw new Error('assistant suggestion not found');
  }
  return { suggestion: serializeSuggestion(suggestion) };
}

export async function listAssistantSuggestions(account: AuthenticatedAccount): Promise<AssistantSuggestionListResponseDto> {
  const prisma = getPrismaClient();
  const suggestions = await prisma.assistantSuggestion.findMany({
    where: { accountId: account.id },
    orderBy: [{ createdAt: 'desc' }],
    take: 8,
  });
  return { suggestions: suggestions.map(serializeSuggestion) };
}

export async function getAssistantPreference(account: AuthenticatedAccount): Promise<AssistantPreferenceResponseDto> {
  const prisma = getPrismaClient();
  const preference = await prisma.assistantPreference.findUnique({ where: { accountId: account.id } });
  return { preference: { style: (preference?.style ?? 'magazine') as AssistantPreferenceResponseDto['preference']['style'] } };
}

export async function updateAssistantPreference(account: AuthenticatedAccount, input: UpdateAssistantPreferenceInputDto): Promise<AssistantPreferenceResponseDto> {
  const prisma = getPrismaClient();
  const preference = await prisma.assistantPreference.upsert({
    where: { accountId: account.id },
    create: { id: randomUUID(), accountId: account.id, style: input.style },
    update: { style: input.style },
  });
  return { preference: { style: preference.style as AssistantPreferenceResponseDto['preference']['style'] } };
}
