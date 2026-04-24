import type { Dispatch, SetStateAction } from 'react';
import { resolveMarkerMapRegionId } from '../../lib/mapRegionResolver';
import type { Scope, VisitMarker } from '../../types';

interface FocusMarkerByIdOptions {
  markerId: string;
  markers: VisitMarker[];
  setScope: Dispatch<SetStateAction<Scope>>;
  setSelectedRegionId: Dispatch<SetStateAction<string>>;
  setMarkerModalOpen: Dispatch<SetStateAction<boolean>>;
  setDetailMarkerId: Dispatch<SetStateAction<string | null>>;
  onBeforeFocus?: () => void;
  onMissing?: () => void;
  onFocused?: (marker: VisitMarker) => void;
}

export function focusMarkerById({
  markerId,
  markers,
  setScope,
  setSelectedRegionId,
  setMarkerModalOpen,
  setDetailMarkerId,
  onBeforeFocus,
  onMissing,
  onFocused,
}: FocusMarkerByIdOptions) {
  const targetMarker = markers.find((item) => item.id === markerId);
  if (!targetMarker) {
    onMissing?.();
    return null;
  }

  onBeforeFocus?.();
  setScope(targetMarker.scope);
  setSelectedRegionId(resolveMarkerMapRegionId(targetMarker, targetMarker.scope));
  setMarkerModalOpen(false);
  setDetailMarkerId(targetMarker.id);
  onFocused?.(targetMarker);

  return targetMarker;
}
