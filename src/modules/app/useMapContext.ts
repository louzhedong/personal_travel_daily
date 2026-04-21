import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { getRegionsByScope } from '../../data/regions';
import { loadGeoForScope } from '../../geo/loader';
import type { RegionOption, Scope, VisitMarker } from '../../types';

interface UseMapContextArgs {
  markers: VisitMarker[];
  setMessage: Dispatch<SetStateAction<string>>;
  setMarkerModalOpen: Dispatch<SetStateAction<boolean>>;
}

export function useMapContext({ markers, setMessage, setMarkerModalOpen }: UseMapContextArgs) {
  const [scope, setScope] = useState<Scope>('domestic');
  const [regionOptions, setRegionOptions] = useState<RegionOption[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState('');

  useEffect(() => {
    let cancelled = false;

    loadGeoForScope(scope)
      .then((features) => {
        if (cancelled) {
          return;
        }

        const presetMap = new Map(getRegionsByScope(scope).map((item) => [item.name, item.cities]));
        const options = features.map((feature) => ({
          id: feature.name,
          name: feature.name,
          cities: presetMap.get(feature.name) ?? [],
        }));
        setRegionOptions(options);
      })
      .catch(() => {
        if (!cancelled) {
          setRegionOptions([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [scope]);

  useEffect(() => {
    if (!selectedRegionId || regionOptions.some((item) => item.id === selectedRegionId)) {
      return;
    }

    setSelectedRegionId('');
    setMarkerModalOpen(false);
  }, [regionOptions, selectedRegionId, setMarkerModalOpen]);

  const currentMarkers = useMemo(
    () => markers.filter((item) => item.scope === scope),
    [markers, scope],
  );

  const selectedRegion = useMemo(
    () => regionOptions.find((item) => item.id === selectedRegionId),
    [regionOptions, selectedRegionId],
  );

  const handleScopeChange = (nextScope: Scope) => {
    setScope(nextScope);
    setMarkerModalOpen(false);
  };

  const handleSelectRegion = (region: RegionOption) => {
    setSelectedRegionId(region.id);
    setMarkerModalOpen(true);
    setMessage(`已选择 ${region.name}，请在弹窗中完成城市和描述填写。`);
  };

  return {
    scope,
    setScope,
    regionOptions,
    selectedRegionId,
    setSelectedRegionId,
    selectedRegion,
    currentMarkers,
    handleScopeChange,
    handleSelectRegion,
  };
}
