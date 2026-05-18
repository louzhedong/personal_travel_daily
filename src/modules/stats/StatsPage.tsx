import type { AuthAccount } from '../../types';
import TripStatsCenter from './TripStatsCenter';

interface StatsPageProps {
  account: AuthAccount;
  onOpenTripDetail?: (tripId: string) => void;
  onOpenAnnualReview?: (year: string) => void;
  onOpenAchievements?: () => void;
  onOpenCompanionMemories?: (companionId: string) => void;
  onNavigateHome: () => void;
  onLogout: () => Promise<void> | void;
}

export default function StatsPage({
  account,
  onOpenTripDetail,
  onOpenAnnualReview,
  onOpenAchievements,
  onOpenCompanionMemories,
  onNavigateHome,
  onLogout,
}: StatsPageProps) {
  return (
    <main className="stats-page-stage">
      <div className="stats-page-shell">
        <header className="stats-page-topbar">
          <button type="button" className="ghost-button" onClick={onNavigateHome}>
            返回首页
          </button>
          <button type="button" className="ghost-button" onClick={() => void onLogout()}>
            退出登录
          </button>
        </header>

        <section className="stats-page-hero">
          <div className="stats-page-hero-copy">
            <span className="hero-kicker">Travel Yearbook</span>
            <h1>行程统计中心</h1>
            <p>
              用一页把旅途里的时间、热区、行程与回忆收拢起来。它应该更像一本旅行年鉴的封面，而不是一组后台模块的平铺组合。
            </p>
          </div>
        </section>

        <TripStatsCenter
          accountName={account.name}
          onOpenTripDetail={onOpenTripDetail}
          onOpenAnnualReview={onOpenAnnualReview}
          onOpenAchievements={onOpenAchievements}
          onOpenCompanionMemories={onOpenCompanionMemories}
        />
      </div>
    </main>
  );
}
