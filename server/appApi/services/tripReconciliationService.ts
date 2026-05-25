import { randomUUID } from 'node:crypto';
import type { Prisma, TripReconciliationReport } from '@prisma/client';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import { createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import type {
  TripReconciliationActionResponseDto,
  TripReconciliationReportDto,
} from '../dto/tripReconciliation.js';

/**
 * G2 · Trip Reconciliation Service / 旅行对账日服务
 * 把 plan vs marker / checklist / expense / photo caption 聚合成完成度报告。
 */

interface UnconvertedItem {
  id: string;
  title: string;
  plannedDate: string | null;
}

async function ensureTrip(account: AuthenticatedAccount, tripId: string) {
  const prisma = getPrismaClient();
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, accountId: account.id, isDeleted: false },
    select: { id: true, name: true, endsAt: true },
  });
  if (!trip) throw createNotFoundError('trip not found');
  return trip;
}

function toDto(report: TripReconciliationReport, tripName: string): TripReconciliationReportDto {
  const unconvertedRaw = report.unconvertedPlanningItemIds as Prisma.JsonValue;
  const unconverted: UnconvertedItem[] = Array.isArray(unconvertedRaw)
    ? (unconvertedRaw as unknown[]).filter(
        (entry): entry is UnconvertedItem =>
          !!entry && typeof entry === 'object' && 'id' in entry && 'title' in entry,
      )
    : [];
  return {
    id: report.id,
    tripId: report.tripId,
    tripName,
    generatedAt: report.generatedAt.toISOString(),
    planVsMarkerCoverage: report.planVsMarkerCoverage,
    checklistCompletionRate: report.checklistCompletionRate,
    budgetVarianceCents: report.budgetVarianceCents,
    budgetPlannedCents: report.budgetPlannedCents,
    budgetActualCents: report.budgetActualCents,
    baseCurrency: 'CNY',
    unconvertedPlanningItems: unconverted,
    missingCaptionPhotoCount: report.missingCaptionPhotoCount,
    totalPhotoCount: 0,
    totalMarkerCount: 0,
    totalChecklistCount: 0,
    completedChecklistCount: 0,
    totalPlanningCount: 0,
    convertedPlanningCount: 0,
    summaryMarkdown: report.summaryMarkdown,
    acknowledgedAt: report.acknowledgedAt ? report.acknowledgedAt.toISOString() : null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export async function buildReconciliationData(account: AuthenticatedAccount, tripId: string) {
  const prisma = getPrismaClient();
  await ensureTrip(account, tripId);
  const [planningItems, checklistItems, markers, expenses, draftExpenses] = await Promise.all([
    prisma.tripPlanningItem.findMany({
      where: { tripId, accountId: account.id, isDeleted: false },
      select: { id: true, title: true, plannedDate: true, status: true },
    }),
    prisma.tripChecklistItem.findMany({
      where: { tripId, accountId: account.id, isDeleted: false },
      select: { id: true, stage: true },
    }),
    prisma.visitMarker.findMany({
      where: { tripId, accountId: account.id, isDeleted: false },
      select: {
        id: true,
        images: { select: { id: true, caption: true } },
      },
    }),
    prisma.tripExpense.findMany({
      where: { tripId, accountId: account.id, isDeleted: false, status: 'actual' },
      select: { amountCents: true },
    }),
    prisma.tripExpense.findMany({
      where: { tripId, accountId: account.id, isDeleted: false, status: 'draft' },
      select: { amountCents: true },
    }),
  ]);

  const totalPlanning = planningItems.length;
  const convertedPlanning = planningItems.filter((p) => p.status === 'converted').length;
  const planVsMarkerCoverage =
    totalPlanning === 0 ? 100 : Math.round((convertedPlanning / totalPlanning) * 100);

  const unconverted: UnconvertedItem[] = planningItems
    .filter((p) => p.status === 'planned')
    .map((p) => ({
      id: p.id,
      title: p.title,
      plannedDate: p.plannedDate ? p.plannedDate.toISOString() : null,
    }));

  const totalChecklist = checklistItems.length;
  const completedChecklist = checklistItems.filter((c) => c.stage === 'done').length;
  const checklistCompletionRate =
    totalChecklist === 0 ? 100 : Math.round((completedChecklist / totalChecklist) * 100);

  const allImages = markers.flatMap((m) => m.images);
  const totalPhotoCount = allImages.length;
  const missingCaptionPhotoCount = allImages.filter((img) => !img.caption?.trim()).length;

  const budgetActualCents = expenses.reduce((acc, e) => acc + e.amountCents, 0);
  const budgetPlannedCents = draftExpenses.reduce((acc, e) => acc + e.amountCents, 0);
  const budgetVarianceCents = budgetActualCents - budgetPlannedCents;

  return {
    totalPlanning,
    convertedPlanning,
    planVsMarkerCoverage,
    unconverted,
    totalChecklist,
    completedChecklist,
    checklistCompletionRate,
    totalMarkerCount: markers.length,
    totalPhotoCount,
    missingCaptionPhotoCount,
    budgetActualCents,
    budgetPlannedCents,
    budgetVarianceCents,
  };
}

function buildSummaryMarkdown(
  tripName: string,
  data: Awaited<ReturnType<typeof buildReconciliationData>>,
) {
  const lines: string[] = [];
  lines.push(`# ${tripName} · 旅行对账日 / Trip Reconciliation`);
  lines.push('');
  lines.push(
    `- 规划→记录 / Plan-to-marker coverage: **${data.planVsMarkerCoverage}%** (${data.convertedPlanning}/${data.totalPlanning})`,
  );
  lines.push(
    `- 清单完成度 / Checklist completion: **${data.checklistCompletionRate}%** (${data.completedChecklist}/${data.totalChecklist})`,
  );
  lines.push(
    `- 预算偏差 / Budget variance: **${(data.budgetVarianceCents / 100).toFixed(2)}** (实际 ${(data.budgetActualCents / 100).toFixed(2)} − 草案 ${(data.budgetPlannedCents / 100).toFixed(2)})`,
  );
  lines.push(
    `- 缺少说明的照片 / Photos missing caption: **${data.missingCaptionPhotoCount}/${data.totalPhotoCount}**`,
  );
  if (data.unconverted.length > 0) {
    lines.push('');
    lines.push('## 未完成的规划项 / Unconverted planning items');
    for (const item of data.unconverted) {
      lines.push(`- ${item.title}${item.plannedDate ? ` (${item.plannedDate.slice(0, 10)})` : ''}`);
    }
  }
  return lines.join('\n');
}

async function upsertReport(account: AuthenticatedAccount, tripId: string, tripName: string) {
  const prisma = getPrismaClient();
  const data = await buildReconciliationData(account, tripId);
  const summaryMarkdown = buildSummaryMarkdown(tripName, data);
  const now = new Date();
  const existing = await prisma.tripReconciliationReport.findUnique({
    where: { tripId },
  });
  const payload = {
    accountId: account.id,
    tripId,
    generatedAt: now,
    planVsMarkerCoverage: data.planVsMarkerCoverage,
    checklistCompletionRate: data.checklistCompletionRate,
    budgetVarianceCents: data.budgetVarianceCents,
    budgetPlannedCents: data.budgetPlannedCents,
    budgetActualCents: data.budgetActualCents,
    unconvertedPlanningItemIds: data.unconverted as unknown as Prisma.InputJsonValue,
    missingCaptionPhotoCount: data.missingCaptionPhotoCount,
    summaryMarkdown,
  };
  const report = existing
    ? await prisma.tripReconciliationReport.update({
        where: { id: existing.id },
        data: payload,
      })
    : await prisma.tripReconciliationReport.create({
        data: { id: randomUUID(), ...payload },
      });
  return { report, data };
}

function attachAggregates(
  dto: TripReconciliationReportDto,
  data: Awaited<ReturnType<typeof buildReconciliationData>>,
): TripReconciliationReportDto {
  return {
    ...dto,
    totalPhotoCount: data.totalPhotoCount,
    totalMarkerCount: data.totalMarkerCount,
    totalChecklistCount: data.totalChecklist,
    completedChecklistCount: data.completedChecklist,
    totalPlanningCount: data.totalPlanning,
    convertedPlanningCount: data.convertedPlanning,
  };
}

export async function getReconciliationReport(
  account: AuthenticatedAccount,
  tripId: string,
): Promise<TripReconciliationActionResponseDto> {
  const trip = await ensureTrip(account, tripId);
  const prisma = getPrismaClient();
  const existing = await prisma.tripReconciliationReport.findUnique({ where: { tripId } });
  if (!existing) {
    const { report, data } = await upsertReport(account, tripId, trip.name);
    return { report: attachAggregates(toDto(report, trip.name), data) };
  }
  const data = await buildReconciliationData(account, tripId);
  return { report: attachAggregates(toDto(existing, trip.name), data) };
}

export async function refreshReconciliationReport(
  account: AuthenticatedAccount,
  tripId: string,
): Promise<TripReconciliationActionResponseDto> {
  const trip = await ensureTrip(account, tripId);
  const { report, data } = await upsertReport(account, tripId, trip.name);
  return { report: attachAggregates(toDto(report, trip.name), data) };
}

export async function acknowledgeReconciliationReport(
  account: AuthenticatedAccount,
  tripId: string,
): Promise<TripReconciliationActionResponseDto> {
  const trip = await ensureTrip(account, tripId);
  const prisma = getPrismaClient();
  const existing = await prisma.tripReconciliationReport.findUnique({ where: { tripId } });
  if (!existing) {
    const refreshed = await refreshReconciliationReport(account, tripId);
    const acknowledged = await prisma.tripReconciliationReport.update({
      where: { tripId },
      data: { acknowledgedAt: new Date() },
    });
    const data = await buildReconciliationData(account, tripId);
    return { report: attachAggregates(toDto(acknowledged, trip.name), data) };
  }
  const updated = await prisma.tripReconciliationReport.update({
    where: { tripId },
    data: { acknowledgedAt: new Date() },
  });
  const data = await buildReconciliationData(account, tripId);
  return { report: attachAggregates(toDto(updated, trip.name), data) };
}
