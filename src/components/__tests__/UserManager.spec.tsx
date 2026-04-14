import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserManager from '../UserManager';

const users = [
  { id: 'u1', name: '小悠', color: '#2563eb' },
  { id: 'u2', name: '阿泽', color: '#f97316' },
];

describe('UserManager', () => {
  it('switches active user through chip click', async () => {
    const onSwitch = vi.fn();
    render(
      <UserManager
        users={users}
        activeUserId="u1"
        onSwitch={onSwitch}
        onCreate={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /阿泽/ }));
    expect(onSwitch).toHaveBeenCalledWith('u2');
  });

  it('creates a new user with selected color', async () => {
    const onCreate = vi.fn();
    render(
      <UserManager
        users={users}
        activeUserId="u1"
        onSwitch={() => {}}
        onCreate={onCreate}
      />,
    );

    await userEvent.type(screen.getByPlaceholderText('例如：家人、朋友、小队'), '同事');
    await userEvent.click(screen.getByRole('button', { name: '添加用户' }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '同事',
        color: expect.any(String),
      }),
    );
  });
});
