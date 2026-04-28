import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TripEditorDialog from '../timeline/TripEditorDialog';

vi.mock('../ui/Dialog', () => ({
  default: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
  }) => (open ? <section aria-label={title}>{children}</section> : null),
}));

vi.mock('../ui/DateField', () => ({
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

describe('TripEditorDialog', () => {
  it('renders create mode and forwards edited values plus submit/close events', async () => {
    const user = userEvent.setup();
    const onNameChange = vi.fn();
    const onStartsAtChange = vi.fn();
    const onEndsAtChange = vi.fn();
    const onNoteChange = vi.fn();
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    render(
      <TripEditorDialog
        mode="create"
        name=""
        startsAt=""
        endsAt=""
        note=""
        canSubmit
        onNameChange={onNameChange}
        onStartsAtChange={onStartsAtChange}
        onEndsAtChange={onEndsAtChange}
        onNoteChange={onNoteChange}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );

    await user.type(screen.getByPlaceholderText('新建行程，例如 2025 日本春游'), '北海道雪国行');
    await user.type(screen.getByLabelText('行程开始日期'), '2026-01-10');
    await user.type(screen.getByLabelText('行程结束日期'), '2026-01-16');
    await user.type(screen.getByPlaceholderText('备注，可选'), '带上厚外套');
    await user.click(screen.getByRole('button', { name: '取消' }));
    await user.click(screen.getByRole('button', { name: '创建行程' }));

    expect(onNameChange).toHaveBeenCalled();
    expect(onStartsAtChange).toHaveBeenCalled();
    expect(onEndsAtChange).toHaveBeenCalled();
    expect(onNoteChange).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('renders edit mode and disables submit button when canSubmit is false', () => {
    render(
      <TripEditorDialog
        mode="edit"
        name="京都春游"
        startsAt="2026-04-01"
        endsAt="2026-04-05"
        note=""
        canSubmit={false}
        onNameChange={vi.fn()}
        onStartsAtChange={vi.fn()}
        onEndsAtChange={vi.fn()}
        onNoteChange={vi.fn()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '保存行程' })).toBeDisabled();
  });

  it('renders nothing when mode is null', () => {
    render(
      <TripEditorDialog
        mode={null}
        name=""
        startsAt=""
        endsAt=""
        note=""
        canSubmit={false}
        onNameChange={vi.fn()}
        onStartsAtChange={vi.fn()}
        onEndsAtChange={vi.fn()}
        onNoteChange={vi.fn()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByPlaceholderText('新建行程，例如 2025 日本春游')).not.toBeInTheDocument();
  });
});
