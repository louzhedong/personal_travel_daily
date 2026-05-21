import { useEffect, useState, type FormEvent } from 'react';
import type { AuthAccount } from '../../types';
import type { GuideSubscriptionsResponseDto } from '../../lib/api/types';
import { createGuideSubscription, fetchGuideSubscriptions, runGuideSubscription } from '../../lib/api/guideSubscriptionsApi';
import { getGuideSubscriptionLabel } from './guideSubscriptionModel';
import { FancySelect } from '../../components/ui/FancySelect';

interface GuideSubscriptionsPageProps {
  account: AuthAccount;
  onNavigateBack: () => void;
  onLogout: () => Promise<void> | void;
}

const KIND_OPTIONS = [
  { value: 'keyword', label: '关键词' },
  { value: 'destination', label: '目的地' },
  { value: 'source', label: '来源' },
  { value: 'rss', label: 'RSS' },
];

export default function GuideSubscriptionsPage({ account, onNavigateBack, onLogout }: GuideSubscriptionsPageProps) {
  const [data, setData] = useState<GuideSubscriptionsResponseDto | null>(null);
  const [title, setTitle] = useState('京都咖啡地图');
  const [kind, setKind] = useState<'keyword' | 'destination' | 'source' | 'rss'>('keyword');
  const [rssUrl, setRssUrl] = useState('');
  const [runningId, setRunningId] = useState('');
  const [statusText, setStatusText] = useState('订阅会去重保存最近命中，并可回流提醒中心。');

  const load = () => fetchGuideSubscriptions().then(setData).catch(() => {
    setStatusText('订阅数据暂时不可用。');
    setData({ subscriptions: [], recentItems: [] });
  });
  useEffect(() => { void load(); }, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    await createGuideSubscription({
      kind: rssUrl ? 'rss' : kind,
      title,
      keyword: kind === 'keyword' && !rssUrl ? title : undefined,
      destination: kind === 'destination' ? title : undefined,
      sourceName: kind === 'source' ? title : undefined,
      rssUrl: rssUrl || undefined,
    });
    setRssUrl('');
    setStatusText('订阅已创建。');
    await load();
  };

  const handleRun = async (id: string) => {
    setRunningId(id);
    setStatusText('正在刷新订阅源。');
    try {
      const response = await runGuideSubscription(id);
      setStatusText(`刷新完成：新增或命中 ${response.items.length} 条。`);
      await load();
    } catch {
      setStatusText('刷新失败，请检查 RSS URL 或网络。');
    } finally {
      setRunningId('');
    }
  };

  return (
    <main className="guide-subscription-shell">
      <div className="guide-subscription-topbar">
        <button className="ghost-button" onClick={onNavigateBack}>返回</button>
        <button className="ghost-button" onClick={() => void onLogout()}>退出登录</button>
      </div>
      <section className="guide-subscription-hero">
        <span className="hero-kicker">Guide Signals · @{account.username}</span>
        <h1>攻略订阅</h1>
        <p>订阅目的地、来源或 RSS，把搜索升级为持续推送。</p>
        <small aria-live="polite">{statusText}</small>
      </section>

      <form className="guide-subscription-panel" onSubmit={handleCreate}>
        <label>
          <span>订阅类型</span>
          <FancySelect
            value={kind}
            options={KIND_OPTIONS}
            onChange={(value) => setKind(value as typeof kind)}
            placeholder="请选择类型"
            ariaLabel="订阅类型"
          />
        </label>
        <label>
          <span>订阅标题</span>
          <input
            className="field-control"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          <span>RSS URL（可选）</span>
          <input
            className="field-control"
            value={rssUrl}
            onChange={(event) => setRssUrl(event.target.value)}
            placeholder="https://"
          />
        </label>
        <div className="guide-subscription-form-actions">
          <button className="primary-button" type="submit">新增订阅</button>
        </div>
      </form>

      <section className="guide-subscription-grid">
        {(data?.subscriptions ?? []).map((item) => (
          <article key={item.id} className="guide-subscription-card">
            <span className="hero-kicker">{getGuideSubscriptionLabel(item)}</span>
            <h2>{item.title}</h2>
            <p>{item.keyword ?? item.rssUrl ?? item.destination ?? item.sourceName}</p>
            <small>{item.enabled ? '已启用' : '已暂停'} · 最近运行 {item.lastRunAt ? new Date(item.lastRunAt).toLocaleString('zh-CN') : '尚未运行'}</small>
            <button className="ghost-button" disabled={runningId === item.id} onClick={() => void handleRun(item.id)}>
              {runningId === item.id ? '刷新中' : '立即刷新'}
            </button>
          </article>
        ))}
      </section>

      <section className="guide-subscription-panel" aria-label="最近命中">
        <h2>最近命中</h2>
        {(data?.recentItems ?? []).map((item) => (
          <p key={item.id}>
            <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.title}</a>
            <small>{item.sourceName ?? 'Guide'} · {new Date(item.firstSeenAt).toLocaleString('zh-CN')}</small>
          </p>
        ))}
        {!data?.recentItems.length ? <p>刷新订阅后，命中项会出现在这里。</p> : null}
      </section>
    </main>
  );
}
