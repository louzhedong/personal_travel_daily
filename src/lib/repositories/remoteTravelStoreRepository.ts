import type { TravelStore } from '../../types';
import { fetchAppBootstrap } from '../api/appBootstrapApi';
import { createCompanion, updateCompanion } from '../api/companionsApi';
import { createGuideSearchHistory, fetchGuideSearchHistories } from '../api/guideSearchHistoryApi';
import { createMarker, deleteMarker, updateMarker } from '../api/markersApi';
import { createSavedGuide, deleteSavedGuide, fetchSavedGuides } from '../api/savedGuidesApi';
import { createTrip, deleteTrip, updateTrip } from '../api/tripsApi';
import type {
  CreateCompanionInput,
  CreateGuideSearchHistoryInput,
  CreateMarkerInput,
  CreateSavedGuideInput,
  CreateTripInput,
  ListGuideSearchHistoriesQuery,
  ListSavedGuidesQuery,
  UpdateCompanionInput,
  UpdateMarkerInput,
  UpdateTripInput,
} from '../api/types';

export interface RemoteTravelStoreRepository {
  loadStore(): Promise<TravelStore>;
  createCompanion(input: CreateCompanionInput): Promise<TravelStore>;
  updateCompanion(id: string, input: UpdateCompanionInput): Promise<TravelStore>;
  createTrip(input: CreateTripInput): Promise<TravelStore>;
  updateTrip(id: string, input: UpdateTripInput): Promise<TravelStore>;
  deleteTrip(id: string): Promise<TravelStore>;
  createMarker(input: CreateMarkerInput): Promise<TravelStore>;
  updateMarker(id: string, input: UpdateMarkerInput): Promise<TravelStore>;
  deleteMarker(id: string): Promise<TravelStore>;
  listSavedGuides(query?: ListSavedGuidesQuery): Promise<TravelStore['savedGuides']>;
  createSavedGuide(input: CreateSavedGuideInput): Promise<{
    item: TravelStore['savedGuides'][number];
    deduplicated: boolean;
  }>;
  deleteSavedGuide(id: string): Promise<{ deletedId: string }>;
  listGuideSearchHistories(query?: ListGuideSearchHistoriesQuery): Promise<TravelStore['guideSearchHistory']>;
  createGuideSearchHistory(input: CreateGuideSearchHistoryInput): Promise<{
    item: TravelStore['guideSearchHistory'][number];
    deduplicated: boolean;
  }>;
}

export function createRemoteTravelStoreRepository(): RemoteTravelStoreRepository {
  return {
    async loadStore() {
      const response = await fetchAppBootstrap();
      return response.store;
    },
    createCompanion,
    updateCompanion,
    createTrip,
    updateTrip,
    deleteTrip,
    createMarker,
    updateMarker,
    deleteMarker,
    async listSavedGuides(query) {
      const response = await fetchSavedGuides(query);
      return response.items;
    },
    async createSavedGuide(input) {
      const response = await createSavedGuide(input);
      return {
        item: response.item,
        deduplicated: Boolean(response.deduplicated),
      };
    },
    deleteSavedGuide,
    async listGuideSearchHistories(query) {
      const response = await fetchGuideSearchHistories(query);
      return response.items;
    },
    async createGuideSearchHistory(input) {
      const response = await createGuideSearchHistory(input);
      return {
        item: response.item,
        deduplicated: Boolean(response.deduplicated),
      };
    },
  };
}

export const remoteTravelStoreRepository = createRemoteTravelStoreRepository();
