import { useEffect, useMemo, useState } from 'react';
import StatsPanel from '../components/StatsPanel';
import { createDefaultStore } from '../lib/storage';
import { remoteTravelStoreRepository } from '../lib/repositories/remoteTravelStoreRepository';
import type { AuthAccount, Scope, TravelStore } from '../types';
import AppContent from './app/AppContent';
import AppHero from './app/AppHero';
import AppOverlays from './app/AppOverlays';
import { focusMarkerById } from './app/markerNavigation';
import { useLockedModal } from './app/useLockedModal';
import { useMapContext } from './app/useMapContext';
import { useTravelStoreActions } from './app/useTravelStoreActions';

interface TravelAppProps {
  account: AuthAccount;
  onLogout: () => Promise<void> | void;
}

function TravelApp({ account, onLogout }: TravelAppProps) {
  const [store, setStore] = useState<TravelStore>(() => createDefaultStore());
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [detailMarkerId, setDetailMarkerId] = useState<string | null>(null);
  const [guideSearchOpen, setGuideSearchOpen] = useState(false);
  const [guideSearchQuery, setGuideSearchQuery] = useState('');
  const [guideSearchScope, setGuideSearchScope] = useState<Scope | 'all'>('all');
  const [guideSearchMarkerId, setGuideSearchMarkerId] = useState<string | null>(null);
  const [guideSearchAutoSearch, setGuideSearchAutoSearch] = useState(false);
  const [markerModalOpen, setMarkerModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataSyncOpen, setDataSyncOpen] = useState(false);
  const [message, setMessage] = useState('点击地图区域即可弹出表单，快速记录你的旅行足迹。');

  const closeMarkerModal = () => setMarkerModalOpen(false);
  const closeDataSync = () => setDataSyncOpen(false);
  const closeGuideSearch = () => {
    setGuideSearchOpen(false);
    setGuideSearchMarkerId(null);
    setGuideSearchAutoSearch(false);
  };

  useLockedModal(markerModalOpen, closeMarkerModal);
  useLockedModal(dataSyncOpen, closeDataSync);

  useEffect(() => {
    let cancelled = false;

    remoteTravelStoreRepository
      .loadStore()
      .then((nextStore) => {
        if (!cancelled) {
          setStore(nextStore);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStore(createDefaultStore());
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncBackToTopVisibility = () => {
      setShowBackToTop(window.scrollY > 80);
    };

    syncBackToTopVisibility();
    window.addEventListener('scroll', syncBackToTopVisibility, { passive: true });
    return () => {
      window.removeEventListener('scroll', syncBackToTopVisibility);
    };
  }, []);

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
    handleSaveSearchHistory,
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

  const openGuideSearch = (
    query: string,
    nextScope: Scope | 'all',
    markerId?: string | null,
    autoSearch = false,
  ) => {
    setGuideSearchQuery(query);
    setGuideSearchScope(nextScope);
    setGuideSearchMarkerId(markerId ?? null);
    setGuideSearchAutoSearch(autoSearch);
    setGuideSearchOpen(true);
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowBackToTop(false);
  };

  const shouldShowMainBackToTop =
    showBackToTop && !guideSearchOpen && !markerModalOpen && !dataSyncOpen && detailMarker === null;

  return (
    <div className="app-shell">
      <AppHero
        message={message}
        onOpenGuideSearch={() => openGuideSearch('', 'all')}
        account={account}
        onLogout={onLogout}
      />

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
        detailMarker={detailMarker}
        detailUser={detailMarker ? store.users.find((item) => item.id === detailMarker.userId) : undefined}
        detailMarkerGuides={detailMarkerGuides}
        closeDetail={() => setDetailMarkerId(null)}
        onUpdateMarker={handleUpdateMarker}
        onRemoveSavedGuide={handleRemoveSavedGuide}
        onOpenGuideSearchFromDetail={(query, markerScope, markerId) => {
          setDetailMarkerId(null);
          openGuideSearch(
            query,
            markerScope,
            detailMarker?.userId === store.activeUserId ? markerId : null,
            true,
          );
        }}
        guideSearchOpen={guideSearchOpen}
        guideSearchQuery={guideSearchQuery}
        guideSearchScope={guideSearchScope}
        guideSearchAutoSearch={guideSearchAutoSearch}
        guideSearchMarkerId={guideSearchMarkerId}
        savedGuides={store.savedGuides}
        guideSearchHistory={store.guideSearchHistory}
        activeUserId={store.activeUserId}
        closeGuideSearch={closeGuideSearch}
        onSaveGuide={handleSaveGuide}
        onAttachGuideToMarker={handleAttachGuideToMarker}
        onSaveSearchHistory={handleSaveSearchHistory}
      />

      <div className={shouldShowMainBackToTop ? 'app-back-to-top is-visible' : 'app-back-to-top'}>
        <button
          type="button"
          className="app-back-to-top-button"
          aria-label="回到主页面顶部"
          onClick={handleBackToTop}
        >
          ↑
        </button>
      </div>
    </div>
  );
}

export default TravelApp;
