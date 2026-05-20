import { useEffect, useState } from 'react';
import type { AuthAccount } from '../../types';
import type { TripDetailResponseDto } from '../../lib/api/types';
import { fetchTripDetail } from '../../lib/api/tripsApi';
import { getLiveTripLabel } from './liveTripModel';

interface TripTodayPageProps {
  account: AuthAccount;
  tripId: string;
  onNavigateBack: () => void;
  onLogout: () => Promise<void> | void;
}

export default function TripTodayPage({ account, tripId, onNavigateBack, onLogout }: TripTodayPageProps) {
  const [data, setData] = useState<TripDetailResponseDto | null>(null);
  useEffect(() => { fetchTripDetail(tripId).then(setData).catch(() => setData(null)); }, [tripId]);
  return (
    <main className="live-trip-shell">
      <div className="live-trip-topbar"><button className="ghost-button" onClick={onNavigateBack}>返回</button><button className="ghost-button" onClick={() => void onLogout()}>退出登录</button></div>
      <section className="live-trip-hero"><span className="hero-kicker">Live Trip · @{account.username}</span><h1>{data?.trip.name ?? '旅途进行时'}</h1><p>{data ? getLiveTripLabel(data.trip) : '正在读取当天行程。'}</p></section>
      <section className="live-trip-grid">
        <article><span>当天规划</span><strong>{data?.planningSummary?.total ?? 0}</strong><p>打开规划工作台继续安排今天。</p></article>
        <article><span>行前清单</span><strong>{data?.checklistSummary.total ?? 0}</strong><p>检查出发前和旅途中事项。</p></article>
        <article><span>快速记录</span><strong>{data?.markers.length ?? 0}</strong><p>补一条今天的城市、照片与备注。</p></article>
      </section>
    </main>
  );
}
