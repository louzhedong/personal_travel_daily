import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { getRegionsByScope } from '../../data/regions';
import { loadGeoForScope } from '../../geo/loader';
import { resolveMarkerMapRegionId } from '../../lib/mapRegionResolver';
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

  const visibleMarkers = useMemo(() => {
    if (!selectedRegionId) {
      return currentMarkers;
    }

    return currentMarkers.filter((marker) => resolveMarkerMapRegionId(marker, scope) === selectedRegionId);
  }, [currentMarkers, scope, selectedRegionId]);

  const selectedRegion = useMemo(
    () => regionOptions.find((item) => item.id === selectedRegionId),
    [regionOptions, selectedRegionId],
  );

  const handleScopeChange = (nextScope: Scope) => {
    setScope(nextScope);
    setSelectedRegionId('');
    setMarkerModalOpen(false);
  };

  const handleSelectRegion = (region: RegionOption) => {
    const isClearing = selectedRegionId === region.id;
    setSelectedRegionId((current) => (current === region.id ? '' : region.id));
    setMarkerModalOpen(false);
    setMessage(isClearing ? '已清除区域筛选。' : `已按 ${region.name} 筛选当前地图与记录列表。`);
  };

  const handleOpenSelectedRegionComposer = () => {
    if (!selectedRegion) {
      setMessage('请先在地图上选择一个区域，再新增旅行记录。');
      return;
    }

    setMarkerModalOpen(true);
    setMessage(`已选择 ${selectedRegion.name}，请在弹窗中完成城市和描述填写。`);
  };

  const handleClearSelectedRegion = () => {
    setSelectedRegionId('');
    setMessage('已清除区域筛选。');
  };

  return {
    scope,
    setScope,
    regionOptions,
    selectedRegionId,
    setSelectedRegionId,
    selectedRegion,
    currentMarkers,
    visibleMarkers,
    handleScopeChange,
    handleSelectRegion,
    handleOpenSelectedRegionComposer,
    handleClearSelectedRegion,
  };
}
