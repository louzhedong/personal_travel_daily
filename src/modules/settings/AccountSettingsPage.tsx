import { useEffect, useMemo, useState, type FormEvent } from 'react';
import AppToast, { type AppToastTone } from '../../components/ui/AppToast';
import DataSync from '../../components/DataSync';
import type { AccountSessionDto, AccountSettingsDto } from '../../lib/api/types';
import { remoteTravelStoreRepository } from '../../lib/repositories/remoteTravelStoreRepository';
import {
  changeAccountPassword,
  fetchAccountSessions,
  fetchAccountSettings,
  logoutAllAccountSessions,
  revokeAccountSession,
  updateAccountProfile,
} from '../../lib/api/accountSettingsApi';
import type { AuthAccount, TravelStore } from '../../types';
import { formatSettingsDate, getRoleLabel, splitSessions } from './accountSettingsPageModel';

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
  const [store, setStore] = useState<TravelStore | null>(null);
  const [name, setName] = useState(account.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    const [settingsResponse, sessionsResponse, storeResponse] = await Promise.all([
      fetchAccountSettings(),
      fetchAccountSessions(),
      remoteTravelStoreRepository.loadStore(),
    ]);
    setSettings(settingsResponse);
    setName(settingsResponse.account.name);
    onAccountUpdated(settingsResponse.account);
    setSessions(sessionsResponse.sessions);
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
