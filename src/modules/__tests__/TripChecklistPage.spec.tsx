import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTripChecklistItem,
  deleteTripChecklistItem,
  fetchTripChecklist,
  fetchTripDetail,
  updateTripChecklistItem,
} from '../../lib/api/tripsApi';
import TripChecklistPage from '../trips/TripChecklistPage';

vi.mock('../../lib/api/tripsApi', () => ({
  fetchTripDetail: vi.fn(),
  fetchTripChecklist: vi.fn(),
  createTripChecklistItem: vi.fn(),
  updateTripChecklistItem: vi.fn(),
  deleteTripChecklistItem: vi.fn(),
}));

describe('TripChecklistPage', () => {
  const account = { id: 'acct-1', name: 'Voyage Atlas', username: 'demo', role: 'member' as const };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchTripDetail).mockResolvedValue({
      trip: {
        id: 'trip-1',
        name: '京都春日行',
        note: '',
        startsAt: '2026-04-01',
        endsAt: '2026-04-05',
        createdAt: '2026-03-01T00:00:00.000Z',
      },
      summary: {
        markerCount: 1,
        travelDays: 3,
        cityCount: 1,
        regionCount: 1,
        companionCount: 1,
        guideCount: 1,
        photoCount: 1,
      },
      companions: [{ id: 'user-alice', name: '小悠', color: '#2563eb', markerCount: 1 }],
      markers: [],
      photos: [],
      guides: [],
      checklistSummary: {
        total: 1,
        preDepartureCount: 1,
        inTransitCount: 0,
        doneCount: 0,
      },
      checklistGroups: [
        {
          stage: 'pre_departure',
          title: '出发前准备',
          description: '把预约、路线、装备和行前确认放在这里。',
          itemCount: 1,
          items: [
            {
              id: 'item-1',
              companionId: 'user-alice',
              companionName: '小悠',
              companionColor: '#2563eb',
              title: '提前确认景点预约',
              note: '尽量避开中午高峰',
              stage: 'pre_departure',
              sortOrder: 0,
              origin: 'generated',
              createdAt: '2026-03-02T00:00:00.000Z',
              updatedAt: '2026-03-02T00:00:00.000Z',
            },
          ],
        },
        {
          stage: 'in_transit',
          title: '旅途中留意',
          description: '把路上节奏、交通衔接和现场提醒收在这里。',
          itemCount: 0,
          items: [],
        },
        {
          stage: 'done',
          title: '已经完成',
          description: '完成的事项会沉淀到这一组，方便回看。',
          itemCount: 0,
          items: [],
        },
      ],
      meta: {
        generatedAt: '2026-03-02T00:00:00.000Z',
      },
    });
    vi.mocked(fetchTripChecklist).mockResolvedValue({
      summary: {
        total: 1,
        preDepartureCount: 1,
        inTransitCount: 0,
        doneCount: 0,
      },
      groups: [],
    });
    vi.mocked(createTripChecklistItem).mockResolvedValue({
      id: 'item-2',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      title: '准备交通方案',
      stage: 'pre_departure',
      sortOrder: 1,
      origin: 'manual',
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
    });
    vi.mocked(updateTripChecklistItem).mockResolvedValue({
      id: 'item-1',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      title: '提前确认景点预约',
      stage: 'done',
      sortOrder: 0,
      origin: 'generated',
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
    });
    vi.mocked(deleteTripChecklistItem).mockResolvedValue({ deletedId: 'item-1' });
  });

  it('renders checklist groups and supports manual item creation', async () => {
    render(
      <TripChecklistPage
        account={account}
        tripId="trip-1"
        onNavigateBack={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(await screen.findByRole('heading', { name: '京都春日行' })).toBeInTheDocument();
    expect(screen.getByText('出发前准备', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('提前确认景点预约')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/例如：提前确认景点预约/), '准备交通方案');
    await userEvent.click(screen.getByRole('button', { name: '新增清单项' }));

    await waitFor(() => {
      expect(createTripChecklistItem).toHaveBeenCalledWith('trip-1', expect.objectContaining({ title: '准备交通方案' }));
    });
  });

  it('edits checklist items', async () => {
    render(
      <TripChecklistPage
        account={account}
        tripId="trip-1"
        onNavigateBack={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(await screen.findByRole('heading', { name: '京都春日行' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '编辑' }));
    const titleInput = screen.getByDisplayValue('提前确认景点预约');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, '更新清单标题');
    await userEvent.click(screen.getByRole('button', { name: '保存修改' }));

    await waitFor(() => {
      expect(updateTripChecklistItem).toHaveBeenCalledWith('trip-1', 'item-1', {
        title: '更新清单标题',
        note: '尽量避开中午高峰',
      });
    });
  });

  it('deletes checklist items', async () => {
    render(
      <TripChecklistPage
        account={account}
        tripId="trip-1"
        onNavigateBack={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(await screen.findByRole('heading', { name: '京都春日行' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(deleteTripChecklistItem).toHaveBeenCalledWith('trip-1', 'item-1');
    });
  });

  it('handles create/update/delete failures plus logout', async () => {
    vi.mocked(createTripChecklistItem).mockRejectedValueOnce(new Error('新增失败'));
    vi.mocked(updateTripChecklistItem).mockRejectedValueOnce(new Error('更新失败'));
    vi.mocked(deleteTripChecklistItem).mockRejectedValueOnce(new Error('删除失败'));
    const onLogout = vi.fn();

    render(
      <TripChecklistPage account={account} tripId="trip-1" onNavigateBack={vi.fn()} onLogout={onLogout} />,
    );

    expect(await screen.findByText('提前确认景点预约')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText(/例如：提前确认景点预约/), '失败清单');
    await userEvent.click(screen.getByRole('button', { name: '新增清单项' }));
    expect(await screen.findByText('新增失败')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '编辑' }));
    await userEvent.click(screen.getByRole('button', { name: '保存修改' }));
    expect(await screen.findByText('更新失败')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '删除' }));
    expect(await screen.findByText('删除失败')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '退出登录' }));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('shows empty state after a successful stage change reloads an empty checklist', async () => {
    vi.mocked(fetchTripChecklist).mockResolvedValueOnce({
      summary: {
        total: 0,
        preDepartureCount: 0,
        inTransitCount: 0,
        doneCount: 0,
      },
      groups: [],
    } as never);

    render(
      <TripChecklistPage account={account} tripId="trip-1" onNavigateBack={vi.fn()} onLogout={vi.fn()} />,
    );

    expect(await screen.findByText('提前确认景点预约')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '调整 提前确认景点预约 的阶段' }));
    const doneButtons = await screen.findAllByRole('button', { name: '已经完成' });
    await userEvent.click(doneButtons[doneButtons.length - 1]);
    await waitFor(() => {
      expect(updateTripChecklistItem).toHaveBeenCalledWith('trip-1', 'item-1', { stage: 'done' });
    });
    expect(await screen.findByText('还没有行前清单，可以先从攻略搜索结果生成，也可以在这里手动补充。')).toBeInTheDocument();
  });
});
