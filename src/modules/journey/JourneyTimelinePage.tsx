import { useEffect, useState } from 'react';
import type { AuthAccount } from '../../types';
import type { JourneyTimelineResponseDto } from '../../lib/api/types';
import { fetchJourneyTimeline } from '../../lib/api/journeyApi';
import { getJourneyBucketSummary } from './journeyTimelineModel';

interface JourneyTimelinePageProps {
  account: AuthAccount;
  onNavigateBack: () => void;
  onLogout: () => Promise<void> | void;
}

export default function JourneyTimelinePage({ account, onNavigateBack, onLogout }: JourneyTimelinePageProps) {
  const [data, setData] = useState<JourneyTimelineResponseDto | null>(null);
  const [bucketMode, setBucketMode] = useState<'quarter' | 'half'>('quarter');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetchJourneyTimeline(bucketMode)
      .then(setData)
      .catch(() => setData({ buckets: [], generatedAt: new Date().toISOString() }))
      .finally(() => setLoading(false));
  }, [bucketMode]);
  return (
    <main className="journey-shell">
      <div className="journey-topbar"><button className="ghost-button" onClick={onNavigateBack}>返回</button><button className="ghost-button" onClick={() => void onLogout()}>退出登录</button></div>
      <section className="journey-hero"><span className="hero-kicker">Journey River · @{account.username}</span><h1>故事化时间轴</h1><p>从季度和半年看见所有旅行怎样汇成一条河流。</p><div className="journey-mode-switch"><button className="ghost-button" disabled={bucketMode === 'quarter'} onClick={() => setBucketMode('quarter')}>季度</button><button className="ghost-button" disabled={bucketMode === 'half'} onClick={() => setBucketMode('half')}>半年</button></div></section>
      <section className="journey-river" aria-busy={loading}>
        {loading ? <article className="journey-bucket"><span>同步中</span><h2>正在整理故事河流</h2><p>我们会按时间桶收束照片、行程、攻略和路线。</p></article> : null}
        {(data?.buckets ?? []).map((bucket) => (
          <article key={bucket.id} className="journey-bucket">
            <span>{bucket.periodLabel}</span><h2>{bucket.title}</h2><p>{getJourneyBucketSummary(bucket)}</p>
            <div>{bucket.highlights.slice(0, 6).map((item) => <small key={item.id}>{item.kind} · {item.title}</small>)}</div>
            {bucket.routeSegments.length ? <p className="journey-route-line">{bucket.routeSegments.map((item) => `${item.from} → ${item.to}`).join(' / ')}</p> : null}
          </article>
        ))}
        {!loading && !data?.buckets.length ? <article className="journey-bucket"><span>Empty</span><h2>还没有足够的故事线索</h2><p>添加旅行记录、照片和攻略后，这里会生成季度故事。</p></article> : null}
      </section>
    </main>
  );
}
