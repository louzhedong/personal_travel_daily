import { useCallback, useEffect, useState } from 'react';
import type { AuthAccount } from '../../types';
import {
  buildRhythmPortraitShareCardUrl,
  fetchRhythmPortrait,
  refreshRhythmPortrait,
} from '../../lib/api/rhythmPortraitApi';
import type { RhythmPortraitDto } from '../../lib/api/dto/rhythmPortrait';

/**
 * G5 · RhythmPortraitPage / 旅行节奏画像页面
 */
interface Props {
  account: AuthAccount;
  onLogout: () => Promise<void> | void;
  onNavigateBack: () => void;
}

const TIER_LABELS: Record<string, string> = {
  frugal: '俭朴',
  balanced: '平衡',
  comfort: '舒适',
  lavish: '盛装',
};

export default function RhythmPortraitPage({ account, onLogout, onNavigateBack }: Props) {
  const [portrait, setPortrait] = useState<RhythmPortraitDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRhythmPortrait();
      setPortrait(data);
      setError(null);
    } catch {
      setError('节奏画像加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = async () => {
    setBusy(true);
    try {
      const { portrait: next } = await refreshRhythmPortrait();
      setPortrait(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="rhythm-portrait-shell">
      <div className="journey-topbar">
        <button className="ghost-button" onClick={onNavigateBack}>返回</button>
        <button className="ghost-button" onClick={() => void onLogout()}>退出登录</button>
      </div>
      <section className="card panel-card">
        <span className="hero-kicker">Travel Rhythm Portrait · @{account.username}</span>
        <h1>旅行节奏画像</h1>
        <p>纯统计学拼出的旅行风格指纹：你偏好的月份、交通、主题与陪伴多样性。</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="primary-button" disabled={busy} onClick={() => void handleRefresh()}>重新生成</button>
          {portrait?.available ? (
            <a className="ghost-button" href={buildRhythmPortraitShareCardUrl()} target="_blank" rel="noreferrer">
              下载分享卡 (SVG)
            </a>
          ) : null}
        </div>
      </section>

      {loading ? <section className="card panel-card"><p>加载中…</p></section> : null}
      {error ? <section className="card panel-card"><p>{error}</p></section> : null}

      {portrait && !portrait.available ? (
        <section className="card panel-card">
          <h3>样本不足</h3>
          <p>当前窗口仅 {portrait.windowYearCount} 年的旅行数据，至少需 2 年的历史样本才能拟合稳定的指纹。</p>
        </section>
      ) : null}

      {portrait?.available ? (
        <>
          <section className="card panel-card">
            <h3>窗口 {portrait.windowYears}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div className="panel-card" style={{ padding: 12 }}>
                <small>预算档</small>
                <h2>{TIER_LABELS[portrait.budgetTier] ?? portrait.budgetTier}</h2>
              </div>
              <div className="panel-card" style={{ padding: 12 }}>
                <small>平均行程天数</small>
                <h2>{portrait.avgTripDays.toFixed(1)} 天</h2>
              </div>
              <div className="panel-card" style={{ padding: 12 }}>
                <small>同伴多样性指数</small>
                <h2>{portrait.companionDiversityIndex.toFixed(2)}</h2>
              </div>
              <div className="panel-card" style={{ padding: 12 }}>
                <small>旅行 / 标记</small>
                <h2>{portrait.totalTripCount} / {portrait.totalMarkerCount}</h2>
              </div>
            </div>
          </section>

          <section className="card panel-card">
            <h3>偏好月份</h3>
            <ul>
              {portrait.topMonths.map((month) => (
                <li key={month.month}>
                  {month.label}：{month.count} 次（{(month.share * 100).toFixed(0)}%）
                </li>
              ))}
            </ul>
            <h3>主要交通</h3>
            <ul>
              {portrait.topTransports.map((t) => (
                <li key={t.value}>{t.label}：{t.count} 次（{(t.share * 100).toFixed(0)}%）</li>
              ))}
            </ul>
          </section>

          <section className="card panel-card">
            <h3>主题混合</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {([
                ['food', '美食'],
                ['scenery', '风景'],
                ['history', '人文'],
                ['healing', '治愈'],
                ['nature', '自然'],
              ] as const).map(([key, label]) => (
                <div key={key} className="panel-card" style={{ padding: 12, textAlign: 'center' }}>
                  <small>{label}</small>
                  <h3>{(portrait.themeMix[key] * 100).toFixed(0)}%</h3>
                </div>
              ))}
            </div>
          </section>

          <section className="card panel-card">
            <h3>画像总结</h3>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{portrait.summaryMarkdown}</pre>
            {portrait.generatedAt ? (
              <small>生成于 {new Date(portrait.generatedAt).toLocaleString()}</small>
            ) : null}
          </section>
        </>
      ) : null}
    </main>
  );
}
