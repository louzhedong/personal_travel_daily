import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TripTimelinePanel from '../TripTimelinePanel';
import type { TripCollection, VisitMarker } from '../../types';

const markers: VisitMarker[] = [
  {
    id: 'm-1',
    userId: 'u1',
    scope: 'domestic',
    scopeId: 'zhejiang',
    scopeName: '浙江',
    city: '杭州',
    note: '西湖',
    visitedStartAt: '2026-05-01',
    visitedEndAt: '2026-05-02',
    createdAt: '2026-05-03T10:00:00.000Z',
  },
  {
    id: 'm-2',
    userId: 'u1',
    scope: 'international',
    scopeId: 'japan',
    scopeName: '日本',
    city: '京都',
    note: '赏樱',
    visitedStartAt: '2026-05-01',
    visitedEndAt: '2026-05-01',
    createdAt: '2026-05-03T09:00:00.000Z',
  },
  {
    id: 'm-3',
    userId: 'u1',
    scope: 'domestic',
    scopeId: 'beijing',
    scopeName: '北京',
    city: '北京',
    note: '故宫',
    visitedStartAt: '2025-10-03',
    visitedEndAt: '2025-10-04',
    createdAt: '2025-10-05T09:00:00.000Z',
  },
  {
    id: 'm-4',
    userId: 'u2',
    scope: 'domestic',
    scopeId: 'guangdong',
    scopeName: '广东',
    city: '广州',
    note: '早茶',
    visitedStartAt: '2026-06-01',
    visitedEndAt: '2026-06-01',
    createdAt: '2026-06-02T09:00:00.000Z',
  },
];

const trips: TripCollection[] = [
  {
    id: 'trip-1',
    name: '江南春游',
    note: '',
    startsAt: '2026-05-01',
    endsAt: '2026-05-03',
    createdAt: '2026-04-01T00:00:00.000Z',
  },
];

describe('TripTimelinePanel', () => {
  it('groups same-day markers and opens marker detail', async () => {
    const onOpenMarkerDetail = vi.fn();
    const user = userEvent.setup();

    render(
      <TripTimelinePanel
        markers={markers}
        trips={[]}
        activeUserId="u1"
        activeUserName="小悠"
        onOpenMarkerDetail={onOpenMarkerDetail}
        onCreateTrip={() => {}}
      />,
    );

    expect(screen.getAllByText('2026-05-01').length).toBeGreaterThan(0);
    expect(screen.getByText('2 条记录')).toBeInTheDocument();
    expect(screen.queryByText('广州')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /浙江 · 杭州/i }));
    expect(onOpenMarkerDetail).toHaveBeenCalledWith('m-1');
  });

  it('filters by scope and year', async () => {
    const user = userEvent.setup();

    render(
      <TripTimelinePanel
        markers={markers}
        trips={[]}
        activeUserId="u1"
        onOpenMarkerDetail={() => {}}
        onCreateTrip={() => {}}
      />,
    );

    await user.click(screen.getByRole('tab', { name: '国际' }));
    expect(screen.getByText('日本 · 京都')).toBeInTheDocument();
    expect(screen.queryByText('浙江 · 杭州')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '按年份筛选时间线' }));
    await user.click(screen.getByRole('button', { name: '2025' }));
    expect(screen.queryByText('日本 · 京都')).not.toBeInTheDocument();
    expect(screen.getByText('当前筛选条件下暂无记录。')).toBeInTheDocument();
  });

  it('groups assigned markers by trip collection', () => {
    render(
      <TripTimelinePanel
        markers={[{ ...markers[0], tripId: 'trip-1' }, markers[1]]}
        trips={trips}
        activeUserId="u1"
        onOpenMarkerDetail={() => {}}
        onCreateTrip={() => {}}
      />,
    );

    expect(screen.getByText('江南春游')).toBeInTheDocument();
    expect(screen.getByText(/2026-05-01 - 2026-05-03/)).toBeInTheDocument();
    expect(screen.getByText('未归入行程')).toBeInTheDocument();
  });

  it('opens trip creation in a dialog', async () => {
    const user = userEvent.setup();
    const onCreateTrip = vi.fn();

    render(
      <TripTimelinePanel
        markers={markers}
        trips={[]}
        activeUserId="u1"
        onOpenMarkerDetail={() => {}}
        onCreateTrip={onCreateTrip}
      />,
    );

    expect(screen.queryByRole('dialog', { name: '创建行程' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '创建行程' }));
    const dialog = screen.getByRole('dialog', { name: '创建行程' });
    expect(dialog).toBeInTheDocument();

    await user.type(within(dialog).getByPlaceholderText('新建行程，例如 2025 日本春游'), '2026 江南春游');
    await user.click(within(dialog).getByRole('button', { name: '行程开始日期' }));
    await user.click(within(dialog).getByRole('button', { name: '下个月' }));
    await user.click(within(dialog).getByRole('button', { name: '2026-05-01' }));

    await user.click(within(dialog).getByRole('button', { name: '行程结束日期' }));
    await user.click(within(dialog).getByRole('button', { name: '2026-05-03' }));
    await user.click(within(dialog).getByRole('button', { name: '创建行程' }));

    expect(onCreateTrip).toHaveBeenCalledWith({
      name: '2026 江南春游',
      startsAt: '2026-05-01',
      endsAt: '2026-05-03',
      note: undefined,
    });
  });
});
