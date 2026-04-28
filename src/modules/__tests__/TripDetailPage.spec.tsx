import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTripChecklistItem,
  deleteTrip,
  deleteTripChecklistItem,
  fetchTripChecklist,
  fetchTripDetail,
  updateTrip,
  updateTripChecklistItem,
} from '../../lib/api/tripsApi';
import TripDetailPage from '../trips/TripDetailPage';

vi.mock('../../lib/api/tripsApi', () => ({
  fetchTripDetail: vi.fn(),
  fetchTripChecklist: vi.fn(),
  updateTrip: vi.fn(),
  deleteTrip: vi.fn(),
  createTripChecklistItem: vi.fn(),
  updateTripChecklistItem: vi.fn(),
  deleteTripChecklistItem: vi.fn(),
}));

vi.mock('../../components/trips/TripChecklistBoard', () => ({
  default: ({
    onCreateItem,
    onUpdateItem,
    onDeleteItem,
    onOpenExpanded,
  }: {
    onCreateItem: (input: unknown) => void;
    onUpdateItem: (itemId: string, input: unknown) => void;
    onDeleteItem: (itemId: string) => void;
    onOpenExpanded?: () => void;
  }) => (
    <div>
      <button type="button" onClick={() => onCreateItem({ title: '新增清单', companionId: 'user-alice', stage: 'pre_departure' })}>
        新增清单按钮
      </button>
      <button type="button" onClick={() => onUpdateItem('item-1', { title: '更新清单' })}>
        更新清单按钮
      </button>
      <button type="button" onClick={() => onDeleteItem('item-1')}>
        删除清单按钮
      </button>
      <button type="button" onClick={() => onOpenExpanded?.()}>
        展开清单按钮
      </button>
    </div>
  ),
}));

vi.mock('../../components/ui/Dialog', () => ({
  default: ({
    open,
    children,
    onClose,
  }: {
    open: boolean;
    children: React.ReactNode;
    onClose: () => void;
  }) =>
    open ? (
      <div>
        <button type="button" onClick={onClose}>
          关闭编辑弹窗
        </button>
        {children}
      </div>
    ) : null,
}));

vi.mock('../../components/ui/ConfirmDialog', () => ({
  default: ({
    open,
    title,
    cancelText,
    confirmText,
    onCancel,
    onConfirm,
  }: {
    open: boolean;
    title: string;
    cancelText: string;
    confirmText: string;
    onCancel: () => void;
    onConfirm: () => void;
  }) =>
    open ? (
      <div>
        <strong>{title}</strong>
        <button type="button" onClick={onCancel}>
          {cancelText}
        </button>
        <button type="button" onClick={onConfirm}>
          {confirmText}
        </button>
      </div>
    ) : null,
}));

vi.mock('../../components/ui/DateField', () => ({
  default: ({
    value,
    onChange,
    ariaLabel,
  }: {
    value: string;
    onChange: (value: string) => void;
    ariaLabel: string;
  }) => <input aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} />,
}));

