import type { Dispatch, SetStateAction } from 'react';
import type { TravelStore } from '../../types';
import { useCompanionActions } from './useCompanionActions';
import { useGuideActions } from './useGuideActions';
import { useMarkerActions } from './useMarkerActions';
import { useTripActions } from './useTripActions';

export interface UseTravelStoreActionsArgs {
  store: TravelStore;
  setStore: Dispatch<SetStateAction<TravelStore>>;
  setMessage: Dispatch<SetStateAction<string>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
  setSelectedRegionId: Dispatch<SetStateAction<string>>;
  setMarkerModalOpen: Dispatch<SetStateAction<boolean>>;
  setDetailMarkerId: Dispatch<SetStateAction<string | null>>;
}

export function useTravelStoreActions({
  store,
  setStore,
  setMessage,
  setSaving,
  setSelectedRegionId,
  setMarkerModalOpen,
  setDetailMarkerId,
}: UseTravelStoreActionsArgs) {
  const companionActions = useCompanionActions({ store, setStore, setMessage, setSaving, setSelectedRegionId, setMarkerModalOpen, setDetailMarkerId });
  const tripActions = useTripActions({ store, setStore, setMessage, setSaving, setSelectedRegionId, setMarkerModalOpen, setDetailMarkerId });
  const markerActions = useMarkerActions({ store, setStore, setMessage, setSaving, setSelectedRegionId, setMarkerModalOpen, setDetailMarkerId });
  const guideActions = useGuideActions({ store, setStore, setMessage, setSaving, setSelectedRegionId, setMarkerModalOpen, setDetailMarkerId });

  return {
    ...companionActions,
    ...tripActions,
    ...markerActions,
    ...guideActions,
  };
}
