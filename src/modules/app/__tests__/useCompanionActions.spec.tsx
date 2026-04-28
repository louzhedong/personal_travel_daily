import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCompanionActions } from '../useCompanionActions';
import type { TravelStore } from '../../../types';

const { remoteTravelStoreRepositoryMock } = vi.hoisted(() => ({
  remoteTravelStoreRepositoryMock: {
    createCompanion: vi.fn(),
  },
}));

vi.mock('../../../lib/repositories/remoteTravelStoreRepository', () => ({
  remoteTravelStoreRepository: remoteTravelStoreRepositoryMock,
}));

const store: TravelStore = {
  users: [
    { id: 'u1', name: '小悠', color: '#2563eb' },
    { id: 'u2', name: '阿泽', color: '#f97316' },
  ],
  activeUserId: 'u1',
  markers: [],
  savedGuides: [],
  guideSearchHistory: [],
};

describe('useCompanionActions', () => {
  const setStore = vi.fn();
  const setMessage = vi.fn();
  const showToast = vi.fn();
  const setSaving = vi.fn();
  const setSelectedRegionId = vi.fn();
  const setMarkerModalOpen = vi.fn();
  const setDetailMarkerId = vi.fn();

  beforeEach(() => {
    setStore.mockReset();
    setMessage.mockReset();
    showToast.mockReset();
    setSaving.mockReset();
    setSelectedRegionId.mockReset();
    setMarkerModalOpen.mockReset();
    setDetailMarkerId.mockReset();
    remoteTravelStoreRepositoryMock.createCompanion.mockReset();
    remoteTravelStoreRepositoryMock.createCompanion.mockResolvedValue({
      ...store,
      users: [...store.users, { id: 'u3', name: '阿青', color: '#14b8a6' }],
      activeUserId: 'u3',
    });
  });

  it('shows a success toast after switching current user', async () => {
    const { result } = renderHook(() =>
      useCompanionActions({
        store,
        setStore,
        setMessage,
        showToast,
        setSaving,
        setSelectedRegionId,
        setMarkerModalOpen,
        setDetailMarkerId,
      }),
    );

    act(() => {
      result.current.handleSwitchUser('u2');
    });

    expect(showToast).toHaveBeenCalledWith('当前记录用户已切换为 阿泽。', 'success');
  });

  it('shows a success toast after creating a user', async () => {
    const { result } = renderHook(() =>
      useCompanionActions({
        store,
        setStore,
        setMessage,
        showToast,
        setSaving,
        setSelectedRegionId,
        setMarkerModalOpen,
        setDetailMarkerId,
      }),
    );

    await act(async () => {
      await result.current.handleCreateUser({ name: '阿青', color: '#14b8a6' });
    });

    expect(showToast).toHaveBeenCalledWith('已新增用户 阿青，现在可以使用该用户记录旅行。', 'success');
  });
});
