import { httpClient, getResourceBaseUrl } from './httpClient';
import type { TravelStore } from '../../types';
import type { CreateTripInput, TripDetailResponseDto, UpdateTripInput } from './types';

export async function createTrip(input: CreateTripInput) {
  return httpClient.post<TravelStore>(getResourceBaseUrl(), '/trips', input);
}

export async function fetchTripDetail(id: string) {
  return httpClient.get<TripDetailResponseDto>(getResourceBaseUrl(), `/trips/${id}/detail`);
}

export async function updateTrip(id: string, input: UpdateTripInput) {
  return httpClient.patch<TravelStore>(getResourceBaseUrl(), `/trips/${id}`, input);
}

export async function deleteTrip(id: string) {
  return httpClient.delete<TravelStore>(getResourceBaseUrl(), `/trips/${id}`);
}
