export type Scope = 'domestic' | 'international';

export interface UserProfile {
  id: string;
  name: string;
  color: string;
}

export interface VisitMarker {
  id: string;
  userId: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note: string;
  imageUrls?: string[];
  visitedStartAt: string;
  visitedEndAt: string;
  createdAt: string;
}

export interface RegionOption {
  id: string;
  name: string;
  cities: string[];
}

export interface MapRegion extends RegionOption {
  x: number;
  y: number;
  width: number;
  height: number;
  continent?: string;
}

export interface TravelStore {
  users: UserProfile[];
  markers: VisitMarker[];
  activeUserId: string;
}
