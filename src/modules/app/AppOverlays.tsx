import DataSync from '../../components/DataSync';
import GuideSearchPanel from '../../components/GuideSearchPanel';
import MarkerDetailPanel from '../../components/MarkerDetailPanel';
import MarkerForm, { type MarkerFormValue } from '../../components/MarkerForm';
import type {
  GuideSearchResult,
  RegionOption,
  SavedGuide,
  Scope,
  TravelStore,
  UserProfile,
  VisitMarker,
} from '../../types';

interface AppOverlaysProps {
  markerModalOpen: boolean;
  saving: boolean;
  closeMarkerModal: () => void;
  scope: Scope;
  selectedRegionId: string;
  regions: RegionOption[];
  selectedRegion?: RegionOption;
  activeUser?: UserProfile;
  onSubmitMarker: (value: MarkerFormValue) => Promise<void>;
  dataSyncOpen: boolean;
  closeDataSync: () => void;
  store: TravelStore;
  onRestoreStore: (store: TravelStore) => void;
  detailMarker: VisitMarker | null;
  detailUser?: UserProfile;
  detailMarkerGuides: SavedGuide[];
  closeDetail: () => void;
  onUpdateMarker: (markerId: string, updates: { note: string; imageUrls?: string[] }) => Promise<void> | void;
  onRemoveSavedGuide: (savedGuideId: string) => void;
  onOpenGuideSearchFromDetail: (query: string, scope: Scope, markerId?: string | null) => void;
  guideSearchOpen: boolean;
  guideSearchQuery: string;
  guideSearchScope: Scope | 'all';
  guideSearchMarkerId: string | null;
  savedGuides: SavedGuide[];
  activeUserId: string;
  closeGuideSearch: () => void;
  onSaveGuide: (guide: GuideSearchResult, keyword: string) => void;
  onAttachGuideToMarker: (guide: GuideSearchResult, keyword: string, markerId: string) => void;
}

export default function AppOverlays({
  markerModalOpen,
  saving,
  closeMarkerModal,
  scope,
  selectedRegionId,
  regions,
  selectedRegion,
  activeUser,
  onSubmitMarker,
  dataSyncOpen,
  closeDataSync,
  store,
  onRestoreStore,
  detailMarker,
  detailUser,
  detailMarkerGuides,
  closeDetail,
  onUpdateMarker,
  onRemoveSavedGuide,
  onOpenGuideSearchFromDetail,
  guideSearchOpen,
  guideSearchQuery,
  guideSearchScope,
  guideSearchMarkerId,
  savedGuides,
  activeUserId,
  closeGuideSearch,
  onSaveGuide,
  onAttachGuideToMarker,
}: AppOverlaysProps) {
  return (
    <>
      {markerModalOpen ? (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!saving) {
              closeMarkerModal();
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
                    closeMarkerModal();
                  }
                }}
              >
                ×
              </button>
            </div>

            <MarkerForm
              key={`${scope}-${selectedRegionId || 'empty'}-${markerModalOpen ? 'open' : 'closed'}`}
              scope={scope}
              regions={regions}
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
              onCancel={closeMarkerModal}
              onSubmit={onSubmitMarker}
            />
          </div>
        </div>
      ) : null}

      {dataSyncOpen ? (
        <div className="modal-backdrop" onClick={closeDataSync}>
          <div className="modal-panel data-sync-modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">数据备份与恢复</h3>
                <p className="modal-subtitle">导出本地数据快照，或从备份文件按 ID 合并恢复。</p>
              </div>
              <button
                type="button"
                className="modal-close-button"
                aria-label="关闭数据备份弹窗"
                onClick={closeDataSync}
              >
                ×
              </button>
            </div>
            <DataSync store={store} onRestore={onRestoreStore} variant="dialog" />
          </div>
        </div>
      ) : null}

      <MarkerDetailPanel
        marker={detailMarker}
        user={detailUser}
        relatedGuides={detailMarkerGuides}
        open={detailMarker !== null}
        canEdit={detailMarker?.userId === activeUserId}
        onClose={closeDetail}
        onUpdate={onUpdateMarker}
        onRemoveRelatedGuide={onRemoveSavedGuide}
        onOpenGuideSearch={(query, markerScope) => {
          onOpenGuideSearchFromDetail(query, markerScope, detailMarker?.id ?? null);
        }}
      />
      <GuideSearchPanel
        open={guideSearchOpen}
        initialQuery={guideSearchQuery}
        initialScope={guideSearchScope}
        activeUserId={activeUserId}
        linkedMarkerId={guideSearchMarkerId}
        savedGuides={savedGuides}
        onClose={closeGuideSearch}
        onSaveGuide={onSaveGuide}
        onAttachGuideToMarker={onAttachGuideToMarker}
        onRemoveSavedGuide={onRemoveSavedGuide}
      />
    </>
  );
}
