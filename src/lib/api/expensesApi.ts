import { getResourceBaseUrl, httpClient } from './httpClient';
import type {
  CreateTripExpenseDraftFromPlanningInputDto,
  CreateTripExpenseInputDto,
  DeleteTripExpenseResponseDto,
  TripExpenseDto,
  TripExpenseListResponseDto,
  TripSettlementResponseDto,
  UpdateTripExpenseInputDto,
} from './types';

const expensesBaseUrl = getResourceBaseUrl();

export function fetchTripExpenses(tripId: string) {
  const params = new URLSearchParams({ tripId });
  return httpClient.get<TripExpenseListResponseDto>(expensesBaseUrl, `/expenses?${params.toString()}`);
}

export function fetchTripSettlement(tripId: string) {
  const params = new URLSearchParams({ tripId });
  return httpClient.get<TripSettlementResponseDto>(expensesBaseUrl, `/expenses/settlement?${params.toString()}`);
}

export function createTripExpense(input: CreateTripExpenseInputDto) {
  return httpClient.post<TripExpenseDto>(expensesBaseUrl, '/expenses', input);
}

export function updateTripExpense(expenseId: string, input: UpdateTripExpenseInputDto) {
  return httpClient.patch<TripExpenseDto>(expensesBaseUrl, `/expenses/${expenseId}`, input);
}

export function deleteTripExpense(expenseId: string) {
  return httpClient.delete<DeleteTripExpenseResponseDto>(expensesBaseUrl, `/expenses/${expenseId}`);
}

export function createTripExpenseDraftFromPlanning(
  tripId: string,
  itemId: string,
  input: CreateTripExpenseDraftFromPlanningInputDto,
) {
  return httpClient.post<TripExpenseDto>(expensesBaseUrl, `/expenses/from-planning/${tripId}/${itemId}`, input);
}
