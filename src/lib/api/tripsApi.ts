import { httpClient, getResourceBaseUrl } from './httpClient';
import type { TravelStore, TripChecklistItem } from '../../types';
import type {
  CreateTripInput,
  CreateTripChecklistItemInput,
  CreateTripPlanningItemInput,
  ConvertTripPlanningItemInput,
  DeleteTripChecklistItemResponseDto,
  DeleteTripPlanningItemResponseDto,
  GenerateTripChecklistInput,
  GenerateTripChecklistResultDto,
  TripChecklistResponseDto,
  TripDetailResponseDto,
  TripPlanningResponseDto,
  UpdateTripChecklistItemInput,
  UpdateTripInput,
  UpdateTripPlanningItemInput,
} from './types';

export async function createTrip(input: CreateTripInput) {
  return httpClient.post<TravelStore>(getResourceBaseUrl(), '/trips', input);
}

export async function fetchTripDetail(id: string) {
  return httpClient.get<TripDetailResponseDto>(getResourceBaseUrl(), `/trips/${id}/detail`);
}

export async function fetchTripChecklist(id: string) {
  return httpClient.get<TripChecklistResponseDto>(getResourceBaseUrl(), `/trips/${id}/checklist`);
}

export async function fetchTripPlanning(id: string) {
  return httpClient.get<TripPlanningResponseDto>(getResourceBaseUrl(), `/trips/${id}/planning`);
}

export async function createTripPlanningItem(id: string, input: CreateTripPlanningItemInput) {
  return httpClient.post<TripPlanningResponseDto['items'][number]>(getResourceBaseUrl(), `/trips/${id}/planning/items`, input);
}

export async function createTripPlanningItemFromWishlist(id: string, wishlistId: string) {
  return httpClient.post<TripPlanningResponseDto['items'][number]>(getResourceBaseUrl(), `/trips/${id}/planning/from-wishlist/${wishlistId}`, {});
}

export async function updateTripPlanningItem(id: string, itemId: string, input: UpdateTripPlanningItemInput) {
  return httpClient.patch<TripPlanningResponseDto['items'][number]>(getResourceBaseUrl(), `/trips/${id}/planning/items/${itemId}`, input);
}

export async function deleteTripPlanningItem(id: string, itemId: string) {
  return httpClient.delete<DeleteTripPlanningItemResponseDto>(getResourceBaseUrl(), `/trips/${id}/planning/items/${itemId}`);
}

export async function convertTripPlanningItemToMarker(id: string, itemId: string, input: ConvertTripPlanningItemInput) {
  return httpClient.post<TravelStore>(getResourceBaseUrl(), `/trips/${id}/planning/items/${itemId}/convert-to-marker`, input);
}

export async function generateTripChecklist(id: string, input: GenerateTripChecklistInput) {
  return httpClient.post<GenerateTripChecklistResultDto>(getResourceBaseUrl(), `/trips/${id}/checklist/generate`, input);
}

export async function createTripChecklistItem(id: string, input: CreateTripChecklistItemInput) {
  return httpClient.post<TripChecklistItem>(getResourceBaseUrl(), `/trips/${id}/checklist/items`, input);
}

export async function updateTripChecklistItem(id: string, itemId: string, input: UpdateTripChecklistItemInput) {
  return httpClient.patch<TripChecklistItem>(getResourceBaseUrl(), `/trips/${id}/checklist/items/${itemId}`, input);
}

export async function deleteTripChecklistItem(id: string, itemId: string) {
  return httpClient.delete<DeleteTripChecklistItemResponseDto>(getResourceBaseUrl(), `/trips/${id}/checklist/items/${itemId}`);
}

export async function updateTrip(id: string, input: UpdateTripInput) {
  return httpClient.patch<TravelStore>(getResourceBaseUrl(), `/trips/${id}`, input);
}

export async function deleteTrip(id: string) {
  return httpClient.delete<TravelStore>(getResourceBaseUrl(), `/trips/${id}`);
}
