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
import {
  createPrivateShareLink,
  listPrivateShareLinks,
  revokePrivateShareLink,
} from '../../lib/api/shareLinksApi';
import { fetchReminders, muteReminderType, unmuteReminderType } from '../../lib/api/remindersApi';
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

vi.mock('../../lib/api/shareLinksApi', () => ({
  listPrivateShareLinks: vi.fn(),
  createPrivateShareLink: vi.fn(),
  revokePrivateShareLink: vi.fn(),
}));

vi.mock('../../lib/api/remindersApi', () => ({
  fetchReminders: vi.fn(),
  muteReminderType: vi.fn(),
  unmuteReminderType: vi.fn(),
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
  preference: {
    locale: 'zh-CN',
    mapStyle: 'magazine',
    defaultCurrency: 'CNY',
    commonCurrencies: ['CNY', 'JPY', 'USD', 'EUR'],
    exchangeRateSource: 'exchangerate-host',
  },
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
    vi.mocked(listPrivateShareLinks).mockResolvedValue({
      links: [
        {
          id: 'share-1',
          resourceType: 'memory_capsule',
          resourceId: 'capsule-1',
          title: '京都胶囊',
          status: 'active',
          tokenPreview: 'abcd1234',
          passwordProtected: true,
          accessCount: 2,
          createdAt: '2026-05-12T00:00:00.000Z',
          updatedAt: '2026-05-12T00:00:00.000Z',
        },
      ],
    });
    vi.mocked(remoteTravelStoreRepository.loadStore).mockResolvedValue(store);
    vi.mocked(fetchReminders).mockResolvedValue({
      reminders: [],
      preferences: [{ type: 'planning_overdue', enabled: true }],
      summary: {
        totalCount: 0,
        activeCount: 0,
        mutedCount: 0,
        resolvedCount: 0,
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
      },
      generatedAt: '2026-05-12T00:00:00.000Z',
    });
    vi.mocked(muteReminderType).mockResolvedValue({
      success: true,
      preference: { type: 'planning_overdue', enabled: true, mutedUntil: '2026-05-19T00:00:00.000Z' },
    });
    vi.mocked(unmuteReminderType).mockResolvedValue({
      success: true,
      preference: { type: 'planning_overdue', enabled: true },
    });
    vi.mocked(updateAccountProfile).mockResolvedValue({
      ...settingsResponse,
      account: { ...account, name: '新的旅行档案' },
    });
    vi.mocked(changeAccountPassword).mockResolvedValue({ success: true });
    vi.mocked(revokeAccountSession).mockResolvedValue({ success: true });
    vi.mocked(logoutAllAccountSessions).mockResolvedValue({ success: true });
    vi.mocked(createPrivateShareLink).mockResolvedValue({
      link: {
        id: 'share-2',
        resourceType: 'annual_review',
        resourceId: '2026',
        title: '2026 年度回顾',
        status: 'active',
        url: '/share/raw-share-token-123',
        tokenPreview: 'token123',
        passwordProtected: false,
        accessCount: 0,
        createdAt: '2026-05-12T00:00:00.000Z',
        updatedAt: '2026-05-12T00:00:00.000Z',
      },
    });
    vi.mocked(revokePrivateShareLink).mockResolvedValue({
      link: {
        id: 'share-1',
        resourceType: 'memory_capsule',
        resourceId: 'capsule-1',
        title: '京都胶囊',
        status: 'revoked',
        tokenPreview: 'abcd1234',
        passwordProtected: true,
        accessCount: 2,
        createdAt: '2026-05-12T00:00:00.000Z',
        updatedAt: '2026-05-12T00:00:00.000Z',
        revokedAt: '2026-05-12T01:00:00.000Z',
      },
    });
  });

  it('renders account settings, sessions, and data export', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: '账号设置' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Voyage Atlas')).toBeInTheDocument();
    expect(screen.getByText('Mac 浏览器')).toBeInTheDocument();
    expect(screen.getByText('iOS 设备')).toBeInTheDocument();
    expect(screen.getByText('京都胶囊')).toBeInTheDocument();
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

  it('creates and revokes private share links', async () => {
    const user = userEvent.setup();
    vi.mocked(revokePrivateShareLink).mockResolvedValueOnce({
      link: {
        id: 'share-2',
        resourceType: 'annual_review',
        resourceId: '2026',
        title: '2026 年度回顾',
        status: 'revoked',
        tokenPreview: 'token123',
        passwordProtected: false,
        accessCount: 0,
        createdAt: '2026-05-12T00:00:00.000Z',
        updatedAt: '2026-05-12T00:00:00.000Z',
        revokedAt: '2026-05-12T01:00:00.000Z',
      },
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    renderPage();

    await screen.findByText('京都胶囊');
    await user.selectOptions(screen.getByLabelText('类型'), 'annual_review');
    await user.type(screen.getByLabelText('资源 ID'), '2026');
    await user.type(screen.getByLabelText('标题'), '2026 年度回顾');
    await user.click(screen.getByRole('button', { name: '创建分享链接' }));

    expect(createPrivateShareLink).toHaveBeenCalledWith({
      resourceType: 'annual_review',
      resourceId: '2026',
      title: '2026 年度回顾',
      expiresAt: undefined,
      password: undefined,
      maxAccessCount: undefined,
    });
    expect(await screen.findByText('分享链接已创建并复制')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: '撤销链接' })[0]);
    expect(revokePrivateShareLink).toHaveBeenCalledWith('share-2');
  });
});
