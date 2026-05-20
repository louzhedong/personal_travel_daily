import { getPrismaClient } from '../../prisma.js';
import type { TripSettlementBalanceDto, TripSettlementResponseDto, TripSettlementTransferDto } from '../../types.js';

function cents(value: number) {
  return Math.round(value);
}

export async function getTripSettlement(accountId: string, tripId: string): Promise<TripSettlementResponseDto> {
  const prisma = getPrismaClient();
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, accountId, isDeleted: false },
    include: {
      markers: { where: { isDeleted: false }, include: { companion: true } },
      expenses: { where: { isDeleted: false, status: 'actual' }, include: { companion: true, paidByCompanion: true } },
    },
  });
  if (!trip) throw new Error('trip not found');
  const companions = new Map<string, { id?: string; name: string }>();
  for (const marker of trip.markers) companions.set(marker.companionId, { id: marker.companionId, name: marker.companion.name });
  for (const expense of trip.expenses) {
    if (expense.companion) companions.set(expense.companion.id, { id: expense.companion.id, name: expense.companion.name });
    if (expense.paidByCompanion) companions.set(expense.paidByCompanion.id, { id: expense.paidByCompanion.id, name: expense.paidByCompanion.name });
  }
  if (companions.size === 0) companions.set('unassigned', { name: '未分摊' });
  const currency = trip.expenses[0]?.baseCurrency ?? trip.expenses[0]?.currency ?? 'CNY';
  const balances = new Map<string, TripSettlementBalanceDto>();
  for (const [id, companion] of companions) {
    balances.set(id, { companionId: companion.id, companionName: companion.name, paidCents: 0, shareCents: 0, balanceCents: 0, currency });
  }
  for (const expense of trip.expenses) {
    const payerId = expense.paidByCompanionId ?? expense.companionId ?? 'unassigned';
    const payer = balances.get(payerId) ?? balances.get('unassigned')!;
    payer.paidCents += expense.amountCents;
    const participantIds = expense.companionId ? [expense.companionId] : Array.from(balances.keys());
    const share = cents(expense.amountCents / Math.max(1, participantIds.length));
    for (const id of participantIds) {
      const item = balances.get(id) ?? balances.get('unassigned')!;
      item.shareCents += share;
    }
  }
  const balanceList = Array.from(balances.values()).map((item) => ({ ...item, balanceCents: item.paidCents - item.shareCents }));
  const debtors = balanceList.filter((item) => item.balanceCents < 0).map((item) => ({ ...item, rest: -item.balanceCents }));
  const creditors = balanceList.filter((item) => item.balanceCents > 0).map((item) => ({ ...item, rest: item.balanceCents }));
  const transfers: TripSettlementTransferDto[] = [];
  for (const debtor of debtors) {
    for (const creditor of creditors) {
      if (debtor.rest <= 0) break;
      if (creditor.rest <= 0) continue;
      const amount = Math.min(debtor.rest, creditor.rest);
      debtor.rest -= amount;
      creditor.rest -= amount;
      transfers.push({
        fromCompanionId: debtor.companionId,
        fromCompanionName: debtor.companionName,
        toCompanionId: creditor.companionId,
        toCompanionName: creditor.companionName,
        amountCents: amount,
        currency,
      });
    }
  }
  const csv = ['from,to,amount,currency', ...transfers.map((item) => `${item.fromCompanionName},${item.toCompanionName},${(item.amountCents / 100).toFixed(2)},${item.currency}`)].join('\n');
  return { tripId, currency, balances: balanceList, transfers, csv, generatedAt: new Date().toISOString() };
}
