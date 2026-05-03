import { describe, expect, it, vi } from 'vitest';
import type { SetStateAction } from 'react';
import type { TravelStore } from '../../../types';

const { createSavedGuideMock } = vi.hoisted(() => ({
  createSavedGuideMock: vi.fn(),
}));

vi.mock('../../../lib/storage', () => ({
  createSavedGuide: createSavedGuideMock,
}));

import {
  attachGuideToMarkerInStore,
  findSavedGuide,
  removeSavedGuideFromStore,
  saveGuideToStore,
} from '../guideActions';

const guide = {
  id: 'guide-1',
  title: '京都慢游',
  summary: '适合第一次去京都的三天路线',
  sourceName: 'Mock Guide',
  sourceUrl: ' HTTPS://EXAMPLE.COM/GUIDE/KYOTO ',
};

const baseStore: TravelStore = {
  users: [{ id: 'u1', name: '小悠', color: '#2563eb' }],
  activeUserId: 'u1',
  trips: [],
  markers: [
    {
      id: 'marker-1',
      userId: 'u1',
      scope: 'international',
      scopeId: 'japan',
      scopeName: '日本',
      city: '京都',
      note: '鸭川散步',
      visitedStartAt: '2026-04-01',
      visitedEndAt: '2026-04-01',
      createdAt: '2026-04-01T00:00:00.000Z',
    },
  ],
  savedGuides: [],
  guideSearchHistory: [],
};

function createStoreSetter(currentStore: TravelStore) {
  return vi.fn((value: SetStateAction<TravelStore>) =>
    typeof value === 'function' ? value(currentStore) : value,
  );
}

describe('guideActions store helpers', () => {
  it('finds saved guides with normalized sourceUrl and marker identity', () => {
    const savedGuides = [
      {
        id: 'saved-1',
        savedByUserId: 'u1',
        markerId: 'marker-1',
        keyword: '京都',
        savedAt: '2026-04-01T00:00:00.000Z',
        result: {
          ...guide,
          sourceUrl: 'https://example.com/guide/kyoto',
        },
      },
    ];

    expect(findSavedGuide(savedGuides, 'u1', ' https://EXAMPLE.com/guide/kyoto ', 'marker-1')).toEqual(savedGuides[0]);
    expect(findSavedGuide(savedGuides, 'u1', 'https://example.com/guide/kyoto')).toBeUndefined();
  });

  it('saves a new guide to store and skips duplicates', () => {
    createSavedGuideMock.mockReset();
    createSavedGuideMock.mockReturnValue({
      id: 'saved-new',
      savedByUserId: 'u1',
      keyword: '京都',
      result: { ...guide, sourceUrl: 'https://example.com/guide/kyoto' },
      savedAt: '2026-04-01T00:00:00.000Z',
    });

    const setStore = createStoreSetter(baseStore);
    const result = saveGuideToStore(
      setStore,
      { ...guide, sourceUrl: 'https://example.com/guide/kyoto' },
      '京都',
    );

    expect(createSavedGuideMock).toHaveBeenCalledWith({
      savedByUserId: 'u1',
      keyword: '京都',
      result: { ...guide, sourceUrl: 'https://example.com/guide/kyoto' },
    });
    expect(result).toEqual({
      alreadySaved: false,
      nextSavedGuide: {
        id: 'saved-new',
        savedByUserId: 'u1',
        keyword: '京都',
        result: { ...guide, sourceUrl: 'https://example.com/guide/kyoto' },
        savedAt: '2026-04-01T00:00:00.000Z',
      },
    });

    const duplicateStore: TravelStore = {
      ...baseStore,
      savedGuides: [result.nextSavedGuide!],
    };
    const duplicateSetStore = createStoreSetter(duplicateStore);
    const duplicate = saveGuideToStore(
      duplicateSetStore,
      { ...guide, sourceUrl: 'https://example.com/guide/kyoto' },
      '京都',
    );

    expect(duplicate.alreadySaved).toBe(true);
    expect(duplicate.nextSavedGuide).toBeNull();
  });

  it('attaches a guide to marker, handles missing markers, and skips duplicates', () => {
    createSavedGuideMock.mockReset();
    createSavedGuideMock.mockReturnValue({
      id: 'saved-link',
      savedByUserId: 'u1',
      markerId: 'marker-1',
      keyword: '京都',
      result: { ...guide, sourceUrl: 'https://example.com/guide/kyoto' },
      savedAt: '2026-04-01T00:00:00.000Z',
    });

    const setStore = createStoreSetter(baseStore);
    const attached = attachGuideToMarkerInStore(
      baseStore,
      setStore,
      { ...guide, sourceUrl: 'https://example.com/guide/kyoto' },
      '京都',
      'marker-1',
    );

    expect(attached.targetMarker).toEqual(baseStore.markers[0]);
    expect(attached.alreadyAttached).toBe(false);
    expect(attached.nextSavedGuide).toMatchObject({ id: 'saved-link' });

    const missing = attachGuideToMarkerInStore(
      baseStore,
      setStore,
      { ...guide, sourceUrl: 'https://example.com/guide/kyoto' },
      '京都',
      'missing',
    );
    expect(missing).toEqual({
      targetMarker: null,
      alreadyAttached: false,
      nextSavedGuide: null,
    });

    const duplicateStore: TravelStore = {
      ...baseStore,
      savedGuides: [attached.nextSavedGuide!],
    };
    const duplicateSetStore = createStoreSetter(duplicateStore);
    const duplicate = attachGuideToMarkerInStore(
      duplicateStore,
      duplicateSetStore,
      { ...guide, sourceUrl: 'https://example.com/guide/kyoto' },
      '京都',
      'marker-1',
    );
    expect(duplicate.alreadyAttached).toBe(true);
    expect(duplicate.nextSavedGuide).toBeNull();
  });

  it('removes saved guides from store and returns null when target is missing', () => {
    const store: TravelStore = {
      ...baseStore,
      savedGuides: [
        {
          id: 'saved-1',
          savedByUserId: 'u1',
          keyword: '京都',
          savedAt: '2026-04-01T00:00:00.000Z',
          result: { ...guide, sourceUrl: 'https://example.com/guide/kyoto' },
        },
      ],
    };
    const setStore = createStoreSetter(store);

    expect(removeSavedGuideFromStore(store, setStore, 'saved-1')).toEqual(store.savedGuides[0]);
    expect(removeSavedGuideFromStore(store, setStore, 'missing')).toBeNull();
  });
});
