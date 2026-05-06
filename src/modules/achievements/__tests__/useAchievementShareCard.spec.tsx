import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAchievementShareCard } from '../useAchievementShareCard';

describe('useAchievementShareCard', () => {
  const achievement = {
    id: 'city-explorer',
    title: '城市探索者',
    description: '覆盖 5 座不同城市。',
    category: 'footprint' as const,
    group: 'footprint' as const,
    periodType: 'global' as const,
    rarity: 'common' as const,
    status: 'close' as const,
    progressValue: 4,
    progressTarget: 5,
    unit: '座城市',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => 'blob:achievement'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('exports the share card and emits a success toast', () => {
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useAchievementShareCard({
        accountName: 'Voyage Atlas',
        showToast,
      }),
    );

    expect(result.current(achievement)).toBe(true);
    expect(showToast).toHaveBeenCalledWith('分享卡已保存到本地 / Share card saved locally', 'success');
  });

  it('blocks locked achievements and emits an info toast', () => {
    const showToast = vi.fn();
    const { result } = renderHook(() =>
      useAchievementShareCard({
        accountName: 'Voyage Atlas',
        showToast,
      }),
    );

    expect(result.current({ ...achievement, status: 'locked' as const })).toBe(false);
    expect(showToast).toHaveBeenCalledWith(
      '达成后可解锁分享卡 / Unlock the achievement to save its share card',
      'info',
    );
  });
});
