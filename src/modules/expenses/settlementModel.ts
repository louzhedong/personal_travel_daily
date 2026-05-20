import type { TripSettlementResponseDto } from '../../lib/api/types';
import { formatExpenseMoney } from './expenseModel';

export function buildSettlementLines(settlement: TripSettlementResponseDto) {
  return settlement.transfers.map((item) => `${item.fromCompanionName} -> ${item.toCompanionName}: ${formatExpenseMoney(item.amountCents, item.currency)}`);
}
