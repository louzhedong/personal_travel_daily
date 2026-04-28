import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TripChecklistBoard from '../trips/TripChecklistBoard';

vi.mock('../ui/FancySelect', () => ({
  default: ({
    value,
    onChange,
    options,
    ariaLabel,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    ariaLabel: string;
  }) => (
    <select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const summary = {
  total: 2,
  preDepartureCount: 1,
  inTransitCount: 1,
  doneCount: 0,
};

const groups = [
  {
    stage: 'pre_departure' as const,
    title: '出发前准备',
    description: '提前确认路线与预约。',
    itemCount: 1,
    items: [
      {
        id: 'item-1',
        companionId: 'u1',
        companionName: '小悠',
        companionColor: '#2563eb',
        title: '提前预约景点',
        note: '避开高峰',
        stage: 'pre_departure' as const,
        sortOrder: 0,
        origin: 'generated' as const,
        sourceGuideTitle: '京都春游攻略',
        sourceSnippet: '建议提前预约',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
    ],
  },
  {
    stage: 'in_transit' as const,
    title: '旅途中留意',
    description: '把路上提醒放在这里。',
    itemCount: 1,
    items: [
      {
        id: 'item-2',
        companionId: 'u1',
        companionName: '小悠',
        companionColor: '#2563eb',
        title: '确认返程交通',
        note: null,
        stage: 'in_transit' as const,
        sortOrder: 1,
        origin: 'manual' as const,
        sourceGuideTitle: null,
        sourceSnippet: null,
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
    ],
  },
  {
    stage: 'done' as const,
    title: '已经完成',
    description: '完成项。',
    itemCount: 0,
    items: [],
  },
];

describe('TripChecklistBoard', () => {
  it('renders loading and empty states', () => {
    const { rerender } = render(
      <TripChecklistBoard
        activeCompanionId="u1"
        summary={{ total: 0, preDepartureCount: 0, inTransitCount: 0, doneCount: 0 }}
        groups={[]}
        loading
        onCreateItem={vi.fn()}
        onUpdateItem={vi.fn()}
        onDeleteItem={vi.fn()}
      />,
    );

    expect(screen.getByText('正在整理这次行程的清单...')).toBeInTheDocument();

    rerender(
      <TripChecklistBoard
        activeCompanionId="u1"
        summary={{ total: 0, preDepartureCount: 0, inTransitCount: 0, doneCount: 0 }}
        groups={[]}
        loading={false}
        emptyMessage="暂时没有清单项"
        onCreateItem={vi.fn()}
        onUpdateItem={vi.fn()}
        onDeleteItem={vi.fn()}
      />,
    );

    expect(screen.getByText('暂时没有清单项')).toBeInTheDocument();
  });

  it('creates new checklist items and resets the draft fields', async () => {
    const user = userEvent.setup();
    const onCreateItem = vi.fn();

    render(
      <TripChecklistBoard
        activeCompanionId="u1"
        summary={summary}
        groups={groups}
        onCreateItem={onCreateItem}
        onUpdateItem={vi.fn()}
        onDeleteItem={vi.fn()}
      />,
    );

    const titleInput = screen.getByPlaceholderText('例如：提前确认景点预约、机场到市区交通、需要带的装备');
    const noteInput = screen.getByPlaceholderText('可选：补充一句为什么要做，或者要留意的细节。');

    await user.type(titleInput, '确认酒店入住时间');
    await user.selectOptions(screen.getByLabelText('选择新清单项所属阶段'), 'done');
    await user.type(noteInput, '避免太晚到店');
    await user.click(screen.getByRole('button', { name: '新增清单项' }));

    expect(onCreateItem).toHaveBeenCalledWith({
      companionId: 'u1',
      title: '确认酒店入住时间',
      note: '避免太晚到店',
      stage: 'done',
    });
    expect(titleInput).toHaveValue('');
    expect(noteInput).toHaveValue('');
  });

  it('supports editing, changing stage, deleting, and opening expanded view', async () => {
    const user = userEvent.setup();
    const onUpdateItem = vi.fn();
    const onDeleteItem = vi.fn();
    const onOpenExpanded = vi.fn();

    render(
      <TripChecklistBoard
        activeCompanionId="u1"
        summary={summary}
        groups={groups}
        feedbackMessage="已同步"
        onCreateItem={vi.fn()}
        onUpdateItem={onUpdateItem}
        onDeleteItem={onDeleteItem}
        onOpenExpanded={onOpenExpanded}
      />,
    );

    expect(screen.getByText('已同步')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '放大查看' }));
    expect(onOpenExpanded).toHaveBeenCalledOnce();

    await user.selectOptions(screen.getByLabelText('调整 提前预约景点 的阶段'), 'done');
    expect(onUpdateItem).toHaveBeenCalledWith('item-1', { stage: 'done' });

    const sourceCard = screen.getByText('提前预约景点').closest('article');
    expect(sourceCard).not.toBeNull();
    await user.click(within(sourceCard!).getByRole('button', { name: '编辑' }));
    const card = sourceCard;
    expect(card).not.toBeNull();
    const scoped = within(card!);
    const editTitle = scoped.getByDisplayValue('提前预约景点');
    const editNote = scoped.getByDisplayValue('避开高峰');
    await user.clear(editTitle);
    await user.type(editTitle, '提前确认门票');
    await user.clear(editNote);
    await user.type(editNote, '新的备注');
    await user.click(scoped.getByRole('button', { name: '保存修改' }));

    expect(onUpdateItem).toHaveBeenCalledWith('item-1', {
      title: '提前确认门票',
      note: '新的备注',
    });

    await user.click(within(card!).getByRole('button', { name: '删除' }));
    expect(onDeleteItem).toHaveBeenCalledWith('item-1');
  });
});
