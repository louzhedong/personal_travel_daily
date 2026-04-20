import { defaultUsers } from '../data/regions';
import {
  loadTravelStoreSnapshot,
  saveTravelStoreSnapshot,
  supportsIndexedDb,
  type TravelStoreSnapshot,
} from './repositories/travelStoreRepository';
import type { Scope, TravelStore, UserProfile, VisitMarker } from '../types';

const LEGACY_STORAGE_KEY = 'personal-travel-diary-store';

interface NormalizedImportedStore {
  users: UserProfile[];
  markers: VisitMarker[];
  activeUserId: string | null;
}

export interface TravelStoreMergeStats {
  usersAdded: number;
  usersUpdated: number;
  markersAdded: number;
  markersUpdated: number;
  markersSkippedInvalidUser: number;
}

export interface TravelStoreImportPreviewUserItem extends UserProfile {
  action: 'add' | 'update';
}

export interface TravelStoreImportPreviewMarkerItem {
  action: 'add' | 'update' | 'skip';
  id: string;
  userId: string;
  userName: string | null;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note: string;
  visitedStartAt: string;
  visitedEndAt: string;
  createdAt: string;
  reason?: string;
}

export interface TravelStoreImportPreview {
  mergedStore: TravelStore;
  stats: TravelStoreMergeStats;
  users: TravelStoreImportPreviewUserItem[];
  markers: TravelStoreImportPreviewMarkerItem[];
}

export function createDefaultStore(): TravelStore {
  return {
    users: defaultUsers,
    markers: [],
    activeUserId: defaultUsers[0].id,
  };
}

function normalizeMarker(
  rawMarker: Partial<VisitMarker> & { visitedAt?: string; imageUrl?: string },
): VisitMarker | null {
  if (
    typeof rawMarker.id !== 'string' ||
    typeof rawMarker.userId !== 'string' ||
    typeof rawMarker.scope !== 'string' ||
    typeof rawMarker.scopeId !== 'string' ||
    typeof rawMarker.scopeName !== 'string' ||
    typeof rawMarker.city !== 'string' ||
    typeof rawMarker.note !== 'string' ||
    typeof rawMarker.createdAt !== 'string'
  ) {
    return null;
  }

  const visitedStartAt =
    typeof rawMarker.visitedStartAt === 'string'
      ? rawMarker.visitedStartAt
      : typeof rawMarker.visitedAt === 'string'
        ? rawMarker.visitedAt
        : '';
  const visitedEndAt =
    typeof rawMarker.visitedEndAt === 'string'
      ? rawMarker.visitedEndAt
      : visitedStartAt;

  if (!visitedStartAt || !visitedEndAt) {
    return null;
  }

  return {
    id: rawMarker.id,
    userId: rawMarker.userId,
    scope: rawMarker.scope,
    scopeId: rawMarker.scopeId,
    scopeName: rawMarker.scopeName,
    city: rawMarker.city,
    note: rawMarker.note,
    imageUrls:
      Array.isArray(rawMarker.imageUrls) && rawMarker.imageUrls.length > 0
        ? rawMarker.imageUrls.filter((item): item is string => typeof item === 'string' && !!item)
        : typeof rawMarker.imageUrl === 'string' && rawMarker.imageUrl
          ? [rawMarker.imageUrl]
          : undefined,
    visitedStartAt,
    visitedEndAt,
    createdAt: rawMarker.createdAt,
  };
}

function normalizeUsers(users: unknown): UserProfile[] {
  if (!Array.isArray(users) || users.length === 0) {
    return defaultUsers;
  }

  const normalizedUsers = users.filter(
    (item): item is UserProfile =>
      !!item &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.color === 'string',
  );

  return normalizedUsers.length > 0 ? normalizedUsers : defaultUsers;
}

function normalizeImportedUsers(users: unknown): UserProfile[] {
  if (!Array.isArray(users)) {
    return [];
  }

  return users.filter(
    (item): item is UserProfile =>
      !!item &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.color === 'string',
  );
}

export function isTravelStoreImportPayload(
  rawStore: unknown,
): rawStore is Partial<TravelStore> | TravelStoreSnapshot {
  if (!rawStore || typeof rawStore !== 'object' || Array.isArray(rawStore)) {
    return false;
  }

  const parsed = rawStore as Record<string, unknown>;
  const hasKnownKey = 'users' in parsed || 'markers' in parsed || 'activeUserId' in parsed;
  if (!hasKnownKey) {
    return false;
  }

  if ('users' in parsed && parsed.users !== undefined && !Array.isArray(parsed.users)) {
    return false;
  }

  if ('markers' in parsed && parsed.markers !== undefined && !Array.isArray(parsed.markers)) {
    return false;
  }

  if (
    'activeUserId' in parsed &&
    parsed.activeUserId !== undefined &&
    parsed.activeUserId !== null &&
    typeof parsed.activeUserId !== 'string'
  ) {
    return false;
  }

  return true;
}

export function normalizeImportedStore(
  rawStore: Partial<TravelStore> | TravelStoreSnapshot,
): NormalizedImportedStore {
  const normalizedUsers = normalizeImportedUsers(rawStore.users);
  const markers = Array.isArray(rawStore.markers)
    ? rawStore.markers
        .map((item) =>
          normalizeMarker(item as Partial<VisitMarker> & { visitedAt?: string; imageUrl?: string }),
        )
        .filter((item): item is VisitMarker => item !== null)
    : [];

  return {
    users: normalizedUsers,
    markers,
    activeUserId: typeof rawStore.activeUserId === 'string' ? rawStore.activeUserId : null,
  };
}

