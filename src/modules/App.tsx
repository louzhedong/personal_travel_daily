import { useEffect, useMemo, useState } from 'react';
import StatsPanel from '../components/StatsPanel';
import { createDefaultStore, loadPersistedStore, persistStore } from '../lib/storage';
import type { Scope, TravelStore } from '../types';
import AppContent from './app/AppContent';
import AppHero from './app/AppHero';
import AppOverlays from './app/AppOverlays';
import { focusMarkerById } from './app/markerNavigation';
import { useLockedModal } from './app/useLockedModal';
import { useMapContext } from './app/useMapContext';
import { useTravelStoreActions } from './app/useTravelStoreActions';

function App() {
  const [store, setStore] = useState<TravelStore>(() => createDefaultStore());
  const [storeReady, setStoreReady] = useState(false);
  const [detailMarkerId, setDetailMarkerId] = useState<string | null>(null);
  const [guideSearchOpen, setGuideSearchOpen] = useState(false);
  const [guideSearchQuery, setGuideSearchQuery] = useState('');
  const [guideSearchScope, setGuideSearchScope] = useState<Scope | 'all'>('all');
  const [guideSearchMarkerId, setGuideSearchMarkerId] = useState<string | null>(null);
  const [markerModalOpen, setMarkerModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataSyncOpen, setDataSyncOpen] = useState(false);
  const [message, setMessage] = useState('点击地图区域即可弹出表单，快速记录你的旅行足迹。');

  const closeMarkerModal = () => setMarkerModalOpen(false);
  const closeDataSync = () => setDataSyncOpen(false);
  const closeGuideSearch = () => {
    setGuideSearchOpen(false);
    setGuideSearchMarkerId(null);
  };

  useLockedModal(markerModalOpen, closeMarkerModal);
  useLockedModal(dataSyncOpen, closeDataSync);

  useEffect(() => {
    let cancelled = false;

    loadPersistedStore()
      .then((nextStore) => {
        if (!cancelled) {
          setStore(nextStore);
          setStoreReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStore(createDefaultStore());
          setStoreReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (storeReady) {
      void persistStore(store);
    }
  }, [store, storeReady]);

  const {
    scope,
    setScope,
    regionOptions,
    selectedRegionId,
    setSelectedRegionId,
    selectedRegion,
    currentMarkers,
    handleScopeChange,
    handleSelectRegion,
  } = useMapContext({
    markers: store.markers,
    setMessage,
    setMarkerModalOpen,
  });

  const detailMarker = useMemo(
    () => store.markers.find((item) => item.id === detailMarkerId) ?? null,
    [detailMarkerId, store.markers],
  );

  const detailMarkerGuides = useMemo(
    () =>
      detailMarkerId
        ? store.savedGuides
            .filter((item) => item.markerId === detailMarkerId)
            .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
        : [],
    [detailMarkerId, store.savedGuides],
  );

  const {
    activeUser,
    handleSwitchUser,
    handleCreateUser,
    handleSubmitMarker,
    handleDeleteMarker,
    handleUpdateMarker,
    handleSaveGuide,
    handleAttachGuideToMarker,
    handleRemoveSavedGuide,
    handleRestoreStore,
  } = useTravelStoreActions({
    store,
    setStore,
    setMessage,
    setSaving,
    setSelectedRegionId,
    setMarkerModalOpen,
    setDetailMarkerId,
  });

  const handleFocusMarkerFromGuide = (markerId: string) => {
    focusMarkerById({
      markerId,
      markers: store.markers,
      setScope,
      setSelectedRegionId,
      setMarkerModalOpen,
      setDetailMarkerId,
      onBeforeFocus: closeGuideSearch,
      onMissing: () => setMessage('关联的旅行记录已不存在。'),
      onFocused: (marker) => setMessage(`已定位到 ${marker.scopeName} · ${marker.city} 的旅行记录。`),
    });
  };

  const handleFocusMarkerFromTimeline = (markerId: string) => {
    focusMarkerById({
      markerId,
      markers: store.markers,
      setScope,
      setSelectedRegionId,
      setMarkerModalOpen,
      setDetailMarkerId,
      onMissing: () => setMessage('时间线中的旅行记录已不存在。'),
      onFocused: (marker) => setMessage(`已从时间线定位到 ${marker.scopeName} · ${marker.city}。`),
    });
  };

  const openGuideSearch = (query: string, nextScope: Scope | 'all', markerId?: string | null) => {
    setGuideSearchQuery(query);
    setGuideSearchScope(nextScope);
    setGuideSearchMarkerId(markerId ?? null);
    setGuideSearchOpen(true);
  };

  return (
    <div className="app-shell">
      <AppHero message={message} onOpenGuideSearch={() => openGuideSearch('', 'all')} />

      <StatsPanel scope={scope} markers={currentMarkers} users={store.users} />

      <AppContent
        scope={scope}
        regions={regionOptions}
        currentMarkers={currentMarkers}
        allMarkers={store.markers}
        users={store.users}
        activeUserId={store.activeUserId}
        activeUserName={activeUser?.name}
        selectedRegionId={selectedRegionId}
        savedGuides={store.savedGuides}
        onScopeChange={handleScopeChange}
        onSelectRegion={handleSelectRegion}
        onDeleteMarker={handleDeleteMarker}
        onViewMarkerDetail={setDetailMarkerId}
        onOpenDataSync={() => setDataSyncOpen(true)}
        onSwitchUser={handleSwitchUser}
        onCreateUser={handleCreateUser}
        onOpenMarkerFromTimeline={handleFocusMarkerFromTimeline}
        onOpenMarkerFromGuide={handleFocusMarkerFromGuide}
        onRemoveSavedGuide={handleRemoveSavedGuide}
      />

      <AppOverlays
        markerModalOpen={markerModalOpen}
        saving={saving}
        closeMarkerModal={closeMarkerModal}
        scope={scope}
        selectedRegionId={selectedRegionId}
        regions={regionOptions}
        selectedRegion={selectedRegion}
        activeUser={activeUser}
        onSubmitMarker={handleSubmitMarker}
        dataSyncOpen={dataSyncOpen}
        closeDataSync={closeDataSync}
        store={store}
        onRestoreStore={handleRestoreStore}
        detailMarker={detailMarker}
        detailUser={detailMarker ? store.users.find((item) => item.id === detailMarker.userId) : undefined}
        detailMarkerGuides={detailMarkerGuides}
        closeDetail={() => setDetailMarkerId(null)}
        onUpdateMarker={handleUpdateMarker}
        onRemoveSavedGuide={handleRemoveSavedGuide}
        onOpenGuideSearchFromDetail={(query, markerScope, markerId) => {
          setDetailMarkerId(null);
          openGuideSearch(query, markerScope, markerId);
        }}
        guideSearchOpen={guideSearchOpen}
        guideSearchQuery={guideSearchQuery}
        guideSearchScope={guideSearchScope}
        guideSearchMarkerId={guideSearchMarkerId}
        savedGuides={store.savedGuides}
        activeUserId={store.activeUserId}
        closeGuideSearch={closeGuideSearch}
        onSaveGuide={handleSaveGuide}
        onAttachGuideToMarker={handleAttachGuideToMarker}
      />
    </div>
  );
}

export default App;
