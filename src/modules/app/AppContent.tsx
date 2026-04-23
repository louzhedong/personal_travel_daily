import MarkerList from '../../components/MarkerList';
import SavedGuidesPanel from '../../components/SavedGuidesPanel';
import TravelMap from '../../components/TravelMap';
import TripTimelinePanel from '../../components/TripTimelinePanel';
import UserManager from '../../components/UserManager';
import type { RegionOption, SavedGuide, Scope, UserProfile, VisitMarker } from '../../types';

interface AppContentProps {
  scope: Scope;
  regions: RegionOption[];
  currentMarkers: VisitMarker[];
  allMarkers: VisitMarker[];
  users: UserProfile[];
  activeUserId: string;
  activeUserName?: string;
  selectedRegionId: string;
  savedGuides: SavedGuide[];
  onScopeChange: (scope: Scope) => void;
  onSelectRegion: (region: RegionOption) => void;
  onRequestDeleteMarker: (markerId: string) => void;
  onViewMarkerDetail: (markerId: string) => void;
  onOpenDataSync: () => void;
  onSwitchUser: (userId: string) => void;
  onCreateUser: (payload: { name: string; color: string }) => void;
  onOpenMarkerFromTimeline: (markerId: string) => void;
  onOpenMarkerFromGuide: (markerId: string) => void;
  onRemoveSavedGuide: (savedGuideId: string) => void;
}

export default function AppContent({
  scope,
  regions,
  currentMarkers,
  allMarkers,
  users,
  activeUserId,
  activeUserName,
  selectedRegionId,
  savedGuides,
  onScopeChange,
  onSelectRegion,
  onRequestDeleteMarker,
  onViewMarkerDetail,
  onOpenDataSync,
  onSwitchUser,
  onCreateUser,
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
          markers={currentMarkers}
          users={users}
          activeUserId={activeUserId}
          selectedRegionId={selectedRegionId}
          onScopeChange={onScopeChange}
          onSelectRegion={onSelectRegion}
        />
        <MarkerList
          scope={scope}
          markers={currentMarkers}
          users={users}
          activeUserId={activeUserId}
          onDelete={onRequestDeleteMarker}
          onViewDetail={onViewMarkerDetail}
          onOpenDataSync={onOpenDataSync}
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
          activeUserId={activeUserId}
          activeUserName={activeUserName}
          onOpenMarkerDetail={onOpenMarkerFromTimeline}
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
