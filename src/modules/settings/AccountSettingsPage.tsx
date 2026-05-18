import { useEffect, useMemo, useState, type FormEvent } from 'react';
import AppToast, { type AppToastTone } from '../../components/ui/AppToast';
import DataSync from '../../components/DataSync';
import type {
  AccountSessionDto,
  AccountSettingsDto,
  PrivateShareLinkDto,
  PrivateShareResourceTypeDto,
  ReminderPreferenceDto,
} from '../../lib/api/types';
import { remoteTravelStoreRepository } from '../../lib/repositories/remoteTravelStoreRepository';
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
import type { AuthAccount, TravelStore } from '../../types';
import { formatSettingsDate, getRoleLabel, splitSessions } from './accountSettingsPageModel';
import { getReminderPreferenceLabel, REMINDER_TYPE_LABELS } from '../reminders/reminderModel';

interface AccountSettingsPageProps {
  account: AuthAccount;
  onAccountUpdated: (account: AuthAccount) => void;
  onLogout: () => Promise<void> | void;
  onLoggedOut: () => void;
  onNavigateBack: () => void;
}

export default function AccountSettingsPage({
  account,
  onAccountUpdated,
  onLogout,
  onLoggedOut,
  onNavigateBack,
}: AccountSettingsPageProps) {
  const [settings, setSettings] = useState<AccountSettingsDto | null>(null);
  const [sessions, setSessions] = useState<AccountSessionDto[]>([]);
  const [shareLinks, setShareLinks] = useState<PrivateShareLinkDto[]>([]);
  const [reminderPreferences, setReminderPreferences] = useState<ReminderPreferenceDto[]>([]);
  const [store, setStore] = useState<TravelStore | null>(null);
  const [name, setName] = useState(account.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shareResourceType, setShareResourceType] = useState<PrivateShareResourceTypeDto>('memory_capsule');
  const [shareResourceId, setShareResourceId] = useState('');
  const [shareTitle, setShareTitle] = useState('');
  const [shareExpiresAt, setShareExpiresAt] = useState('');
  const [sharePassword, setSharePassword] = useState('');
  const [shareMaxAccessCount, setShareMaxAccessCount] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: AppToastTone } | null>(null);

  const sessionGroups = useMemo(() => splitSessions(sessions), [sessions]);

  const showToast = (message: string, tone: AppToastTone = 'info') => {
    setToast({ message, tone });
  };

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const loadSettings = async () => {
    const [settingsResponse, sessionsResponse, shareLinksResponse, reminderResponse, storeResponse] = await Promise.all([
      fetchAccountSettings(),
      fetchAccountSessions(),
      listPrivateShareLinks(),
      fetchReminders(),
      remoteTravelStoreRepository.loadStore(),
    ]);
    setSettings(settingsResponse);
    setName(settingsResponse.account.name);
    onAccountUpdated(settingsResponse.account);
    setSessions(sessionsResponse.sessions);
    setShareLinks(shareLinksResponse.links);
    setReminderPreferences(reminderResponse.preferences);
    setStore(storeResponse);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    loadSettings()
      .catch((error) => {
        if (!cancelled) {
          showToast(error instanceof Error ? error.message : '账号设置加载失败', 'error');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName || nextName === settings?.account.name) {
      return;
    }

    setBusy(true);
    try {
      const response = await updateAccountProfile({ name: nextName });
      setSettings(response);
      setName(response.account.name);
      onAccountUpdated(response.account);
      showToast('昵称已更新', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '昵称更新失败', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (nextPassword !== confirmPassword) {
      showToast('两次输入的密码不一致', 'error');
      return;
    }

    setBusy(true);
    try {
      await changeAccountPassword({ currentPassword, nextPassword });
      setCurrentPassword('');
      setNextPassword('');
      setConfirmPassword('');
      await loadSettings();
      showToast('密码已更新', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '密码更新失败', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setBusy(true);
    try {
      await revokeAccountSession(sessionId);
      const response = await fetchAccountSessions();
      setSessions(response.sessions);
      showToast('设备已退出', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '设备退出失败', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleLogoutAll = async () => {
    setBusy(true);
    try {
      await logoutAllAccountSessions();
      showToast('已退出全部设备', 'success');
      onLoggedOut();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '退出全部设备失败', 'error');
      setBusy(false);
    }
  };

  const handleCreateShareLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shareResourceId.trim()) {
      showToast('请填写资源 ID', 'error');
      return;
    }

    setBusy(true);
    try {
      const response = await createPrivateShareLink({
        resourceType: shareResourceType,
        resourceId: shareResourceId.trim(),
        title: shareTitle.trim() || undefined,
        expiresAt: shareExpiresAt ? new Date(shareExpiresAt).toISOString() : undefined,
        password: sharePassword || undefined,
        maxAccessCount: shareMaxAccessCount ? Number(shareMaxAccessCount) : undefined,
      });
      setShareLinks((current) => [response.link, ...current]);
      if (response.link.url) {
        await navigator.clipboard?.writeText(`${window.location.origin}${response.link.url}`);
      }
      setShareResourceId('');
      setShareTitle('');
      setShareExpiresAt('');
      setSharePassword('');
      setShareMaxAccessCount('');
      showToast(response.link.url ? '分享链接已创建并复制' : '分享链接已创建', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '分享链接创建失败', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeShareLink = async (linkId: string) => {
    setBusy(true);
    try {
      const response = await revokePrivateShareLink(linkId);
      setShareLinks((current) => current.map((link) => (link.id === linkId ? response.link : link)));
      showToast('分享链接已撤销', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '分享链接撤销失败', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleReminderMute = async (preference: ReminderPreferenceDto) => {
    setBusy(true);
    try {
      if (preference.mutedUntil) {
        await unmuteReminderType(preference.type);
        showToast('已恢复该类型提醒', 'success');
      } else {
        await muteReminderType(preference.type);
        showToast('已静音 7 天', 'success');
      }
      const response = await fetchReminders();
      setReminderPreferences(response.preferences);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '提醒偏好更新失败', 'error');
    } finally {
      setBusy(false);
    }
  };

  const createdAt = settings?.createdAt ? formatSettingsDate(settings.createdAt) : '—';
  const updatedAt = settings?.updatedAt ? formatSettingsDate(settings.updatedAt) : '—';

  return (
    <main className="account-settings-shell">
      <header className="account-settings-topbar">
        <button type="button" className="ghost-button" onClick={onNavigateBack}>
          返回首页
        </button>
        <button type="button" className="ghost-button" onClick={onLogout}>
          退出登录
        </button>
      </header>

      <section className="account-settings-hero">
        <span>账号</span>
        <h1>账号设置</h1>
        <p>{account.username}</p>
      </section>

      {loading ? <div className="account-settings-empty">正在加载账号设置...</div> : null}

      {!loading ? (
        <div className="account-settings-layout">
          <section className="account-settings-section account-settings-profile">
            <div className="account-settings-section-title">
              <h2>资料</h2>
              <p>{getRoleLabel(account.role)} · 创建于 {createdAt} · 更新于 {updatedAt}</p>
            </div>

            <form className="account-settings-form" onSubmit={handleProfileSubmit}>
              <label className="account-settings-field">
                <span>昵称</span>
                <input value={name} onChange={(event) => setName(event.target.value)} disabled={busy} />
              </label>
              <button type="submit" className="primary-button" disabled={busy || name.trim() === settings?.account.name}>
                保存昵称
              </button>
            </form>
          </section>

          <section className="account-settings-section account-settings-reminders">
            <div className="account-settings-section-title">
              <h2>提醒偏好</h2>
              <p>按类型静音应用内提醒，保留后台巡检与数据生成。</p>
            </div>
            <div className="account-settings-reminder-list">
              {reminderPreferences.map((preference) => (
                <button
                  key={preference.type}
                  type="button"
                  className="account-settings-reminder-row"
                  disabled={busy}
                  onClick={() => handleToggleReminderMute(preference)}
                >
                  <strong>{REMINDER_TYPE_LABELS[preference.type]}</strong>
                  <span>{getReminderPreferenceLabel(preference)}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="account-settings-section">
            <div className="account-settings-section-title">
              <h2>密码</h2>
            </div>

            <form className="account-settings-form" onSubmit={handlePasswordSubmit}>
              <label className="account-settings-field">
                <span>当前密码</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  disabled={busy}
                />
              </label>
              <label className="account-settings-field">
                <span>新密码</span>
                <input
                  type="password"
                  value={nextPassword}
                  onChange={(event) => setNextPassword(event.target.value)}
                  disabled={busy}
                />
              </label>
              <label className="account-settings-field">
                <span>确认新密码</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={busy}
                />
              </label>
              <button type="submit" className="primary-button" disabled={busy || !currentPassword || !nextPassword}>
                更新密码
              </button>
            </form>
          </section>

          <section className="account-settings-section account-settings-sessions">
            <div className="account-settings-section-title account-settings-row-title">
              <div>
                <h2>会话</h2>
                <p>当前设备与其他登录设备</p>
              </div>
              <button type="button" className="ghost-button" onClick={handleLogoutAll} disabled={busy}>
                退出全部设备
              </button>
            </div>

            <SessionRow session={sessionGroups.current} current />
            {sessionGroups.others.length > 0 ? (
              <div className="account-settings-session-list">
                {sessionGroups.others.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    disabled={busy}
                    onRevoke={() => handleRevokeSession(session.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="account-settings-empty">暂无其他设备</div>
            )}
          </section>

          <section className="account-settings-section account-settings-shares">
            <div className="account-settings-section-title">
              <h2>私密分享</h2>
              <p>为故事、年度、旅伴回忆和胶囊创建可撤销的只读链接</p>
            </div>
            <div className="account-settings-share-panel">
              <form className="account-settings-share-form" onSubmit={handleCreateShareLink}>
                <label className="account-settings-field">
                  <span>类型</span>
                  <select
                    value={shareResourceType}
                    onChange={(event) => setShareResourceType(event.target.value as PrivateShareResourceTypeDto)}
                    disabled={busy}
                  >
                    <option value="trip_story">行程故事</option>
                    <option value="annual_review">年度回顾</option>
                    <option value="companion_memory">旅伴回忆</option>
                    <option value="memory_capsule">旅行胶囊</option>
                  </select>
                </label>
                <label className="account-settings-field">
                  <span>资源 ID</span>
                  <input
                    value={shareResourceId}
                    placeholder="tripId / 年份 / companionId / capsuleId"
                    onChange={(event) => setShareResourceId(event.target.value)}
                    disabled={busy}
                  />
                </label>
                <label className="account-settings-field">
                  <span>标题</span>
                  <input
                    value={shareTitle}
                    placeholder="留空则自动生成"
                    onChange={(event) => setShareTitle(event.target.value)}
                    disabled={busy}
                  />
                </label>
                <label className="account-settings-field">
                  <span>过期时间</span>
                  <input
                    type="datetime-local"
                    value={shareExpiresAt}
                    onChange={(event) => setShareExpiresAt(event.target.value)}
                    disabled={busy}
                  />
                </label>
                <label className="account-settings-field">
                  <span>访问密码</span>
                  <input
                    type="password"
                    value={sharePassword}
                    placeholder="可选"
                    onChange={(event) => setSharePassword(event.target.value)}
                    disabled={busy}
                  />
                </label>
                <label className="account-settings-field">
                  <span>访问上限</span>
                  <input
                    type="number"
                    min="1"
                    value={shareMaxAccessCount}
                    placeholder="可选"
                    onChange={(event) => setShareMaxAccessCount(event.target.value)}
                    disabled={busy}
                  />
                </label>
                <button type="submit" className="primary-button" disabled={busy || !shareResourceId.trim()}>
                  创建分享链接
                </button>
              </form>

              <div className="account-settings-share-list">
                {shareLinks.length > 0 ? (
                  shareLinks.map((link) => (
                    <ShareLinkRow
                      key={link.id}
                      link={link}
                      disabled={busy}
                      onRevoke={() => handleRevokeShareLink(link.id)}
                    />
                  ))
                ) : (
                  <div className="account-settings-empty">暂无分享链接</div>
                )}
              </div>
            </div>
          </section>

          <section className="account-settings-section">
            <div className="account-settings-section-title">
              <h2>数据导出</h2>
            </div>
            {store ? <DataSync store={store} variant="panel" /> : <div className="account-settings-empty">暂无快照</div>}
          </section>
        </div>
      ) : null}

      <AppToast open={!!toast} message={toast?.message ?? ''} tone={toast?.tone} />
    </main>
  );
}

function SessionRow({
  session,
  current = false,
  disabled,
  onRevoke,
}: {
  session?: AccountSessionDto;
  current?: boolean;
  disabled?: boolean;
  onRevoke?: () => void;
}) {
  if (!session) {
    return <div className="account-settings-empty">暂无当前会话</div>;
  }

  return (
    <article className={current ? 'account-settings-session is-current' : 'account-settings-session'}>
      <div>
        <div className="account-settings-session-title">
          <strong>{session.deviceLabel}</strong>
          {current ? <span>当前设备</span> : null}
        </div>
        <p>{session.userAgent ?? '未知浏览器'}</p>
        <div className="account-settings-session-meta">
          {session.ipAddress ? <span>{session.ipAddress}</span> : null}
          <span>最近活跃 {formatSettingsDate(session.lastSeenAt)}</span>
          <span>过期 {formatSettingsDate(session.expiresAt)}</span>
        </div>
      </div>
      {!current && onRevoke ? (
        <button type="button" className="ghost-button" onClick={onRevoke} disabled={disabled}>
          退出设备
        </button>
      ) : null}
    </article>
  );
}

const SHARE_RESOURCE_LABELS: Record<PrivateShareResourceTypeDto, string> = {
  trip_story: '行程故事',
  annual_review: '年度回顾',
  companion_memory: '旅伴回忆',
  memory_capsule: '旅行胶囊',
};

const SHARE_STATUS_LABELS: Record<PrivateShareLinkDto['status'], string> = {
  active: '有效',
  expired: '已过期',
  revoked: '已撤销',
  depleted: '已用尽',
};

function ShareLinkRow({
  link,
  disabled,
  onRevoke,
}: {
  link: PrivateShareLinkDto;
  disabled?: boolean;
  onRevoke: () => void;
}) {
  return (
    <article className={`account-settings-share-link is-${link.status}`}>
      <div>
        <div className="account-settings-session-title">
          <strong>{link.title}</strong>
          <span>{SHARE_STATUS_LABELS[link.status]}</span>
          {link.passwordProtected ? <span>密码保护</span> : null}
        </div>
        <p>
          {SHARE_RESOURCE_LABELS[link.resourceType]} · {link.resourceId} · token ...{link.tokenPreview}
        </p>
        <div className="account-settings-session-meta">
          <span>访问 {link.accessCount}{link.maxAccessCount ? ` / ${link.maxAccessCount}` : ''}</span>
          {link.expiresAt ? <span>过期 {formatSettingsDate(link.expiresAt)}</span> : <span>长期有效</span>}
          {link.lastAccessedAt ? <span>最近访问 {formatSettingsDate(link.lastAccessedAt)}</span> : null}
        </div>
      </div>
      {link.status !== 'revoked' ? (
        <button type="button" className="ghost-button" onClick={onRevoke} disabled={disabled}>
          撤销链接
        </button>
      ) : null}
    </article>
  );
}
