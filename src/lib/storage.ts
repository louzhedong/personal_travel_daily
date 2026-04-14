import { defaultUsers } from '../data/regions';
import {
  loadTravelStoreSnapshot,
  saveTravelStoreSnapshot,
  supportsIndexedDb,
  type TravelStoreSnapshot,
} from './repositories/travelStoreRepository';
import type { TravelStore, UserProfile, VisitMarker } from '../types';

const LEGACY_STORAGE_KEY = 'personal-travel-diary-store';

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

function normalizeStore(
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
