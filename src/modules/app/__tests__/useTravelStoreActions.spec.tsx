import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTravelStoreActions } from '../useTravelStoreActions';
import type { TravelStore } from '../../../types';

const mocks = vi.hoisted(() => ({
  useCompanionActionsMock: vi.fn(),
  useTripActionsMock: vi.fn(),
  useMarkerActionsMock: vi.fn(),
  useGuideActionsMock: vi.fn(),
}));

vi.mock('../useCompanionActions', () => ({
  useCompanionActions: mocks.useCompanionActionsMock,
}));

vi.mock('../useTripActions', () => ({
  useTripActions: mocks.useTripActionsMock,
}));

vi.mock('../useMarkerActions', () => ({
  useMarkerActions: mocks.useMarkerActionsMock,
}));

vi.mock('../useGuideActions', () => ({
  useGuideActions: mocks.useGuideActionsMock,
}));

const store: TravelStore = {
  users: [{ id: 'u1', name: '小悠', color: '#2563eb' }],
  activeUserId: 'u1',
  trips: [],
  markers: [],
  savedGuides: [],
  guideSearchHistory: [],
};

describe('useTravelStoreActions', () => {
  const setStore = vi.fn();
  const setMessage = vi.fn();
  const showToast = vi.fn();
  const setSaving = vi.fn();
  const setSelectedRegionId = vi.fn();
  const setMarkerModalOpen = vi.fn();
  const setDetailMarkerId = vi.fn();

  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.useCompanionActionsMock.mockReturnValue({ createCompanion: vi.fn() });
    mocks.useTripActionsMock.mockReturnValue({ createTrip: vi.fn() });
    mocks.useMarkerActionsMock.mockReturnValue({ createMarker: vi.fn() });
    mocks.useGuideActionsMock.mockReturnValue({ searchGuide: vi.fn() });
  });

  it('passes the full action args into each child hook and merges their results', () => {
    const args = {
      store,
      setStore,
      setMessage,
      showToast,
      setSaving,
      setSelectedRegionId,
      setMarkerModalOpen,
      setDetailMarkerId,
    };

    const { result } = renderHook(() => useTravelStoreActions(args));

    expect(mocks.useCompanionActionsMock).toHaveBeenCalledWith(args);
    expect(mocks.useTripActionsMock).toHaveBeenCalledWith(args);
    expect(mocks.useMarkerActionsMock).toHaveBeenCalledWith(args);
    expect(mocks.useGuideActionsMock).toHaveBeenCalledWith(args);
    expect(result.current).toMatchObject({
      createCompanion: expect.any(Function),
      createTrip: expect.any(Function),
      createMarker: expect.any(Function),
      searchGuide: expect.any(Function),
    });
  });
});
