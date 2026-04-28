import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FancySelect from '../ui/FancySelect';

describe('FancySelect', () => {
  it('allows selecting options when rendered through a portal', async () => {
    const onChange = vi.fn();

    render(
      <FancySelect
        value="pre_departure"
        options={[
          { value: 'pre_departure', label: '出发前准备' },
          { value: 'in_transit', label: '旅途中留意' },
          { value: 'done', label: '已经完成' },
        ]}
        onChange={onChange}
        placeholder="选择阶段"
        ariaLabel="选择阶段"
        usePortal
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '选择阶段' }));
    await userEvent.click(screen.getByRole('button', { name: '旅途中留意' }));

    expect(onChange).toHaveBeenCalledWith('in_transit');
  });
});
