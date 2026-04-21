import type { Dispatch, SetStateAction } from 'react';
import { createSavedGuide } from '../../lib/storage';
import type { GuideSearchResult, SavedGuide, TravelStore } from '../../types';

function normalizeSourceUrl(sourceUrl: string) {
  return sourceUrl.trim().toLowerCase();
}

export function findSavedGuide(
  savedGuides: SavedGuide[],
  savedByUserId: string,
  sourceUrl: string,
  markerId?: string,
) {
  const normalizedSourceUrl = normalizeSourceUrl(sourceUrl);

  return savedGuides.find(
    (item) =>
      item.savedByUserId === savedByUserId &&
      item.markerId === markerId &&
      normalizeSourceUrl(item.result.sourceUrl) === normalizedSourceUrl,
  );
}

export function saveGuideToStore(
  setStore: Dispatch<SetStateAction<TravelStore>>,
  guide: GuideSearchResult,
  keyword: string,
) {
  let nextSavedGuide: SavedGuide | null = null;
  let alreadySaved = false;

  setStore((current) => {
    const existingGuide = findSavedGuide(current.savedGuides, current.activeUserId, guide.sourceUrl);
    if (existingGuide) {
      alreadySaved = true;
      return current;
    }

    nextSavedGuide = createSavedGuide({
      savedByUserId: current.activeUserId,
      keyword,
      result: guide,
    });

    return {
      ...current,
      savedGuides: [nextSavedGuide, ...current.savedGuides],
    };
  });

  return {
    alreadySaved,
    nextSavedGuide,
  };
}

export function attachGuideToMarkerInStore(
  store: TravelStore,
  setStore: Dispatch<SetStateAction<TravelStore>>,
  guide: GuideSearchResult,
  keyword: string,
  markerId: string,
) {
  const targetMarker = store.markers.find((item) => item.id === markerId);
  if (!targetMarker) {
    return {
      targetMarker: null,
      alreadyAttached: false,
      nextSavedGuide: null,
    };
  }

  let nextSavedGuide: SavedGuide | null = null;
  let alreadyAttached = false;

  setStore((current) => {
    const existingGuide = findSavedGuide(current.savedGuides, current.activeUserId, guide.sourceUrl, markerId);
    if (existingGuide) {
      alreadyAttached = true;
      return current;
    }

    nextSavedGuide = createSavedGuide({
      savedByUserId: current.activeUserId,
      markerId,
      keyword,
      result: guide,
    });

    return {
      ...current,
      savedGuides: [nextSavedGuide, ...current.savedGuides],
    };
  });

  return {
    targetMarker,
    alreadyAttached,
    nextSavedGuide,
  };
}

export function removeSavedGuideFromStore(
  store: TravelStore,
  setStore: Dispatch<SetStateAction<TravelStore>>,
  savedGuideId: string,
) {
  const targetGuide = store.savedGuides.find((item) => item.id === savedGuideId);
  if (!targetGuide) {
    return null;
  }

  setStore((current) => ({
    ...current,
    savedGuides: current.savedGuides.filter((item) => item.id !== savedGuideId),
  }));

  return targetGuide;
}
