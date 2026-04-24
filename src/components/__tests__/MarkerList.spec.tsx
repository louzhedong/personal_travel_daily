import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkerList from '../MarkerList';
import type { UserProfile, VisitMarker } from '../../types';

const users: UserProfile[] = [
  { id: 'u1', name: '小悠', color: '#2563eb' },
  { id: 'u2', name: '阿泽', color: '#f97316' },
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
  {
    id: 'm2',
    userId: 'u2',
    scope: 'international',
    scopeId: '京都府',
    scopeName: '京都府',
    city: '京都',
    note: '春天赏樱',
    visitedStartAt: '2026-04-01',
    visitedEndAt: '2026-04-05',
    createdAt: '2026-04-06T00:00:00.000Z',
  },
];

describe('MarkerList', () => {
  it('opens detail when clicking the detail button', async () => {
    const onViewDetail = vi.fn();

    render(
        <MarkerList
          scope="domestic"
          markers={markers.filter((marker) => marker.scope === 'domestic')}
          allMarkers={markers}
          users={users}
          activeUserId="u1"
        onDelete={() => {}}
        onViewDetail={onViewDetail}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '查看详情' }));

    expect(onViewDetail).toHaveBeenCalledWith('m1');
  });

  it('opens data sync modal entry from marker module', async () => {
    const onOpenDataSync = vi.fn();

    render(
        <MarkerList
          scope="domestic"
          markers={markers.filter((marker) => marker.scope === 'domestic')}
          allMarkers={markers}
        users={users}
        activeUserId="u1"
        onDelete={() => {}}
        onViewDetail={() => {}}
        onOpenDataSync={onOpenDataSync}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '数据备份与恢复' }));

    expect(onOpenDataSync).toHaveBeenCalledTimes(1);
  });

  it('emits delete intent when clicking the delete button', async () => {
    const onDelete = vi.fn();

    render(
        <MarkerList
          scope="domestic"
          markers={markers.filter((marker) => marker.scope === 'domestic')}
          allMarkers={markers}
        users={users}
        activeUserId="u1"
        onDelete={onDelete}
        onViewDetail={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '删除' }));

    expect(onDelete).toHaveBeenCalledWith('m1');
  });

  it('searches markers through the server when pressing Enter in the keyword field', async () => {
    const onSearchMarkers = vi.fn(async () => ({
      items: [markers[1]!],
      page: 1,
      pageSize: 20,
      total: 1,
      hasMore: false,
    }));

    render(
      <MarkerList
        scope="domestic"
        markers={markers.filter((marker) => marker.scope === 'domestic')}
        allMarkers={markers}
        users={users}
        activeUserId="u1"
        onDelete={() => {}}
        onViewDetail={() => {}}
        onSearchMarkers={onSearchMarkers}
      />,
    );

    await userEvent.type(screen.getByLabelText('搜索旅行记录'), '京都');

    expect(onSearchMarkers).not.toHaveBeenCalled();

    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(onSearchMarkers).toHaveBeenLastCalledWith({
        keyword: '京都',
        companionId: undefined,
        scope: 'domestic',
        year: undefined,
        page: 1,
        pageSize: 20,
      });
    });
    expect(await screen.findByText('京都府')).toBeInTheDocument();
  });

  it('focuses cross-scope search results instead of only opening local detail', async () => {
    const onFocusSearchResult = vi.fn();
    const onSearchMarkers = vi.fn(async () => ({
      items: [markers[1]!],
      page: 1,
      pageSize: 20,
      total: 1,
      hasMore: false,
    }));

    render(
      <MarkerList
        scope="domestic"
        markers={markers.filter((marker) => marker.scope === 'domestic')}
        allMarkers={markers}
        users={users}
        activeUserId="u1"
        onDelete={() => {}}
        onViewDetail={() => {}}
        onFocusSearchResult={onFocusSearchResult}
        onSearchMarkers={onSearchMarkers}
      />,
    );

    await userEvent.type(screen.getByLabelText('搜索旅行记录'), '京都');
    await userEvent.keyboard('{Enter}');
    await userEvent.click(await screen.findByRole('button', { name: '查看详情' }));

    expect(onFocusSearchResult).toHaveBeenCalledWith('m2');
  });
});