vi.mock('../../components/ui/FancySelect', () => ({
  default: ({
    value,
    onChange,
    options,
    ariaLabel,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    ariaLabel?: string;
  }) => (
    <select aria-label={ariaLabel ?? 'trip-detail-select'} value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('../../components/ui/TravelIcon', () => ({
  default: () => <span>icon</span>,
}));

describe('TripDetailPage', () => {
  const tripDetailResponse = {
    trip: {
      id: 'trip-1',
      name: '江南春游',
      note: '杭州与苏州周末行',
      startsAt: '2026-05-01',
      endsAt: '2026-05-03',
      createdAt: '2026-04-20T00:00:00.000Z',
      coverImageUrl: undefined,
    },
    summary: {
      markerCount: 2,
      travelDays: 3,
      cityCount: 2,
      regionCount: 2,
      companionCount: 1,
      guideCount: 1,
      photoCount: 1,
    },
    companions: [{ id: 'user-alice', name: '小悠', color: '#2563eb', markerCount: 2 }],
    markers: [
      {
        id: 'marker-1',
        companionId: 'user-alice',
        companionName: '小悠',
        companionColor: '#2563eb',
        scope: 'domestic',
        scopeId: 'zj',
        scopeName: '浙江',
        city: '杭州',
        note: '西湖晚风',
        imageUrls: ['https://example.com/hangzhou.jpg'],
        tags: ['food'],
        weather: 'sunny',
        transport: 'walk',
        budgetLevel: 'medium',
        visitedStartAt: '2026-05-01',
        visitedEndAt: '2026-05-02',
      },
    ],
    photos: [
      {
        markerId: 'marker-1',
        markerTitle: '浙江 · 杭州',
        imageUrl: 'https://example.com/hangzhou.jpg',
        visitedStartAt: '2026-05-01',
        scopeName: '浙江',
        city: '杭州',
      },
    ],
    guides: [
      {
        id: 'guide-1',
        markerId: 'marker-1',
        keyword: '杭州周末',
        savedAt: '2026-05-05T00:00:00.000Z',
        result: {
          id: 'guide-doc-1',
          title: '杭州周末攻略',
          summary: '逛西湖、灵隐寺',
          sourceName: 'Qyer',
          sourceUrl: 'https://example.com/guide',
        },
      },
    ],
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
            title: '提前确认西湖周边预约',
            stage: 'pre_departure',
            sortOrder: 0,
            origin: 'generated',
            createdAt: '2026-05-05T00:00:00.000Z',
            updatedAt: '2026-05-05T00:00:00.000Z',
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
      generatedAt: '2026-05-06T12:30:00.000Z',
    },
  };

  const account = {
    id: 'acct-1',
    name: 'Voyage Atlas',
    username: 'demo',
    role: 'member' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchTripDetail).mockResolvedValue(tripDetailResponse as never);
    vi.mocked(fetchTripChecklist).mockResolvedValue({
      summary: {
        total: 2,
        preDepartureCount: 1,
        inTransitCount: 1,
        doneCount: 0,
      },
      groups: tripDetailResponse.checklistGroups,
    } as never);
  });

  it('renders trip detail blocks after loading', async () => {
    const onOpenTripStory = vi.fn();
    render(
      <TripDetailPage
        account={account}
        tripId="trip-1"
        onNavigateBack={vi.fn()}
        onLogout={vi.fn()}
        onOpenTripStory={onOpenTripStory}
      />,
    );

    expect(await screen.findByRole('heading', { name: '江南春游' })).toBeInTheDocument();
    expect(screen.getByText('旅行记录')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '行程记录' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '行程照片' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '关联攻略' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: '行前清单' })[0]).toBeInTheDocument();
    expect(screen.getByText('杭州周末攻略')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '查看故事页' }));
    expect(onOpenTripStory).toHaveBeenCalledWith('trip-1');
  });

  it('edits the trip and updates local state after save', async () => {
    const user = userEvent.setup();
    vi.mocked(updateTrip).mockResolvedValue({} as never);

    render(<TripDetailPage account={account} tripId="trip-1" onNavigateBack={vi.fn()} onLogout={vi.fn()} />);

    await screen.findByRole('heading', { name: '江南春游' });
    await user.click(screen.getByRole('button', { name: '编辑行程' }));
    await user.clear(screen.getByPlaceholderText('行程名称'));
    await user.type(screen.getByPlaceholderText('行程名称'), '  江南慢游  ');
    await user.clear(screen.getByLabelText('行程结束日期'));
    await user.type(screen.getByLabelText('行程结束日期'), '2026-05-04');
    await user.selectOptions(screen.getByLabelText('选择行程封面'), 'https://example.com/hangzhou.jpg');
    await user.clear(screen.getByPlaceholderText('记录这次行程的主题、节奏或最值得记住的一句话'));
    await user.type(screen.getByPlaceholderText('记录这次行程的主题、节奏或最值得记住的一句话'), '  更新后的备注  ');
    await user.click(screen.getByRole('button', { name: '保存行程' }));

    await waitFor(() => {
      expect(updateTrip).toHaveBeenCalledWith('trip-1', {
        name: '江南慢游',
        startsAt: '2026-05-01',
        endsAt: '2026-05-04',
        note: '更新后的备注',
        coverImageUrl: 'https://example.com/hangzhou.jpg',
      });
    });
    expect(screen.getByText('已更新当前行程。')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '江南慢游' })).toBeInTheDocument();
  });

  it('runs checklist mutations, reloads checklist, and opens expanded checklist view', async () => {
    const user = userEvent.setup();
    const onOpenTripChecklist = vi.fn();
    vi.mocked(createTripChecklistItem).mockResolvedValue({} as never);
    vi.mocked(updateTripChecklistItem).mockResolvedValue({} as never);
    vi.mocked(deleteTripChecklistItem).mockResolvedValue({} as never);

    render(
      <TripDetailPage
        account={account}
        tripId="trip-1"
        onNavigateBack={vi.fn()}
        onLogout={vi.fn()}
        onOpenTripChecklist={onOpenTripChecklist}
      />,
    );

    await screen.findByRole('heading', { name: '江南春游' });
    await user.click(screen.getByRole('button', { name: '新增清单按钮' }));
    await user.click(screen.getByRole('button', { name: '更新清单按钮' }));
    await user.click(screen.getByRole('button', { name: '删除清单按钮' }));
    await user.click(screen.getByRole('button', { name: '展开清单按钮' }));

    await waitFor(() => {
      expect(createTripChecklistItem).toHaveBeenCalledWith('trip-1', {
        title: '新增清单',
        companionId: 'user-alice',
        stage: 'pre_departure',
      });
      expect(updateTripChecklistItem).toHaveBeenCalledWith('trip-1', 'item-1', { title: '更新清单' });
      expect(deleteTripChecklistItem).toHaveBeenCalledWith('trip-1', 'item-1');
      expect(fetchTripChecklist).toHaveBeenCalledTimes(3);
    });
    expect(onOpenTripChecklist).toHaveBeenCalledWith('trip-1');
    expect(screen.getByText('已删除这条清单。')).toBeInTheDocument();
  });

  it('deletes the trip, handles delete failure, and triggers logout', async () => {
    const user = userEvent.setup();
    const onNavigateBack = vi.fn();
    const onLogout = vi.fn();
    vi.mocked(deleteTrip).mockRejectedValueOnce(new Error('删除失败'));

    render(
      <TripDetailPage account={account} tripId="trip-1" onNavigateBack={onNavigateBack} onLogout={onLogout} />,
    );

    await screen.findByRole('heading', { name: '江南春游' });
    await user.click(screen.getByRole('button', { name: '退出登录' }));
    expect(onLogout).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: '删除行程' }));
    expect(screen.getByText('确认删除这个行程？')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '确认删除' }));
    await waitFor(() => {
      expect(deleteTrip).toHaveBeenCalledWith('trip-1');
    });
    expect(screen.getByText('删除失败')).toBeInTheDocument();
    expect(onNavigateBack).not.toHaveBeenCalled();

    vi.mocked(deleteTrip).mockResolvedValueOnce({} as never);
    await user.click(screen.getByRole('button', { name: '删除行程' }));
    await user.click(screen.getByRole('button', { name: '确认删除' }));
    await waitFor(() => {
      expect(onNavigateBack).toHaveBeenCalledOnce();
    });
  });

  it('renders a not found style state when the request fails', async () => {
    vi.mocked(fetchTripDetail).mockRejectedValue(new Error('trip not found'));

    render(
      <TripDetailPage account={account} tripId="missing-trip" onNavigateBack={vi.fn()} onLogout={vi.fn()} />,
    );

    expect(await screen.findByText('行程不存在或无权访问')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '返回统计中心' })).toHaveLength(2);
  });
});
