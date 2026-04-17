import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkerList from '../MarkerList';
import type { UserProfile, VisitMarker } from '../../types';

const users: UserProfile[] = [
  { id: 'u1', name: '小悠', color: '#2563eb' },
];

const markers: VisitMarker[] = [
  {
    id: 'm1',
    userId: 'u1',
    scope: 'domestic',
    scopeId: '青海',
    scopeName: '青海',
    city: '西宁',
    note: '湖很蓝',
    imageUrls: ['https://example.com/a.jpg'],
    visitedStartAt: '2026-05-01',
    visitedEndAt: '2026-05-03',
    createdAt: '2026-05-04T00:00:00.000Z',
  },
];

describe('MarkerList', () => {
  it('opens detail when clicking the detail button', async () => {
    const onViewDetail = vi.fn();

    render(
      <MarkerList
        scope="domestic"
        markers={markers}
        users={users}
        activeUserId="u1"
        onDelete={() => {}}
        onViewDetail={onViewDetail}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '查看详情' }));

    expect(onViewDetail).toHaveBeenCalledWith('m1');
  });
});
