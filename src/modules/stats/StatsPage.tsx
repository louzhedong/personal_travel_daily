import type { AuthAccount } from '../../types';
import TripStatsCenter from './TripStatsCenter';

interface StatsPageProps {
  account: AuthAccount;
  onOpenTripDetail?: (tripId: string) => void;
  onNavigateHome: () => void;
  onLogout: () => Promise<void> | void;
}

export default function StatsPage({ account, onOpenTripDetail, onNavigateHome, onLogout }: StatsPageProps) {
  return (
    <main className="stats-page-stage">
      <div className="stats-page-shell">
        <section className="stats-page-hero card">
          <div className="stats-page-hero-copy">
            <span className="hero-kicker">Travel Yearbook</span>
            <h1>行程统计中心</h1>
            <p>
              用一页把旅途里的时间、热区、行程与回忆收拢起来。它应该更像一本旅行年鉴的封面，而不是一组后台模块的平铺组合。
            </p>
            <div className="stats-page-badges">
              <span className="stats-page-badge">年度回看</span>
              <span className="stats-page-badge">热区足迹</span>
              <span className="stats-page-badge">行程年鉴</span>
            </div>
            <span className="stats-page-account">当前账号：{account.name}</span>
          </div>
          <div className="stats-page-actions">
            <div className="stats-page-side-note">
              <span className="stats-page-side-note-title">阅读路径</span>
              <p>先翻封面摘要，再切年份和范围，最后进入某一段行程，把它当成旅程档案来回看。</p>
            </div>
            <div className="stats-page-action-row">
              <button type="button" className="ghost-button" onClick={onNavigateHome}>
                返回旅行主页
              </button>
              <button type="button" className="ghost-button" onClick={() => void onLogout()}>
                退出登录
              </button>
            </div>
          </div>
        </section>

        <TripStatsCenter onOpenTripDetail={onOpenTripDetail} />
      </div>
    </main>
  );
}
