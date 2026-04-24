import MarkerList from '../../components/MarkerList';
import SavedGuidesPanel from '../../components/SavedGuidesPanel';
import TravelMap from '../../components/TravelMap';
import TripTimelinePanel from '../../components/TripTimelinePanel';
import UserManager from '../../components/UserManager';
import type { MarkerSearchResponseDto, SearchMarkersQuery } from '../../lib/api/types';
import type { RegionOption, SavedGuide, Scope, TripCollection, UserProfile, VisitMarker } from '../../types';

interface AppContentProps {
  scope: Scope;
  regions: RegionOption[];
  currentMarkers: VisitMarker[];
  mapMarkers: VisitMarker[];
  allMarkers: VisitMarker[];
  trips: TripCollection[];
  users: UserProfile[];
  activeUserId: string;
  activeUserName?: string;
  selectedRegionId: string;
  selectedRegionName?: string;
  savedGuides: SavedGuide[];
  onScopeChange: (scope: Scope) => void;
  onSelectRegion: (region: RegionOption) => void;
  onOpenSelectedRegionComposer: () => void;
  onClearSelectedRegion: () => void;
  onRequestDeleteMarker: (markerId: string) => void;
  onViewMarkerDetail: (markerId: string) => void;
  onFocusSearchResult: (markerId: string) => void;
  onOpenDataSync: () => void;
  onSearchMarkers: (query: SearchMarkersQuery) => Promise<MarkerSearchResponseDto>;
  onSwitchUser: (userId: string) => void;
  onCreateUser: (payload: { name: string; color: string }) => void;
  onCreateTrip: (payload: { name: string; startsAt: string; endsAt: string; note?: string }) => void;
  onOpenMarkerFromTimeline: (markerId: string) => void;
  onOpenMarkerFromGuide: (markerId: string) => void;
  onRemoveSavedGuide: (savedGuideId: string) => void;
}

export default function AppContent({
  scope,
  regions,
  currentMarkers,
  mapMarkers,
  allMarkers,
  trips,
  users,
  activeUserId,
  activeUserName,
  selectedRegionId,
  selectedRegionName,
  savedGuides,
  onScopeChange,
  onSelectRegion,
  onOpenSelectedRegionComposer,
  onClearSelectedRegion,
  onRequestDeleteMarker,
  onViewMarkerDetail,
  onFocusSearchResult,
  onOpenDataSync,
  onSearchMarkers,
  onSwitchUser,
  onCreateUser,
  onCreateTrip,
  onOpenMarkerFromTimeline,
  onOpenMarkerFromGuide,
  onRemoveSavedGuide,
}: AppContentProps) {
  return (
    <section className="content-grid">
      <div className="stack gap-20">
        <TravelMap
          scope={scope}
          regions={regions}
          markers={mapMarkers}
          allMarkers={allMarkers}
          users={users}
          activeUserId={activeUserId}
          selectedRegionId={selectedRegionId}
          selectedRegionName={selectedRegionName}
          onScopeChange={onScopeChange}
          onSelectRegion={onSelectRegion}
          onOpenSelectedRegionComposer={onOpenSelectedRegionComposer}
          onClearSelectedRegion={onClearSelectedRegion}
        />
        <MarkerList
          scope={scope}
          markers={currentMarkers}
          allMarkers={allMarkers}
          users={users}
          activeUserId={activeUserId}
          onDelete={onRequestDeleteMarker}
          onViewDetail={onViewMarkerDetail}
          onFocusSearchResult={onFocusSearchResult}
          onOpenDataSync={onOpenDataSync}
          onSearchMarkers={onSearchMarkers}
        />
      </div>

      <aside className="sidebar stack gap-20">
        <UserManager
          users={users}
          activeUserId={activeUserId}
          onSwitch={onSwitchUser}
          onCreate={onCreateUser}
        />
        <TripTimelinePanel
          markers={allMarkers}
          trips={trips}
          activeUserId={activeUserId}
          activeUserName={activeUserName}
          onOpenMarkerDetail={onOpenMarkerFromTimeline}
          onCreateTrip={onCreateTrip}
        />
        <SavedGuidesPanel
          savedGuides={savedGuides}
          activeUserId={activeUserId}
          users={users}
          markers={allMarkers}
          onOpenMarkerDetail={onOpenMarkerFromGuide}
          onRemoveSavedGuide={onRemoveSavedGuide}
        />
      </aside>
    </section>
  );
}
