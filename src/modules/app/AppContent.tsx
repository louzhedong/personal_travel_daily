import MarkerList from '../../components/MarkerList';
import SavedGuidesPanel from '../../components/SavedGuidesPanel';
import TravelMap from '../../components/TravelMap';
import TripTimelinePanel from '../../components/TripTimelinePanel';
import UserManager from '../../components/UserManager';
import WishlistPanel from '../../components/WishlistPanel';
import type { MarkerSearchResponseDto, SearchMarkersQuery } from '../../lib/api/types';
import type { UpdateWishlistItemInput } from '../../lib/api/types';
import type { RegionOption, SavedGuide, Scope, TripCollection, UserProfile, VisitMarker, WishlistItem } from '../../types';

interface AppContentProps {
  scope: Scope;
  regions: RegionOption[];
  currentMarkers: VisitMarker[];
  mapMarkers: VisitMarker[];
  allMarkers: VisitMarker[];
  wishlistItems: WishlistItem[];
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
  onAddSelectedRegionToWishlist: () => void;
  onClearSelectedRegion: () => void;
  onRequestDeleteMarker: (markerId: string) => void;
  onViewMarkerDetail: (markerId: string) => void;
  onFocusSearchResult: (markerId: string) => void;
  onOpenDataSync: () => void;
  onSearchMarkers: (query: SearchMarkersQuery) => Promise<MarkerSearchResponseDto>;
  onSwitchUser: (userId: string) => void;
  onCreateUser: (payload: { name: string; color: string }) => void;
  onCreateTrip: (payload: { name: string; startsAt: string; endsAt: string; note?: string }) => void;
  onUpdateTrip: (
    tripId: string,
    payload: { name?: string; startsAt?: string; endsAt?: string; note?: string },
  ) => void;
  onDeleteTrip: (tripId: string) => void;
  onBulkAssignMarkersToTrip: (markerIds: string[], tripId?: string | null) => void;
  onOpenMarkerFromTimeline: (markerId: string) => void;
  onOpenTripDetail?: (tripId: string) => void;
  onOpenMarkerFromGuide: (markerId: string) => void;
  onRemoveSavedGuide: (savedGuideId: string) => void;
  onUpdateWishlistItem: (wishlistId: string, input: UpdateWishlistItemInput) => Promise<WishlistItem> | void;
  onConvertWishlistItemToTrip: (wishlistId: string) => Promise<void> | void;
  onDeleteWishlistItem: (wishlistId: string) => void;
}

export default function AppContent({
  scope,
  regions,
  currentMarkers,
  mapMarkers,
  allMarkers,
  wishlistItems,
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
  onAddSelectedRegionToWishlist,
  onClearSelectedRegion,
  onRequestDeleteMarker,
  onViewMarkerDetail,
  onFocusSearchResult,
  onOpenDataSync,
  onSearchMarkers,
  onSwitchUser,
  onCreateUser,
  onCreateTrip,
  onUpdateTrip,
  onDeleteTrip,
  onBulkAssignMarkersToTrip,
  onOpenMarkerFromTimeline,
  onOpenTripDetail,
  onOpenMarkerFromGuide,
  onRemoveSavedGuide,
  onUpdateWishlistItem,
  onConvertWishlistItemToTrip,
  onDeleteWishlistItem,
}: AppContentProps) {
  return (
    <section className="content-grid">
      <div className="stack gap-20">
        <TravelMap
          scope={scope}
          regions={regions}
          markers={mapMarkers}
          allMarkers={allMarkers}
          wishlistItems={wishlistItems}
          users={users}
          activeUserId={activeUserId}
          selectedRegionId={selectedRegionId}
          selectedRegionName={selectedRegionName}
          onScopeChange={onScopeChange}
          onSelectRegion={onSelectRegion}
          onOpenSelectedRegionComposer={onOpenSelectedRegionComposer}
          onAddSelectedRegionToWishlist={onAddSelectedRegionToWishlist}
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
          onOpenTripDetail={onOpenTripDetail}
          onCreateTrip={onCreateTrip}
          onUpdateTrip={onUpdateTrip}
          onDeleteTrip={onDeleteTrip}
          onBulkAssignMarkersToTrip={onBulkAssignMarkersToTrip}
        />
        <WishlistPanel
          items={wishlistItems}
          users={users}
          activeUserId={activeUserId}
          onUpdate={onUpdateWishlistItem}
          onConvertToTrip={onConvertWishlistItemToTrip}
          onDelete={onDeleteWishlistItem}
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