export function mergeTravelStoreById(
  currentStore: TravelStore,
  importedStore: NormalizedImportedStore,
): TravelStore {
  return mergeTravelStoreByIdWithStats(currentStore, importedStore).store;
}

function analyzeTravelStoreImport(
  currentStore: TravelStore,
  importedStore: NormalizedImportedStore,
): TravelStoreImportPreview {
  const stats: TravelStoreMergeStats = {
    usersAdded: 0,
    usersUpdated: 0,
    markersAdded: 0,
    markersUpdated: 0,
    markersSkippedInvalidUser: 0,
  };

  const userMap = new Map(currentStore.users.map((user) => [user.id, user]));
  const previewUsers: TravelStoreImportPreviewUserItem[] = importedStore.users.map((user) => {
    const action = userMap.has(user.id) ? 'update' : 'add';
    if (action === 'update') {
      stats.usersUpdated += 1;
    } else {
      stats.usersAdded += 1;
    }
    userMap.set(user.id, user);

    return { ...user, action };
  });
  const users = Array.from(userMap.values());

  const validUsers = new Map(users.map((user) => [user.id, user]));
  const markerMap = new Map(currentStore.markers.map((marker) => [marker.id, marker]));
  const previewMarkers: TravelStoreImportPreviewMarkerItem[] = importedStore.markers.map((marker) => {
    const relatedUser = validUsers.get(marker.userId);
    if (!relatedUser) {
      stats.markersSkippedInvalidUser += 1;
      return {
        ...marker,
        action: 'skip',
        userName: null,
        reason: '关联用户不存在',
      };
    }

    const action = markerMap.has(marker.id) ? 'update' : 'add';
    if (action === 'update') {
      stats.markersUpdated += 1;
    } else {
      stats.markersAdded += 1;
    }
    markerMap.set(marker.id, marker);

    return {
      ...marker,
      action,
      userName: relatedUser.name,
    };
  });
  const markers = Array.from(markerMap.values()).filter((marker) => validUsers.has(marker.userId));

  const activeUserId = validUsers.has(currentStore.activeUserId)
    ? currentStore.activeUserId
    : importedStore.activeUserId && validUsers.has(importedStore.activeUserId)
      ? importedStore.activeUserId
      : users[0]?.id ?? createDefaultStore().activeUserId;

  return {
    mergedStore: { users, markers, activeUserId },
    stats,
    users: previewUsers,
    markers: previewMarkers,
  };
}

export function createTravelStoreImportPreview(
  currentStore: TravelStore,
  importedStore: NormalizedImportedStore,
): TravelStoreImportPreview {
  return analyzeTravelStoreImport(currentStore, importedStore);
}

export function mergeTravelStoreByIdWithStats(
  currentStore: TravelStore,
  importedStore: NormalizedImportedStore,
): { store: TravelStore; stats: TravelStoreMergeStats } {
  const preview = analyzeTravelStoreImport(currentStore, importedStore);
  return { store: preview.mergedStore, stats: preview.stats };
}

export function normalizeStore(
  rawStore:
    | Partial<TravelStore>
    | TravelStoreSnapshot
    | null
    | undefined,
): TravelStore {
  try {
    const parsed = rawStore ?? {};
    const normalizedUsers = normalizeUsers(parsed.users);
    const markers = Array.isArray(parsed.markers)
      ? parsed.markers
          .map((item) =>
            normalizeMarker(item as Partial<VisitMarker> & { visitedAt?: string; imageUrl?: string }),
          )
          .filter((item): item is VisitMarker => item !== null)
      : [];
    const activeUserId =
      typeof parsed.activeUserId === 'string' && normalizedUsers.some((item) => item.id === parsed.activeUserId)
        ? parsed.activeUserId
        : normalizedUsers[0].id;

    return { users: normalizedUsers, markers, activeUserId };
  } catch {
    return createDefaultStore();
  }
}

function readLegacyLocalStorage(): TravelStore | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeStore(JSON.parse(raw) as Partial<TravelStore>);
  } catch {
    return null;
  }
}

export async function loadPersistedStore(): Promise<TravelStore> {
  if (typeof window === 'undefined') {
    return createDefaultStore();
  }

  if (!supportsIndexedDb()) {
    return readLegacyLocalStorage() ?? createDefaultStore();
  }

  try {
    const savedSnapshot = await loadTravelStoreSnapshot();
    if (savedSnapshot) {
      return normalizeStore(savedSnapshot);
    }

    const migratedStore = readLegacyLocalStorage();
    const nextStore = migratedStore ?? createDefaultStore();
    await saveTravelStoreSnapshot(nextStore);
    return nextStore;
  } catch {
    return readLegacyLocalStorage() ?? createDefaultStore();
  }
}

export async function persistStore(store: TravelStore) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!supportsIndexedDb()) {
    window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(store));
    return;
  }

  try {
    await saveTravelStoreSnapshot(store);
  } catch {
    window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(store));
  }
}

export function createUser(name: string, color: string): UserProfile {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    color,
  };
}

export function createMarker(marker: Omit<VisitMarker, 'id' | 'createdAt'>): VisitMarker {
  return {
    ...marker,
    id: `marker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
}
