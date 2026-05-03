import { useEffect, useMemo, useState } from 'react';
import AdminFiltersBar from '../../components/admin/AdminFiltersBar';
import AdminOverviewCards from '../../components/admin/AdminOverviewCards';
import AdminRankingTable from '../../components/admin/AdminRankingTable';
import TravelIcon from '../../components/ui/TravelIcon';
import { fetchAdminOverview } from '../../lib/api/adminApi';
import type { AdminOverviewResponseDto } from '../../lib/api/types';
import type { AuthAccount } from '../../types';
import {
  ADMIN_DETAIL_TABS,
  formatAdminDate,
  formatAdminDateOnly,
  getAccountDetailCollections,
  type AdminDetailTab,
} from './adminPageModel';

interface AdminPageProps {
  account: AuthAccount;
  onLogout: () => Promise<void> | void;
  onNavigateHome: () => void;
}

export default function AdminPage({ account, onLogout, onNavigateHome }: AdminPageProps) {
  const [overview, setOverview] = useState<AdminOverviewResponseDto | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminDetailTab>('trips');

  useEffect(() => {
    let cancelled = false;

    // Preserve the original fetch flow and cancellation guard.
    // 保持原有数据拉取流程与取消标记，避免拆分后改变时序行为。
    fetchAdminOverview()
      .then((response) => {
        if (!cancelled) {
          setOverview(response);
          setSelectedAccountId((current) => current ?? response.accounts[0]?.id ?? null);
          setErrorMessage('');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : '后台数据加载失败');
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
  }, []);

  const selectedAccount = useMemo(
    () => overview?.accounts.find((item) => item.id === selectedAccountId) ?? overview?.accounts[0] ?? null,
    [overview, selectedAccountId],
  );

  const detailCollections = useMemo(
    () => (selectedAccount ? getAccountDetailCollections(selectedAccount) : null),
    [selectedAccount],
  );

  return (
    <main className="admin-shell">
      <section className="card admin-hero">
        <div className="admin-hero-copy">
          <span className="hero-kicker">后台管理</span>
          <h1>系统用户总览</h1>
          <p>按账号查看行程、同行人、旅行记录、收藏攻略与搜索行为，当前仅提供只读巡检视图。</p>
          <div className="admin-hero-meta">
            <span>当前管理员：{account.name}</span>
            <span>@{account.username}</span>
          </div>
        </div>
        <div className="admin-hero-actions">
          <button type="button" className="ghost-button" onClick={onNavigateHome}>
            返回旅行主页
          </button>
          <button type="button" className="primary-button" onClick={() => void onLogout()}>
            退出登录
          </button>
        </div>
      </section>

      {loading ? (
        <section className="card admin-state-card">
          <strong>正在加载后台数据...</strong>
          <p>稍等片刻，系统正在聚合用户、同行人和旅行记录视图。</p>
        </section>
      ) : null}

      {!loading && errorMessage ? (
        <section className="card admin-state-card admin-state-card-error">
          <strong>后台数据加载失败</strong>
          <p>{errorMessage}</p>
        </section>
      ) : null}

      {!loading && overview ? (
        <>
          <AdminOverviewCards overview={overview} />

          <section className="admin-workspace">
            <AdminFiltersBar
              variant="sidebar"
              accounts={overview.accounts}
              selectedAccountId={selectedAccount?.id ?? selectedAccountId}
              onSelectAccount={(accountId) => {
                setSelectedAccountId(accountId);
                setActiveTab('trips');
              }}
            />

            <section className="card admin-detail-panel">
              {!selectedAccount || !detailCollections ? (
                <div className="admin-empty-block">请选择一个用户查看详细数据。</div>
              ) : (
                <>
                  <div className="admin-detail-header">
                    <div>
                      <div className="admin-account-title-row">
                        <h2>{selectedAccount.name}</h2>
                        <span className={`admin-role-badge admin-role-badge-${selectedAccount.role}`}>
                          {selectedAccount.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      </div>
                      <p className="admin-account-subtitle">
                        @{selectedAccount.username} · 创建于 {formatAdminDate(selectedAccount.createdAt)}
                      </p>
                    </div>
                    <div className="admin-inline-stats">
                      <span>行程 {selectedAccount.stats.tripCount}</span>
                      <span>同行人 {selectedAccount.stats.companionCount}</span>
                      <span>记录 {selectedAccount.stats.markerCount}</span>
                      <span>收藏 {selectedAccount.stats.savedGuideCount}</span>
                      <span>规划 {selectedAccount.stats.planningItemCount ?? 0}</span>
                      <span>攻略搜索 {selectedAccount.stats.guideSearchHistoryCount}</span>
                      <span>记录搜索 {selectedAccount.stats.markerSearchEventCount}</span>
                    </div>
                  </div>

                  <section className="admin-detail-overview">
                    <div className="admin-kpi-grid">
                      <article className="admin-kpi-card">
                        <span>行程</span>
                        <strong>{selectedAccount.stats.tripCount}</strong>
                      </article>
                      <article className="admin-kpi-card">
                        <span>同行人</span>
                        <strong>{selectedAccount.stats.companionCount}</strong>
                      </article>
                      <article className="admin-kpi-card">
                        <span>旅行记录</span>
                        <strong>{detailCollections.markers.length}</strong>
                      </article>
                      <article className="admin-kpi-card">
                        <span>收藏攻略</span>
                        <strong>{detailCollections.savedGuides.length}</strong>
                      </article>
                      <article className="admin-kpi-card">
                        <span>行前规划</span>
                        <strong>{selectedAccount.stats.planningItemCount ?? 0}</strong>
                      </article>
                      <article className="admin-kpi-card">
                        <span>已转记录</span>
                        <strong>{selectedAccount.stats.convertedPlanningItemCount ?? 0}</strong>
                      </article>
                      <article className="admin-kpi-card">
                        <span>攻略搜索</span>
                        <strong>{detailCollections.guideSearchHistory.length}</strong>
                      </article>
                      <article className="admin-kpi-card">
                        <span>记录搜索</span>
                        <strong>{detailCollections.markerSearchEvents.length}</strong>
                      </article>
                    </div>

                    <section className="admin-data-card">
                      <div className="admin-section-title">
                        <span className="travel-icon-badge travel-icon-badge-blue">
                          <TravelIcon name="route" size={14} />
                        </span>
                        <h3>行程</h3>
                      </div>
                      {selectedAccount.trips.length === 0 ? (
                        <div className="admin-empty-block">该账号下暂无行程。</div>
                      ) : (
                        <div className="admin-trip-inline-list">
                          {detailCollections.trips.map((trip) => (
                            <div key={trip.id} className="admin-trip-pill">
                              {trip.coverImageUrl ? (
                                <img src={trip.coverImageUrl} alt="" className="admin-trip-pill-cover" />
                              ) : (
                                <span className="admin-trip-pill-cover admin-trip-pill-cover-empty" aria-hidden="true">
                                  <TravelIcon name="route" size={16} />
                                </span>
                              )}
                              <div>
                                <strong>{trip.name}</strong>
                                <p>
                                  {formatAdminDateOnly(trip.startsAt)} 至 {formatAdminDateOnly(trip.endsAt)} · 记录{' '}
                                  {trip.markerCount}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="admin-data-card">
                      <div className="admin-section-title">
                        <span className="travel-icon-badge travel-icon-badge-teal">
                          <TravelIcon name="users" size={14} />
                        </span>
                        <h3>同行人</h3>
                      </div>
                      {selectedAccount.companions.length === 0 ? (
                        <div className="admin-empty-block">该账号下暂无同行人。</div>
                      ) : (
                        <div className="admin-companion-inline-list">
                          {selectedAccount.companions.map((companion) => (
                            <div key={companion.id} className="admin-companion-pill">
                              <span
                                className="admin-companion-pill-color"
                                style={{ backgroundColor: companion.color }}
                                aria-hidden="true"
                              />
                              <div>
                                <strong>{companion.name}</strong>
                                <p>
                                  记录 {companion.markers.length} · 收藏 {companion.savedGuides.length} · 攻略搜索{' '}
                                  {companion.guideSearchHistory.length} · 记录搜索{' '}
                                  {
                                    selectedAccount.markerSearchEvents.filter(
                                      (event) => event.companionId === companion.id,
                                    ).length
                                  } · 规划 {companion.planningItems?.length ?? 0}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </section>

                  <section className="admin-detail-tabs">
                    <AdminFiltersBar
                      variant="tabs"
                      activeTab={activeTab}
                      tabItems={ADMIN_DETAIL_TABS}
                      onTabChange={(tab) => setActiveTab(tab)}
                    />
                    <AdminRankingTable activeTab={activeTab} detailCollections={detailCollections} />
                  </section>
                </>
              )}
            </section>
          </section>
        </>
      ) : null}
    </main>
  );
}
