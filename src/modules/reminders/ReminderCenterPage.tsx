import { useEffect, useMemo, useState } from 'react';
import AppToast, { type AppToastTone } from '../../components/ui/AppToast';
import {
  fetchReminders,
  muteReminderType,
  resolveReminder,
  unmuteReminderType,
} from '../../lib/api/remindersApi';
import type { ReminderDto, ReminderListResponseDto, ReminderPreferenceDto } from '../../lib/api/types';
import type { AuthAccount } from '../../types';
import {
  formatReminderDate,
  getReminderPreferenceLabel,
  getReminderStatusLabel,
  REMINDER_SEVERITY_LABELS,
  REMINDER_TYPE_LABELS,
  sortReminders,
} from './reminderModel';

interface ReminderCenterPageProps {
  account: AuthAccount;
  onLogout: () => Promise<void> | void;
  onNavigateBack: () => void;
  onNavigateToPath: (path: string) => void;
}

export default function ReminderCenterPage({
  account,
  onLogout,
  onNavigateBack,
  onNavigateToPath,
}: ReminderCenterPageProps) {
  const [payload, setPayload] = useState<ReminderListResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: AppToastTone } | null>(null);

  const showToast = (message: string, tone: AppToastTone = 'info') => setToast({ message, tone });

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const loadReminders = async () => {
    const response = await fetchReminders();
    setPayload(response);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchReminders()
      .then((response) => {
        if (!cancelled) setPayload(response);
      })
      .catch((error) => {
        if (!cancelled) showToast(error instanceof Error ? error.message : '提醒加载失败', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reminders = useMemo(() => sortReminders(payload?.reminders ?? []), [payload?.reminders]);

  const handleResolve = async (reminder: ReminderDto) => {
    setBusyKey(reminder.fingerprint);
    try {
      await resolveReminder(reminder.fingerprint);
      await loadReminders();
      showToast('提醒已标记为已处理', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '处理提醒失败', 'error');
    } finally {
      setBusyKey('');
    }
  };

  const handleMuteType = async (preference: ReminderPreferenceDto) => {
    setBusyKey(preference.type);
    try {
      if (preference.mutedUntil) {
        await unmuteReminderType(preference.type);
        showToast('已恢复该类型提醒', 'success');
      } else {
        await muteReminderType(preference.type);
        showToast('已静音 7 天', 'success');
      }
      await loadReminders();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '更新提醒偏好失败', 'error');
    } finally {
      setBusyKey('');
    }
  };

  return (
    <main className="reminder-shell">
      <header className="reminder-topbar">
        <button type="button" className="ghost-button" onClick={onNavigateBack}>
          返回首页
        </button>
        <button type="button" className="ghost-button" onClick={onLogout}>
          退出登录
        </button>
      </header>

      <section className="reminder-hero">
        <span className="hero-kicker">提醒中心</span>
        <h1>低打扰旅行运营提醒</h1>
        <p>@{account.username} · 聚合过期规划、缺失信息、登录风险和攻略来源异常。</p>
      </section>

      {loading ? <div className="reminder-empty">正在生成提醒...</div> : null}

      {!loading && payload ? (
        <>
          <section className="reminder-summary-strip">
            <SummaryItem label="待处理" value={payload.summary.activeCount} />
            <SummaryItem label="严重" value={payload.summary.criticalCount} />
            <SummaryItem label="已静音" value={payload.summary.mutedCount} />
            <SummaryItem label="已处理" value={payload.summary.resolvedCount} />
          </section>

          <section className="reminder-layout">
            <div className="reminder-list">
              {reminders.length > 0 ? (
                reminders.map((reminder) => (
                  <article key={reminder.fingerprint} className={`reminder-entry is-${reminder.severity}`}>
                    <div className="reminder-entry-main">
                      <div className="reminder-entry-meta">
                        <span>{REMINDER_TYPE_LABELS[reminder.type]}</span>
                        <span>{REMINDER_SEVERITY_LABELS[reminder.severity]}</span>
                        <span>{getReminderStatusLabel(reminder)}</span>
                      </div>
                      <h2>{reminder.title}</h2>
                      <p>{reminder.description}</p>
                      <div className="reminder-entry-footnote">
                        <span>{reminder.targetLabel}</span>
                        <span>发现于 {formatReminderDate(reminder.detectedAt)}</span>
                        <span>{reminder.suggestedAction}</span>
                      </div>
                    </div>
                    <div className="reminder-entry-actions">
                      {reminder.navigation.canNavigate && reminder.navigation.path ? (
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => onNavigateToPath(reminder.navigation.path!)}
                        >
                          跳转定位
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="ghost-button"
                        disabled={busyKey === reminder.fingerprint || reminder.status === 'resolved'}
                        onClick={() => handleResolve(reminder)}
                      >
                        标记已处理
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="reminder-empty">暂无提醒，当前旅行档案状态良好。</div>
              )}
            </div>

            <aside className="reminder-preferences">
              <div className="reminder-section-title">
                <h2>类型静音</h2>
                <p>静音只影响当前账号，不会关闭后台质量巡检。</p>
              </div>
              {payload.preferences.map((preference) => (
                <button
                  key={preference.type}
                  type="button"
                  className="reminder-preference-row"
                  disabled={busyKey === preference.type}
                  onClick={() => handleMuteType(preference)}
                >
                  <strong>{REMINDER_TYPE_LABELS[preference.type]}</strong>
                  <span>{getReminderPreferenceLabel(preference)}</span>
                </button>
              ))}
            </aside>
          </section>
        </>
      ) : null}

      <AppToast open={!!toast} message={toast?.message ?? ''} tone={toast?.tone} />
    </main>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
