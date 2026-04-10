import { defaultUsers } from '../data/regions';
import type { TravelStore, UserProfile, VisitMarker } from '../types';

const STORAGE_KEY = 'personal-travel-diary-store';

function createDefaultStore(): TravelStore {
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

export function loadStore(): TravelStore {
  if (typeof window === 'undefined') {
    return createDefaultStore();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createDefaultStore();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TravelStore>;
    const users = Array.isArray(parsed.users) && parsed.users.length > 0
      ? parsed.users
      : defaultUsers;
    const markers = Array.isArray(parsed.markers)
      ? parsed.markers
          .map((item) =>
            normalizeMarker(item as Partial<VisitMarker> & { visitedAt?: string; imageUrl?: string }),
          )
          .filter((item): item is VisitMarker => item !== null)
      : [];
    const activeUserId = typeof parsed.activeUserId === 'string' && users.some((item) => item.id === parsed.activeUserId)
      ? parsed.activeUserId
      : users[0].id;

    return { users, markers, activeUserId };
  } catch {
    return createDefaultStore();
  }
}

export function saveStore(store: TravelStore) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
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
