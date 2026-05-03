import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dialog from '../ui/Dialog';

describe('Dialog', () => {
  beforeEach(() => {
    document.body.style.overflow = 'auto';
  });

  it('does not lock body scroll when closed', () => {
    render(
      <Dialog open={false} title="旅行成就" onClose={vi.fn()}>
        <p>详情</p>
      </Dialog>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('locks body scroll while open and restores the previous overflow when closed', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Dialog open title="旅行成就" onClose={onClose}>
        <p>详情</p>
      </Dialog>,
    );

    expect(screen.getByRole('dialog', { name: '旅行成就' })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Dialog open={false} title="旅行成就" onClose={onClose}>
        <p>详情</p>
      </Dialog>,
    );

    expect(document.body.style.overflow).toBe('auto');
  });

  it('closes on Escape and backdrop click without closing on card click', () => {
    const onClose = vi.fn();
    render(
      <Dialog open title="旅行成就" onClose={onClose}>
        <button type="button">查看证据</button>
      </Dialog>,
    );

    fireEvent.click(screen.getByRole('button', { name: '查看证据' }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('presentation'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
