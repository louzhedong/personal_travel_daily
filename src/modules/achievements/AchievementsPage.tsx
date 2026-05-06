import { useEffect, useMemo, useState } from 'react';
import AppToast, { type AppToastTone } from '../../components/ui/AppToast';
import FancySelect from '../../components/ui/FancySelect';
import RoutePageSkeleton from '../../components/ui/RoutePageSkeleton';
import { fetchAnnualReview, fetchStatsOverview } from '../../lib/api/statsApi';
import type { AnnualReviewResponseDto, StatsAchievementDto, StatsOverviewResponseDto } from '../../lib/api/types';
import type { AuthAccount } from '../../types';
import { AchievementCard, AchievementDetailDialog } from './achievementUi';
import {
  ACHIEVEMENT_GROUP_LABELS,
  ACHIEVEMENT_RARITY_LABELS,
  ACHIEVEMENT_STATUS_LABELS,
  buildAchievementCollection,
  buildAchievementPageSummary,
  createDefaultAchievementPageFilters,
  filterAchievementCollection,
  groupAchievementsByGroup,
  type AchievementPageFilters,
} from './achievementsPageModel';

interface AchievementsPageProps {
  account: AuthAccount;
  onNavigateBack: () => void;
  onLogout: () => Promise<void> | void;
}

export default function AchievementsPage({ account, onNavigateBack, onLogout }: AchievementsPageProps) {
  const [overview, setOverview] = useState<StatsOverviewResponseDto | null>(null);
  const [annualReviews, setAnnualReviews] = useState<AnnualReviewResponseDto[]>([]);
  const [filters, setFilters] = useState<AchievementPageFilters>(() => createDefaultAchievementPageFilters());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeAchievement, setActiveAchievement] = useState<StatsAchievementDto | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: AppToastTone } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchStatsOverview({ scope: 'all' })
      .then(async (overviewResponse) => {
        const reviewResponses = await Promise.all(
          overviewResponse.availableYears.map((year) => fetchAnnualReview(year)),
        );
        if (cancelled) {
          return;
        }
        setOverview(overviewResponse);
        setAnnualReviews(reviewResponses);
        setErrorMessage('');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setOverview(null);
        setAnnualReviews([]);
        setErrorMessage(error instanceof Error ? error.message : '成就页加载失败');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string, tone: AppToastTone = 'info') => {
    setToast({ message, tone });
  };

  const achievements = useMemo(
    () => (overview ? buildAchievementCollection(overview, annualReviews) : []),
    [annualReviews, overview],
  );
  const visibleAchievements = useMemo(
    () => filterAchievementCollection(achievements, filters),
    [achievements, filters],
  );
  const groupedAchievements = useMemo(
    () => groupAchievementsByGroup(visibleAchievements),
    [visibleAchievements],
  );
  const summary = useMemo(() => buildAchievementPageSummary(achievements), [achievements]);

  if (loading) {
    return <RoutePageSkeleton variant="detail" />;
  }

  return (
    <main className="achievements-page-stage">
      <div className="achievements-page-shell">
        <section className="card achievements-page-hero">
          <div className="achievements-page-hero-copy">
            <span className="hero-kicker">Achievement Atlas</span>
            <h1>旅行成就总览</h1>
            <p>把账号级成就、年度限定和连续记录放在一页里看，像翻一本只属于你的旅行勋章集。</p>
            <div className="achievements-page-action-row">
              <button type="button" className="ghost-button" onClick={onNavigateBack}>
                返回上一页
              </button>
              <button type="button" className="ghost-button" onClick={() => void onLogout()}>
                退出登录
              </button>
            </div>
          </div>

          <div className="achievements-page-summary-grid">
            <article>
              <span>总成就</span>
              <strong>{summary.total}</strong>
            </article>
            <article>
              <span>已达成</span>
              <strong>{summary.unlocked}</strong>
            </article>
            <article>
              <span>年度限定</span>
              <strong>{summary.annual}</strong>
            </article>
            <article>
              <span>稀有以上</span>
              <strong>{summary.rareAndAbove}</strong>
            </article>
            <article>
              <span>当前账号</span>
              <strong>{account.name}</strong>
            </article>
          </div>
        </section>

        {errorMessage ? (
          <section className="card achievements-page-state achievements-page-state-error">
            <strong>成就页加载失败</strong>
            <p>{errorMessage}</p>
            <button type="button" className="ghost-button" onClick={onNavigateBack}>
              返回上一页
            </button>
          </section>
        ) : null}

        {!errorMessage ? (
          <>
            <section className="card achievements-filter-panel">
              <div className="achievements-filter-panel-head">
                <div>
                  <span className="stats-filter-panel-eyebrow">Filter Lens</span>
                  <strong>筛选成就视角</strong>
                  <p>按分组、稀有度与达成状态收窄当前页面，只看你最想回看的那一层。</p>
                </div>
              </div>
              <div className="achievements-filter-grid">
                <FancySelect
                  value={filters.group}
                  options={[
                    { value: 'all', label: '全部分组' },
                    ...Object.entries(ACHIEVEMENT_GROUP_LABELS).map(([value, label]) => ({ value, label })),
                  ]}
                  onChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      group: value as AchievementPageFilters['group'],
                    }))
                  }
                  placeholder="按分组筛选"
                  ariaLabel="按分组筛选成就"
                />
                <FancySelect
                  value={filters.rarity}
                  options={[
                    { value: 'all', label: '全部稀有度' },
                    ...Object.entries(ACHIEVEMENT_RARITY_LABELS).map(([value, label]) => ({ value, label })),
                  ]}
                  onChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      rarity: value as AchievementPageFilters['rarity'],
                    }))
                  }
                  placeholder="按稀有度筛选"
                  ariaLabel="按稀有度筛选成就"
                />
                <FancySelect
                  value={filters.status}
                  options={[
                    { value: 'all', label: '全部状态' },
                    ...Object.entries(ACHIEVEMENT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
                  ]}
                  onChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      status: value as AchievementPageFilters['status'],
                    }))
                  }
                  placeholder="按状态筛选"
                  ariaLabel="按状态筛选成就"
                />
              </div>
            </section>

            {groupedAchievements.length === 0 ? (
              <section className="card achievements-page-state">
                <strong>当前筛选条件下没有成就</strong>
                <p>可以切回全部分组或全部状态，重新浏览账号级与年度限定成就。</p>
              </section>
            ) : (
              <div className="achievements-group-list">
                {groupedAchievements.map((group) => (
                  <section key={group.group} className="card achievements-group-panel">
                    <div className="achievements-group-head">
                      <div>
                        <h2>{group.label}</h2>
                        <p>{group.items.length} 个成就</p>
                      </div>
                    </div>
                    <div className="stats-achievement-grid achievements-group-grid">
                      {group.items.map((achievement) => (
                        <AchievementCard
                          key={achievement.id}
                          achievement={achievement}
                          onClick={setActiveAchievement}
                          showPeriod
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>

      <AchievementDetailDialog
        achievement={activeAchievement}
        onClose={() => setActiveAchievement(null)}
        accountName={account.name}
        showToast={showToast}
      />
      <AppToast open={!!toast} message={toast?.message ?? ''} tone={toast?.tone} />
    </main>
  );
}
