import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import WishlistPanel from '../WishlistPanel';
import type { UserProfile, WishlistItem } from '../../types';

const users: UserProfile[] = [{ id: 'user-alice', name: '小悠', color: '#2563eb' }];

const items: WishlistItem[] = [
  {
    id: 'wishlist-1',
    companionId: 'user-alice',
    companionName: '小悠',
    companionColor: '#2563eb',
    title: '京都赏樱',
    scope: 'international',
    scopeId: 'japan',
    scopeName: '日本',
    city: '京都',
    note: '避开周末',
    priority: 'high',
    targetYear: '2026',
    importedTrips: [{ id: 'trip-1', name: '日本春游' }],
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
];

describe('WishlistPanel', () => {
  it('shows imported state and supports editing a wishlist item', async () => {
    const onUpdate = vi.fn(async () => items[0]);
    const user = userEvent.setup();

    render(
      <WishlistPanel
        items={items}
        users={users}
        activeUserId="user-alice"
        onUpdate={onUpdate}
        onConvertToTrip={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('已导入：日本春游')).toBeInTheDocument();
    expect(screen.getByText('优先级 高')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '编辑' }));
    await user.clear(screen.getByPlaceholderText('备注'));
    await user.type(screen.getByPlaceholderText('备注'), '安排夜樱路线');
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(onUpdate).toHaveBeenCalledWith('wishlist-1', expect.objectContaining({ note: '安排夜樱路线' }));
  });
});
