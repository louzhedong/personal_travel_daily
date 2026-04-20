import { useEffect, useMemo, useState } from 'react';
import GuideSearchPanel from '../components/GuideSearchPanel';
import MarkerForm, { type MarkerFormValue } from '../components/MarkerForm';
import MarkerDetailPanel from '../components/MarkerDetailPanel';
import MarkerList from '../components/MarkerList';
import StatsPanel from '../components/StatsPanel';
import TravelMap from '../components/TravelMap';
import TravelIcon from '../components/TravelIcon';
import UserManager from '../components/UserManager';
import DataSync from '../components/DataSync';
import { getRegionsByScope } from '../data/regions';
import { loadGeoForScope } from '../geo/loader';
import { createDefaultStore, createMarker, createUser, loadPersistedStore, persistStore } from '../lib/storage';
import type { RegionOption, Scope, TravelStore } from '../types';

function App() {
  const [scope, setScope] = useState<Scope>('domestic');
  const [store, setStore] = useState<TravelStore>(() => createDefaultStore());
  const [storeReady, setStoreReady] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [detailMarkerId, setDetailMarkerId] = useState<string | null>(null);
  const [guideSearchOpen, setGuideSearchOpen] = useState(false);
  const [guideSearchQuery, setGuideSearchQuery] = useState('');
  const [guideSearchScope, setGuideSearchScope] = useState<Scope | 'all'>('all');
  const [markerModalOpen, setMarkerModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('点击地图区域即可弹出表单，快速记录你的旅行足迹。');

  const [regionOptions, setRegionOptions] = useState<RegionOption[]>([]);
  useEffect(() => {
    let cancelled = false;
    loadGeoForScope(scope)
      .then((features) => {
        if (cancelled) return;
        const presetMap = new Map(getRegionsByScope(scope).map((item) => [item.name, item.cities]));
        const options = features.map((f) => ({
          id: f.name,
          name: f.name,
          cities: presetMap.get(f.name) ?? [],
        }));
        setRegionOptions(options);
      })
      .catch(() => {
        if (cancelled) return;
        setRegionOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const currentMarkers = useMemo(
    () => store.markers.filter((item) => item.scope === scope),
    [scope, store.markers],
  );

  const selectedRegion = useMemo<RegionOption | undefined>(
    () => regionOptions.find((item) => item.id === selectedRegionId),
    [regionOptions, selectedRegionId],
  );

  const detailMarker = useMemo(
    () => store.markers.find((item) => item.id === detailMarkerId) ?? null,
    [detailMarkerId, store.markers],
  );

  useEffect(() => {
    let cancelled = false;

    loadPersistedStore()
      .then((nextStore) => {
        if (cancelled) return;
        setStore(nextStore);
        setStoreReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setStore(createDefaultStore());
        setStoreReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storeReady) {
      return;
    }

    void persistStore(store);
  }, [store, storeReady]);

  useEffect(() => {
    if (!selectedRegionId || regionOptions.some((item) => item.id === selectedRegionId)) {
      return;
    }

    setSelectedRegionId('');
    setMarkerModalOpen(false);
  }, [regionOptions, selectedRegionId]);

  useEffect(() => {
    if (!markerModalOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMarkerModalOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeydown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [markerModalOpen]);

  const activeUser = store.users.find((item) => item.id === store.activeUserId) ?? store.users[0];

  const handleCreateUser = ({ name, color }: { name: string; color: string }) => {
    const nextUser = createUser(name, color);
    setStore((current) => ({
      ...current,
      users: [...current.users, nextUser],
      activeUserId: nextUser.id,
    }));
    setMessage(`已新增用户 ${name}，现在可以使用该用户记录旅行。`);
  };

  const handleSubmitMarker = async (value: MarkerFormValue) => {
    if (!activeUser) {
      return;
    }

    setSaving(true);
    try {
      const nextMarker = createMarker({
        ...value,
        userId: activeUser.id,
      });

      setStore((current) => ({
        ...current,
        markers: [nextMarker, ...current.markers],
      }));
      setSelectedRegionId(value.scopeId);
      setMarkerModalOpen(false);
      setMessage(`已保存 ${activeUser.name} 在 ${value.scopeName} · ${value.city} 的旅行记录。`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMarker = (markerId: string) => {
    const target = store.markers.find((item) => item.id === markerId);
    if (!target || target.userId !== store.activeUserId) {
      return;
    }

    setStore((current) => ({
      ...current,
      markers: current.markers.filter((item) => item.id !== markerId),
    }));
    if (detailMarkerId === markerId) {
      setDetailMarkerId(null);
    }
    setMessage(`已删除 ${target.scopeName} · ${target.city} 的旅行记录。`);
  };

  const handleUpdateMarker = async (
    markerId: string,
    updates: { note: string; imageUrls?: string[] },
  ) => {
    const target = store.markers.find((item) => item.id === markerId);
    if (!target || target.userId !== store.activeUserId) {
      return;
    }

    setStore((current) => ({
      ...current,
      markers: current.markers.map((item) =>
        item.id === markerId
          ? {
              ...item,
              note: updates.note,
              imageUrls: updates.imageUrls,
            }
          : item,
      ),
    }));
    setMessage(`已更新 ${target.scopeName} · ${target.city} 的旅行记录。`);
  };

  const openGuideSearch = (query: string, nextScope: Scope | 'all') => {
    setGuideSearchQuery(query);
    setGuideSearchScope(nextScope);
    setGuideSearchOpen(true);
  };

  return (
    <div className="app-shell">
      <header className="hero card">
        <svg className="hero-map-watermark" viewBox="0 0 640 260" fill="none" aria-hidden="true">
          <path
            d="M44 146c22-21 54-35 90-34 26 0 44 18 72 21 30 3 52-11 79-27 27-17 60-22 92-18 26 4 43 22 69 28 31 8 60-2 107-37"
            stroke="rgba(37,99,235,0.12)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M104 86c22-16 50-24 74-17 19 6 31 23 56 24 23 1 38-12 62-21 31-12 65-9 92 7 20 12 34 30 61 36"
            stroke="rgba(20,184,166,0.12)"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M356 168c18-13 40-17 61-13 16 3 28 15 45 17 20 2 33-7 49-17 18-12 41-15 66-8"
            stroke="rgba(249,115,22,0.11)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M182 184c23-9 47-3 66 8 14 8 28 18 46 18 20 0 35-13 55-23 22-11 48-14 72-6"
            stroke="rgba(37,99,235,0.08)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="hero-illustration" aria-hidden="true">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <span className="hero-route-dot hero-route-dot-one">✦</span>
          <span className="hero-route-dot hero-route-dot-two">●</span>
          <span className="hero-route-dot hero-route-dot-three">●</span>
          <span className="hero-route-dot hero-route-dot-four">✦</span>
          <svg className="hero-route-line" viewBox="0 0 360 220" fill="none">
            <path
              className="hero-route-path-glow"
              d="M22 148C56 134 80 66 128 72C176 78 176 168 230 164C276 160 292 116 338 72"
              stroke="url(#heroRouteGlow)"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.28"
            />
            <path
              className="hero-route-path"
              d="M22 148C56 134 80 66 128 72C176 78 176 168 230 164C276 160 292 116 338 72"
              stroke="url(#heroRoute)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="8 10"
            />
            <defs>
              <linearGradient id="heroRoute" x1="22" y1="148" x2="338" y2="72" gradientUnits="userSpaceOnUse">
                <stop stopColor="#14B8A6" />
                <stop offset="0.55" stopColor="#2563EB" />
                <stop offset="1" stopColor="#F97316" />
              </linearGradient>
              <linearGradient id="heroRouteGlow" x1="22" y1="148" x2="338" y2="72" gradientUnits="userSpaceOnUse">
                <stop stopColor="#67E8F9" />
                <stop offset="0.55" stopColor="#60A5FA" />
                <stop offset="1" stopColor="#FDBA74" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="hero-copy">
          <span className="hero-kicker">Voyage Atlas</span>
          <h1>旅迹地图</h1>
          <p>
            把每一次出发都留在地图上，记录城市、时间、照片与旅途印象，慢慢积累属于你的个人旅行档案。
          </p>
          <div className="hero-highlight-row">
            <span className="hero-highlight-chip">
              <span className="travel-icon-badge travel-icon-badge-blue">
                <TravelIcon name="route" size={14} />
              </span>
              地图足迹
            </span>
            <span className="hero-highlight-chip">
              <span className="travel-icon-badge travel-icon-badge-orange">
                <TravelIcon name="camera" size={14} />
              </span>
              旅行相册
            </span>
            <span className="hero-highlight-chip">
              <span className="travel-icon-badge travel-icon-badge-teal">
                <TravelIcon name="users" size={14} />
              </span>
              多人同行
            </span>
          </div>
        </div>
        <div className="hero-actions">
          <div className="hero-tip-card">
            <span className="hero-tip-eyebrow">旅行提示</span>
            <strong className="hero-tip-title">
              <span className="travel-icon-inline">
                <TravelIcon name="spark" size={16} />
              </span>
              从一条路线，串起你的所有目的地
            </strong>
            <p className="hero-tip-text">{message}</p>
          </div>
          <button
            type="button"
            className="primary-button hero-guide-button"
            onClick={() => openGuideSearch('', 'all')}
          >
            <span className="travel-icon-inline hero-guide-button-icon">
              <TravelIcon name="globe" size={16} />
            </span>
            搜索旅游攻略
          </button>
        </div>
      </header>

      <StatsPanel scope={scope} markers={currentMarkers} users={store.users} />

      <section className="content-grid">
        <div className="stack gap-20">
          <TravelMap
            scope={scope}
            regions={regionOptions}
            markers={currentMarkers}
            users={store.users}
            activeUserId={store.activeUserId}
            selectedRegionId={selectedRegionId}
            onScopeChange={(nextScope) => {
              setScope(nextScope);
              setMarkerModalOpen(false);
            }}
            onSelectRegion={(region) => {
              setSelectedRegionId(region.id);
              setMarkerModalOpen(true);
              setMessage(`已选择 ${region.name}，请在弹窗中完成城市和描述填写。`);
            }}
          />
          <MarkerList
            scope={scope}
            markers={currentMarkers}
            users={store.users}
            activeUserId={store.activeUserId}
            onDelete={handleDeleteMarker}
            onViewDetail={setDetailMarkerId}
          />
        </div>

        <aside className="sidebar stack gap-20">
          <UserManager
            users={store.users}
            activeUserId={store.activeUserId}
            onSwitch={(userId) => {
              setStore((current) => ({ ...current, activeUserId: userId }));
              const user = store.users.find((item) => item.id === userId);
              if (user) {
                setMessage(`当前记录用户已切换为 ${user.name}。`);
              }
            }}
            onCreate={handleCreateUser}
          />
          <DataSync 
            store={store} 
            onRestore={(restoredStore) => {
              setStore(restoredStore);
              setMessage('数据导入成功，已按 ID 合并现有数据。');
            }} 
          />
        </aside>
      </section>

      {markerModalOpen ? (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!saving) {
              setMarkerModalOpen(false);
            }
          }}
        >
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">添加旅行标记</h3>
                <p className="modal-subtitle">已自动带入当前地图选择的国家或省份，可继续补充城市与游玩描述。</p>
              </div>
              <button
                type="button"
                className="modal-close-button"
                aria-label="关闭弹窗"
                onClick={() => {
                  if (!saving) {
                    setMarkerModalOpen(false);
                  }
                }}
              >
                ×
              </button>
            </div>

            <MarkerForm
              key={`${scope}-${selectedRegionId || 'empty'}-${markerModalOpen ? 'open' : 'closed'}`}
              scope={scope}
              regions={regionOptions}
              initialValue={
                selectedRegion
                  ? {
                      scopeId: selectedRegion.id,
                      scopeName: selectedRegion.name,
                    }
                  : undefined
              }
              submitting={saving}
              submitText={activeUser ? `保存到 ${activeUser.name}` : '保存标记'}
              onCancel={() => setMarkerModalOpen(false)}
              onSubmit={handleSubmitMarker}
            />
          </div>
        </div>
      ) : null}

      <MarkerDetailPanel
        marker={detailMarker}
        user={detailMarker ? store.users.find((item) => item.id === detailMarker.userId) : undefined}
        open={detailMarker !== null}
        canEdit={detailMarker?.userId === store.activeUserId}
        onClose={() => setDetailMarkerId(null)}
        onUpdate={handleUpdateMarker}
        onOpenGuideSearch={(query, markerScope) => {
          setDetailMarkerId(null);
          openGuideSearch(query, markerScope);
        }}
      />
      <GuideSearchPanel
        open={guideSearchOpen}
        initialQuery={guideSearchQuery}
        initialScope={guideSearchScope}
        onClose={() => setGuideSearchOpen(false)}
      />
    </div>
  );
}

export default App;
