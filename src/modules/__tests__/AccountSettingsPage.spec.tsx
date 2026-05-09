import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  changeAccountPassword,
  fetchAccountSessions,
  fetchAccountSettings,
  logoutAllAccountSessions,
  revokeAccountSession,
  updateAccountProfile,
} from '../../lib/api/accountSettingsApi';
import { remoteTravelStoreRepository } from '../../lib/repositories/remoteTravelStoreRepository';
import type { AccountSessionsResponseDto, AccountSettingsDto } from '../../lib/api/types';
import type { TravelStore } from '../../types';
import AccountSettingsPage from '../settings/AccountSettingsPage';

vi.mock('../../components/DataSync', () => ({
  default: () => <div data-testid="data-sync">数据导出</div>,
}));

vi.mock('../../lib/api/accountSettingsApi', () => ({
  fetchAccountSettings: vi.fn(),
  updateAccountProfile: vi.fn(),
  changeAccountPassword: vi.fn(),
  fetchAccountSessions: vi.fn(),
  revokeAccountSession: vi.fn(),
  logoutAllAccountSessions: vi.fn(),
}));

vi.mock('../../lib/repositories/remoteTravelStoreRepository', () => ({
  remoteTravelStoreRepository: {
    loadStore: vi.fn(),
  },
}));

const account = {
  id: 'acct-1',
  name: 'Voyage Atlas',
  username: 'demo',
  role: 'admin' as const,
};

const settingsResponse: AccountSettingsDto = {
  account,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-02T00:00:00.000Z',
};

const sessionsResponse: AccountSessionsResponseDto = {
  sessions: [
    {
      id: 'session-current',
      isCurrent: true,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      deviceLabel: 'Mac 浏览器',
      ipAddress: '127.0.0.1',
      createdAt: '2026-05-01T00:00:00.000Z',
      lastSeenAt: '2026-05-08T00:00:00.000Z',
      expiresAt: '2026-05-15T00:00:00.000Z',
    },
    {
      id: 'session-other',
      isCurrent: false,
      userAgent: 'Mozilla/5.0 (iPhone)',
      deviceLabel: 'iOS 设备',
      createdAt: '2026-05-03T00:00:00.000Z',
      lastSeenAt: '2026-05-07T00:00:00.000Z',
      expiresAt: '2026-05-14T00:00:00.000Z',
    },
  ],
};

const store: TravelStore = {
  users: [{ id: 'user-1', name: '小悠', color: '#2563eb' }],
  markers: [],
  activeUserId: 'user-1',
  savedGuides: [],
  guideSearchHistory: [],
};

function renderPage() {
  return render(
    <AccountSettingsPage
      account={account}
      onAccountUpdated={vi.fn()}
      onLogout={vi.fn()}
      onLoggedOut={vi.fn()}
      onNavigateBack={vi.fn()}
    />,
  );
}

describe('AccountSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchAccountSettings).mockResolvedValue(settingsResponse);
    vi.mocked(fetchAccountSessions).mockResolvedValue(sessionsResponse);
    vi.mocked(remoteTravelStoreRepository.loadStore).mockResolvedValue(store);
    vi.mocked(updateAccountProfile).mockResolvedValue({
      ...settingsResponse,
      account: { ...account, name: '新的旅行档案' },
    });
    vi.mocked(changeAccountPassword).mockResolvedValue({ success: true });
    vi.mocked(revokeAccountSession).mockResolvedValue({ success: true });
    vi.mocked(logoutAllAccountSessions).mockResolvedValue({ success: true });
  });

  it('renders account settings, sessions, and data export', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: '账号设置' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Voyage Atlas')).toBeInTheDocument();
    expect(screen.getByText('Mac 浏览器')).toBeInTheDocument();
    expect(screen.getByText('iOS 设备')).toBeInTheDocument();
    expect(screen.getByTestId('data-sync')).toBeInTheDocument();
  });

  it('updates account profile and shows toast', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = await screen.findByDisplayValue('Voyage Atlas');
    await user.clear(input);
    await user.type(input, '新的旅行档案');
    await user.click(screen.getByRole('button', { name: '保存昵称' }));

    expect(updateAccountProfile).toHaveBeenCalledWith({ name: '新的旅行档案' });
    expect(await screen.findByText('昵称已更新')).toBeInTheDocument();
  });

  it('changes password and clears inputs on success', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('heading', { name: '账号设置' });
    await user.type(screen.getByLabelText('当前密码'), 'old-password');
    await user.type(screen.getByLabelText('新密码'), 'new-password');
    await user.type(screen.getByLabelText('确认新密码'), 'new-password');
    await user.click(screen.getByRole('button', { name: '更新密码' }));

    expect(changeAccountPassword).toHaveBeenCalledWith({
      currentPassword: 'old-password',
      nextPassword: 'new-password',
    });
    expect(await screen.findByText('密码已更新')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('当前密码')).toHaveValue(''));
  });

  it('shows error toast when current password is invalid', async () => {
    vi.mocked(changeAccountPassword).mockRejectedValueOnce(new Error('current password is invalid'));
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('heading', { name: '账号设置' });
    await user.type(screen.getByLabelText('当前密码'), 'wrong-password');
    await user.type(screen.getByLabelText('新密码'), 'new-password');
    await user.type(screen.getByLabelText('确认新密码'), 'new-password');
    await user.click(screen.getByRole('button', { name: '更新密码' }));

    expect(await screen.findByText('current password is invalid')).toBeInTheDocument();
  });

  it('revokes other sessions and logs out all sessions', async () => {
    const onLoggedOut = vi.fn();
    const user = userEvent.setup();
    render(
      <AccountSettingsPage
        account={account}
        onAccountUpdated={vi.fn()}
        onLogout={vi.fn()}
        onLoggedOut={onLoggedOut}
        onNavigateBack={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole('button', { name: '退出设备' }));
    expect(revokeAccountSession).toHaveBeenCalledWith('session-other');
    expect(await screen.findByText('设备已退出')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '退出全部设备' }));
    expect(logoutAllAccountSessions).toHaveBeenCalled();
    expect(onLoggedOut).toHaveBeenCalled();
  });
});
