import { httpClient, getResourceBaseUrl } from './httpClient';
import type {
  TripReconciliationActionResponseDto,
  TripReconciliationReportDto,
} from './dto/tripReconciliation';

/**
 * G2 · Trip Reconciliation API client / 旅行对账日 API 客户端
 */
export async function fetchTripReconciliationReport(tripId: string) {
  return httpClient.get<TripReconciliationReportDto>(
    getResourceBaseUrl(),
    `/trips/${tripId}/reconciliation`,
  );
}

export async function refreshTripReconciliationReport(tripId: string) {
  return httpClient.post<TripReconciliationActionResponseDto>(
    getResourceBaseUrl(),
    `/trips/${tripId}/reconciliation/refresh`,
    {},
  );
}

export async function acknowledgeTripReconciliationReport(tripId: string) {
  return httpClient.post<TripReconciliationActionResponseDto>(
    getResourceBaseUrl(),
    `/trips/${tripId}/reconciliation/acknowledge`,
    {},
  );
}
