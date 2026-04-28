import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TimelineToolbar from '../timeline/TimelineToolbar';

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

describe('TimelineToolbar', () => {
  it('switches scope tabs, changes year filter, and renders batch slot', async () => {
    const user = userEvent.setup();
    const onScopeFilterChange = vi.fn();
    const onYearFilterChange = vi.fn();

    render(
      <TimelineToolbar
        scopeFilter="all"
        onScopeFilterChange={onScopeFilterChange}
        yearFilter="all"
        onYearFilterChange={onYearFilterChange}
        yearOptions={['2026', '2025']}
        batchSlot={<div>批量工具</div>}
      />,
    );

    await user.click(screen.getByRole('tab', { name: '国内' }));
    await user.selectOptions(screen.getByLabelText('按年份筛选时间线'), '2025');

    expect(onScopeFilterChange).toHaveBeenCalledWith('domestic');
    expect(onYearFilterChange).toHaveBeenCalledWith('2025');
    expect(screen.getByText('批量工具')).toBeInTheDocument();
  });

  it('marks the active scope tab as selected', () => {
    render(
      <TimelineToolbar
        scopeFilter="international"
        onScopeFilterChange={vi.fn()}
        yearFilter="all"
        onYearFilterChange={vi.fn()}
        yearOptions={[]}
      />,
    );

    expect(screen.getByRole('tab', { name: '国际' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '全部' })).toHaveAttribute('aria-selected', 'false');
  });
});
