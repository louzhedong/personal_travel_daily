import { useEffect, useMemo, useState } from 'react';
import TravelIcon from '../../components/ui/TravelIcon';
import { fetchAdminOverview } from '../../lib/api/adminApi';
import type {
  AdminAccountNodeDto,
  AdminCompanionNodeDto,
  AdminOverviewResponseDto,
  AdminTripNodeDto,
} from '../../lib/api/types';
import type { AuthAccount } from '../../types';

interface AdminPageProps {
  account: AuthAccount;
  onLogout: () => Promise<void> | void;
  onNavigateHome: () => void;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function formatDateOnly(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return value;
  }
}

type AdminDetailTab = 'trips' | 'markers' | 'savedGuides' | 'guideSearchHistory';

function AdminSummaryCards({ overview }: { overview: AdminOverviewResponseDto }) {
  const summary = useMemo(
    () =>
      overview.accounts.reduce(
        (acc, account) => ({
          accountCount: acc.accountCount + 1,
          tripCount: acc.tripCount + account.stats.tripCount,
          companionCount: acc.companionCount + account.stats.companionCount,
          markerCount: acc.markerCount + account.stats.markerCount,
          savedGuideCount: acc.savedGuideCount + account.stats.savedGuideCount,
          guideSearchHistoryCount:
            acc.guideSearchHistoryCount + account.stats.guideSearchHistoryCount,
        }),
        {
          accountCount: 0,
          tripCount: 0,
          companionCount: 0,
          markerCount: 0,
          savedGuideCount: 0,
          guideSearchHistoryCount: 0,
        },
      ),
    [overview.accounts],
  );

  const items = [
    { label: '系统用户', value: summary.accountCount, tone: 'blue' },
    { label: '行程', value: summary.tripCount, tone: 'green' },
    { label: '同行人', value: summary.companionCount, tone: 'teal' },
    { label: '旅行记录', value: summary.markerCount, tone: 'orange' },
    { label: '收藏攻略', value: summary.savedGuideCount, tone: 'sky' },
    { label: '搜索历史', value: summary.guideSearchHistoryCount, tone: 'slate' },
  ];

  return (
    <section className="admin-summary-grid">
      {items.map((item) => (
        <article key={item.label} className={`card admin-summary-card admin-summary-card-${item.tone}`}>
          <span className="admin-summary-label">{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  );
}

function getAccountDetailCollections(account: AdminAccountNodeDto) {
  const companions = account.companions;
  const tripById = new Map(account.trips.map((trip) => [trip.id, trip]));
  const markers = companions.flatMap((companion) =>
    companion.markers.map((marker) => ({
      ...marker,
      companionName: companion.name,
      tripName: marker.tripId ? tripById.get(marker.tripId)?.name ?? '未知行程' : '未归入行程',
    })),
  );

  return {
    trips: account.trips.map((trip) => ({
      ...trip,
      markerCount: markers.filter((marker) => marker.tripId === trip.id).length,
    })),
    markers,
    savedGuides: companions.flatMap((companion) =>
      companion.savedGuides.map((guide) => ({
        ...guide,
        companionName: companion.name,
      })),
    ),
    guideSearchHistory: companions.flatMap((companion) =>
      companion.guideSearchHistory.map((history) => ({
        ...history,
        companionName: companion.name,
      })),
    ),
  };
}

export default function AdminPage({ account, onLogout, onNavigateHome }: AdminPageProps) {
  const [overview, setOverview] = useState<AdminOverviewResponseDto | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminDetailTab>('trips');

  useEffect(() => {
    let cancelled = false;

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

  const tabItems: Array<{ key: AdminDetailTab; label: string }> = [
    { key: 'trips', label: '行程' },
    { key: 'markers', label: '旅行记录' },
    { key: 'savedGuides', label: '收藏攻略' },
    { key: 'guideSearchHistory', label: '搜索历史' },
  ];

  return (
    <main className="admin-shell">
      <section className="card admin-hero">
        <div className="admin-hero-copy">
          <span className="hero-kicker">后台管理</span>
          <h1>系统用户总览</h1>
          <p>按账号查看行程、同行人、旅行记录、收藏攻略与搜索历史，当前仅提供只读巡检视图。</p>
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
          <AdminSummaryCards overview={overview} />

          <section className="admin-workspace">
            <aside className="card admin-sidebar">
              <div className="admin-sidebar-header">
                <div>
                  <h2>用户列表</h2>
                  <p>选择一个账号，在右侧查看完整明细。</p>
                </div>
                <span className="admin-sidebar-count">{overview.accounts.length}</span>
              </div>

              {overview.accounts.length === 0 ? (
                <div className="admin-empty-block">当前还没有系统用户。</div>
              ) : (
                <div className="admin-user-list">
                  {overview.accounts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={
                        item.id === selectedAccount?.id ? 'admin-user-row is-active' : 'admin-user-row'
                      }
                      onClick={() => {
                        setSelectedAccountId(item.id);
                        setActiveTab('trips');
                      }}
                    >
                      <div className="admin-user-row-main">
                        <div className="admin-user-row-top">
                          <strong>{item.name}</strong>
                          <span className={`admin-role-badge admin-role-badge-${item.role}`}>
                            {item.role === 'admin' ? '管理员' : '普通用户'}
                          </span>
                        </div>
                        <p>@{item.username}</p>
                      </div>
                      <div className="admin-user-row-meta">
                        <span>同行 {item.stats.companionCount}</span>
                        <span>行程 {item.stats.tripCount}</span>
                        <span>记录 {item.stats.markerCount}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </aside>

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
                        @{selectedAccount.username} · 创建于 {formatDate(selectedAccount.createdAt)}
                      </p>
                    </div>
                    <div className="admin-inline-stats">
                      <span>行程 {selectedAccount.stats.tripCount}</span>
                      <span>同行人 {selectedAccount.stats.companionCount}</span>
                      <span>记录 {selectedAccount.stats.markerCount}</span>
                      <span>收藏 {selectedAccount.stats.savedGuideCount}</span>
                      <span>搜索 {selectedAccount.stats.guideSearchHistoryCount}</span>
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
                        <span>搜索历史</span>
                        <strong>{detailCollections.guideSearchHistory.length}</strong>
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
                          {detailCollections.trips.map((trip: AdminTripNodeDto & { markerCount: number }) => (
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
                                  {formatDateOnly(trip.startsAt)} 至 {formatDateOnly(trip.endsAt)} · 记录{' '}
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
                          {selectedAccount.companions.map((companion: AdminCompanionNodeDto) => (
                            <div key={companion.id} className="admin-companion-pill">
                              <span
                                className="admin-companion-pill-color"
                                style={{ backgroundColor: companion.color }}
                                aria-hidden="true"
                              />
                              <div>
                                <strong>{companion.name}</strong>
                                <p>
                                  记录 {companion.markers.length} · 收藏 {companion.savedGuides.length} · 搜索{' '}
                                  {companion.guideSearchHistory.length}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </section>

                  <section className="admin-detail-tabs">
                    <div className="admin-tab-row" role="tablist" aria-label="后台详情切换">
                      {tabItems.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          role="tab"
                          aria-selected={activeTab === item.key}
                          className={activeTab === item.key ? 'admin-tab-button is-active' : 'admin-tab-button'}
                          onClick={() => setActiveTab(item.key)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {activeTab === 'trips' ? (
                      <section className="admin-data-card">
                        <div className="admin-section-title">
                          <span className="travel-icon-badge travel-icon-badge-blue">
                            <TravelIcon name="route" size={14} />
                          </span>
                          <h3>行程</h3>
                        </div>
                        {detailCollections.trips.length === 0 ? (
                          <div className="admin-empty-block">暂无行程。</div>
                        ) : (
                          <div className="admin-table-wrap">
                            <table className="admin-table">
                              <thead>
                                <tr>
                                  <th>行程</th>
                                  <th>时间</th>
                                  <th>记录</th>
                                  <th>备注</th>
                                  <th>创建时间</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detailCollections.trips.map((trip) => (
                                  <tr key={trip.id}>
                                    <td>
                                      <strong>{trip.name}</strong>
                                    </td>
                                    <td>
                                      {formatDateOnly(trip.startsAt)} 至 {formatDateOnly(trip.endsAt)}
                                    </td>
                                    <td>{trip.markerCount}</td>
                                    <td className="admin-note-cell">{trip.note || '暂无备注'}</td>
                                    <td>{formatDate(trip.createdAt)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>
                    ) : null}

                    {activeTab === 'markers' ? (
                      <section className="admin-data-card">
                        <div className="admin-section-title">
                          <span className="travel-icon-badge travel-icon-badge-orange">
                            <TravelIcon name="route" size={14} />
                          </span>
                          <h3>旅行记录</h3>
                        </div>
                        {detailCollections.markers.length === 0 ? (
                          <div className="admin-empty-block">暂无旅行记录。</div>
                        ) : (
                          <div className="admin-table-wrap">
                            <table className="admin-table">
                              <thead>
                                <tr>
                                  <th>同行人</th>
                                  <th>行程</th>
                                  <th>目的地</th>
                                  <th>时间</th>
                                  <th>范围</th>
                                  <th>图片</th>
                                  <th>备注</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detailCollections.markers.map((marker) => (
                                  <tr key={marker.id}>
                                    <td>{marker.companionName}</td>
                                    <td>{marker.tripName}</td>
                                    <td>
                                      <strong>{marker.scopeName}</strong>
                                      <div>{marker.city}</div>
                                    </td>
                                    <td>
                                      {formatDateOnly(marker.visitedStartAt)} 至 {formatDateOnly(marker.visitedEndAt)}
                                    </td>
                                    <td>{marker.scope === 'domestic' ? '国内' : '国际'}</td>
                                    <td>{marker.imageUrls?.length ?? 0}</td>
                                    <td className="admin-note-cell">{marker.note || '暂无备注'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>
                    ) : null}

                    {activeTab === 'savedGuides' ? (
                      <section className="admin-data-card">
                        <div className="admin-section-title">
                          <span className="travel-icon-badge travel-icon-badge-blue">
                            <TravelIcon name="globe" size={14} />
                          </span>
                          <h3>收藏攻略</h3>
                        </div>
                        {detailCollections.savedGuides.length === 0 ? (
                          <div className="admin-empty-block">暂无收藏攻略。</div>
                        ) : (
                          <div className="admin-table-wrap">
                            <table className="admin-table">
                              <thead>
                                <tr>
                                  <th>同行人</th>
                                  <th>标题</th>
                                  <th>关键词</th>
                                  <th>来源</th>
                                  <th>收藏时间</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detailCollections.savedGuides.map((guide) => (
                                  <tr key={guide.id}>
                                    <td>{guide.companionName}</td>
                                    <td className="admin-note-cell">{guide.result.title}</td>
                                    <td>{guide.keyword}</td>
                                    <td>{guide.result.sourceName}</td>
                                    <td>{formatDate(guide.savedAt)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>
                    ) : null}

                    {activeTab === 'guideSearchHistory' ? (
                      <section className="admin-data-card">
                        <div className="admin-section-title">
                          <span className="travel-icon-badge travel-icon-badge-teal">
                            <TravelIcon name="spark" size={14} />
                          </span>
                          <h3>搜索历史</h3>
                        </div>
                        {detailCollections.guideSearchHistory.length === 0 ? (
                          <div className="admin-empty-block">暂无搜索历史。</div>
                        ) : (
                          <div className="admin-table-wrap">
                            <table className="admin-table">
                              <thead>
                                <tr>
                                  <th>同行人</th>
                                  <th>关键词</th>
                                  <th>范围</th>
                                  <th>搜索时间</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detailCollections.guideSearchHistory.map((history) => (
                                  <tr key={history.id}>
                                    <td>{history.companionName}</td>
                                    <td>{history.keyword}</td>
                                    <td>
                                      {history.scope === 'all'
                                        ? '全部'
                                        : history.scope === 'domestic'
                                          ? '国内'
                                          : '国际'}
                                    </td>
                                    <td>{formatDate(history.createdAt)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>
                    ) : null}
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
