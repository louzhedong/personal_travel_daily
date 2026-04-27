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

function renderTimelinePanel(overrides?: Partial<React.ComponentProps<typeof TripTimelinePanel>>) {
  return render(
    <TripTimelinePanel
      markers={markers}
      trips={[]}
      activeUserId="u1"
      activeUserName="小悠"
      onOpenMarkerDetail={vi.fn()}
      onOpenTripDetail={vi.fn()}
      onCreateTrip={vi.fn()}
      onUpdateTrip={vi.fn()}
      onDeleteTrip={vi.fn()}
      onBulkAssignMarkersToTrip={vi.fn()}
      {...overrides}
    />,
  );
}

describe('TripTimelinePanel', () => {
  it('groups same-day markers and opens marker detail', async () => {
    const onOpenMarkerDetail = vi.fn();
    const user = userEvent.setup();

    renderTimelinePanel({
      onOpenMarkerDetail,
    });

    expect(screen.getAllByText('2026-05-01').length).toBeGreaterThan(0);
    expect(screen.getByText('2 条记录')).toBeInTheDocument();
    expect(screen.queryByText('广州')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /浙江 · 杭州/i }));
    expect(onOpenMarkerDetail).toHaveBeenCalledWith('m-1');
  });

  it('filters by scope and year', async () => {
    const user = userEvent.setup();

    renderTimelinePanel();

    await user.click(screen.getByRole('tab', { name: '国际' }));
    expect(screen.getByText('日本 · 京都')).toBeInTheDocument();
    expect(screen.queryByText('浙江 · 杭州')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '按年份筛选时间线' }));
    await user.click(screen.getByRole('button', { name: '2025' }));
    expect(screen.queryByText('日本 · 京都')).not.toBeInTheDocument();
    expect(screen.getByText('当前筛选条件下暂无记录。')).toBeInTheDocument();
  });

  it('groups assigned markers by trip collection', () => {
    renderTimelinePanel({
      markers: [{ ...markers[0], tripId: 'trip-1' }, markers[1]],
      trips,
    });

    expect(screen.getByText('江南春游')).toBeInTheDocument();
    expect(screen.getByText(/2026-05-01 - 2026-05-03/)).toBeInTheDocument();
    expect(screen.getByText('未归入行程')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看详情' })).toBeInTheDocument();
  });

  it('opens trip creation in a dialog', async () => {
    const user = userEvent.setup();
    const onCreateTrip = vi.fn();

    renderTimelinePanel({
      onCreateTrip,
    });

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

  it('opens trip edit dialog and forwards updated payload', async () => {
    const user = userEvent.setup();
    const onUpdateTrip = vi.fn();

    renderTimelinePanel({
      markers: [{ ...markers[0], tripId: 'trip-1' }],
      trips,
      onUpdateTrip,
    });

    await user.click(screen.getByRole('button', { name: '编辑行程' }));
    const dialog = screen.getByRole('dialog', { name: '编辑行程' });

    await user.clear(within(dialog).getByPlaceholderText('新建行程，例如 2025 日本春游'));
    await user.type(within(dialog).getByPlaceholderText('新建行程，例如 2025 日本春游'), '更新后的江南春游');
    await user.click(within(dialog).getByRole('button', { name: '保存行程' }));

    expect(onUpdateTrip).toHaveBeenCalledWith('trip-1', {
      name: '更新后的江南春游',
      startsAt: '2026-05-01',
      endsAt: '2026-05-03',
      note: undefined,
    });
  });

  it('selects markers in batch mode and assigns them to a trip', async () => {
    const user = userEvent.setup();
    const onBulkAssignMarkersToTrip = vi.fn();

    renderTimelinePanel({
      trips,
      onBulkAssignMarkersToTrip,
    });

    await user.click(screen.getByRole('button', { name: '整理记录' }));
    await user.click(screen.getByRole('button', { name: /浙江 · 杭州/i }));
    await user.click(screen.getByRole('button', { name: '选择批量整理的目标行程' }));
    await user.click(screen.getByRole('button', { name: '江南春游' }));
    await user.click(screen.getByRole('button', { name: '应用整理' }));

    expect(onBulkAssignMarkersToTrip).toHaveBeenCalledWith(['m-1'], 'trip-1');
  });

  it('still allows selecting markers in batch mode when showing plain timeline groups', async () => {
    const user = userEvent.setup();
    const onBulkAssignMarkersToTrip = vi.fn();

    renderTimelinePanel({
      trips: [],
      onBulkAssignMarkersToTrip,
    });

    await user.click(screen.getByRole('button', { name: '整理记录' }));
    await user.click(screen.getByRole('button', { name: /浙江 · 杭州/i }));
    await user.click(screen.getByRole('button', { name: '选择批量整理的目标行程' }));
    await user.click(screen.getByRole('button', { name: '移回未归入行程' }));
    await user.click(screen.getByRole('button', { name: '应用整理' }));

    expect(onBulkAssignMarkersToTrip).toHaveBeenCalledWith(['m-1'], null);
  });

  it('shows selected markers in a tooltip list in batch mode', async () => {
    const user = userEvent.setup();

    renderTimelinePanel({
      trips,
    });

    await user.click(screen.getByRole('button', { name: '整理记录' }));
    expect(screen.getByText('已选 0 条记录')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /浙江 · 杭州/i }));
    await user.click(screen.getByRole('button', { name: /日本 · 京都/i }));
    expect(screen.getByText('已选 2 条记录')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '选择批量整理的目标行程' }));
    await user.click(screen.getByRole('button', { name: '江南春游' }));

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('已选记录');
    expect(tooltip).toHaveTextContent('浙江 · 杭州');
    expect(tooltip).toHaveTextContent('日本 · 京都');
  });

  it('makes the tooltip scrollable when more than five markers are selected', async () => {
    const user = userEvent.setup();
    const manyMarkers: VisitMarker[] = [
      {
        id: 'm-10',
        userId: 'u1',
        scope: 'domestic',
        scopeId: 'zhejiang',
        scopeName: '一段非常长的省份名称用于验证文本截断效果',
        city: '一段非常长的城市名称用于验证文本截断效果',
        note: '',
        visitedStartAt: '2026-04-01',
        visitedEndAt: '2026-04-01',
        createdAt: '2026-04-02T10:00:00.000Z',
      },
      {
        id: 'm-11',
        userId: 'u1',
        scope: 'domestic',
        scopeId: 'jiangsu',
        scopeName: '江苏',
        city: '南京',
        note: '',
        visitedStartAt: '2026-04-02',
        visitedEndAt: '2026-04-02',
        createdAt: '2026-04-03T10:00:00.000Z',
      },
      {
        id: 'm-12',
        userId: 'u1',
        scope: 'domestic',
        scopeId: 'anhui',
        scopeName: '安徽',
        city: '黄山',
        note: '',
        visitedStartAt: '2026-04-03',
        visitedEndAt: '2026-04-03',
        createdAt: '2026-04-04T10:00:00.000Z',
      },
      {
        id: 'm-13',
        userId: 'u1',
        scope: 'international',
        scopeId: 'france',
        scopeName: '法国',
        city: '巴黎',
        note: '',
        visitedStartAt: '2026-04-04',
        visitedEndAt: '2026-04-04',
        createdAt: '2026-04-05T10:00:00.000Z',
      },
      {
        id: 'm-14',
        userId: 'u1',
        scope: 'international',
        scopeId: 'italy',
        scopeName: '意大利',
        city: '罗马',
        note: '',
        visitedStartAt: '2026-04-05',
        visitedEndAt: '2026-04-05',
        createdAt: '2026-04-06T10:00:00.000Z',
      },
      {
        id: 'm-15',
        userId: 'u1',
        scope: 'international',
        scopeId: 'spain',
        scopeName: '西班牙',
        city: '巴塞罗那',
        note: '',
        visitedStartAt: '2026-04-06',
        visitedEndAt: '2026-04-06',
        createdAt: '2026-04-07T10:00:00.000Z',
      },
    ];

    renderTimelinePanel({
      markers: manyMarkers,
      trips,
    });

    await user.click(screen.getByRole('button', { name: '整理记录' }));
    await user.click(screen.getByRole('button', { name: /一段非常长的省份名称用于验证文本截断效果 · 一段非常长的城市名称用于验证文本截断效果/i }));
    await user.click(screen.getByRole('button', { name: /江苏 · 南京/i }));
    await user.click(screen.getByRole('button', { name: /安徽 · 黄山/i }));
    await user.click(screen.getByRole('button', { name: /法国 · 巴黎/i }));
    await user.click(screen.getByRole('button', { name: /意大利 · 罗马/i }));
    await user.click(screen.getByRole('button', { name: /西班牙 · 巴塞罗那/i }));

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('is-scrollable');
    expect(tooltip.querySelectorAll('li')).toHaveLength(6);
    expect(tooltip.querySelector('.trip-batch-selection-tooltip-primary')).not.toBeNull();
    expect(tooltip.querySelector('.trip-batch-selection-tooltip-secondary')).not.toBeNull();
  });
});
