import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLockedModal } from '../useLockedModal';

describe('useLockedModal', () => {
  beforeEach(() => {
    document.body.style.overflow = 'auto';
  });

  it('does nothing when closed', () => {
    const onClose = vi.fn();
    renderHook(({ open }) => useLockedModal(open, onClose), { initialProps: { open: false } });

    expect(document.body.style.overflow).toBe('auto');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('locks body scroll, closes on Escape, and restores on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = renderHook(() => useLockedModal(true, onClose));

    expect(document.body.style.overflow).toBe('hidden');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalledOnce();

    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('restores body overflow when toggled from open to closed', () => {
    const onClose = vi.fn();
    const { rerender } = renderHook(({ open }) => useLockedModal(open, onClose), {
      initialProps: { open: true },
    });

    expect(document.body.style.overflow).toBe('hidden');

    rerender({ open: false });
    expect(document.body.style.overflow).toBe('auto');
  });
});
