import { useEffect, useMemo, useState } from 'react';
import AdminAuditTrailPanel from '../../components/admin/AdminAuditTrailPanel';
import AdminFiltersBar from '../../components/admin/AdminFiltersBar';
import AdminAccountQualityPanel from '../../components/admin/AdminAccountQualityPanel';
import AdminGuideSearchTrendsPanel from '../../components/admin/AdminGuideSearchTrendsPanel';
import AdminOverviewCards from '../../components/admin/AdminOverviewCards';
import AdminGuideSourceHealthPanel from '../../components/admin/AdminGuideSourceHealthPanel';
import AdminQualityFiltersPanel from '../../components/admin/AdminQualityFiltersPanel';
import AdminQualityIssueDrawer from '../../components/admin/AdminQualityIssueDrawer';
import AdminQualityIssueList from '../../components/admin/AdminQualityIssueList';
import AdminQualityReminderPanel from '../../components/admin/AdminQualityReminderPanel';
import AdminQualitySummaryPanel from '../../components/admin/AdminQualitySummaryPanel';
import AdminRankingTable from '../../components/admin/AdminRankingTable';
import AppToast, { type AppToastTone } from '../../components/ui/AppToast';
import TravelIcon from '../../components/ui/TravelIcon';
import {
  applyAdminQualityAutoFix,
  fetchAdminAuditLogs,
  fetchAdminOverview,
  previewAdminQualityAutoFix,
  recordAdminAuditLog,
} from '../../lib/api/adminApi';
import type {
  AdminAuditActionDto,
  AdminAuditLogDto,
  AdminOverviewResponseDto,
  AdminQualityAutoFixResultDto,
  AdminQualityIssueDto,
} from '../../lib/api/types';
import type { AuthAccount } from '../../types';
import {
  ADMIN_DETAIL_TABS,
  DEFAULT_ADMIN_QUALITY_FILTERS,
  buildAdminQualityNavigationTarget,
  filterAdminQualityIssues,
  formatAdminDate,
  formatAdminDateOnly,
  getAccountDetailCollections,
  getAdminQualityFilterSummary,
  serializeQualityIssueContext,
  type AdminDetailTab,
  type AdminQualityFilters,
} from './adminPageModel';

interface AdminPageProps {
  account: AuthAccount;
  onLogout: () => Promise<void> | void;
  onNavigateHome: () => void;
  onNavigateToPath: (path: string) => void;
}

export default function AdminPage({ account, onLogout, onNavigateHome, onNavigateToPath }: AdminPageProps) {
  const [overview, setOverview] = useState<AdminOverviewResponseDto | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogDto[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminDetailTab>('trips');
  const [qualityFilters, setQualityFilters] = useState<AdminQualityFilters>(DEFAULT_ADMIN_QUALITY_FILTERS);
  const [selectedQualityIssueId, setSelectedQualityIssueId] = useState<string | null>(null);
  const [auditActionFilter, setAuditActionFilter] = useState<AdminAuditActionDto | 'all'>('all');
  const [toastMessage, setToastMessage] = useState('');
  const [toastTone, setToastTone] = useState<AppToastTone>('info');
  const [autoFixPreview, setAutoFixPreview] = useState<AdminQualityAutoFixResultDto | null>(null);
  const [autoFixLoading, setAutoFixLoading] = useState(false);
  const [autoFixApplying, setAutoFixApplying] = useState(false);

  const refreshAdminOverview = async () => {
    const response = await fetchAdminOverview();
    setOverview(response);
    setSelectedAccountId((current) => current ?? response.accounts[0]?.id ?? null);
    return response;
  };

  useEffect(() => {
    let cancelled = false;

    // Preserve the original fetch flow and cancellation guard.
    // 保持原有数据拉取流程与取消标记，避免拆分后改变时序行为。
    Promise.all([fetchAdminOverview(), fetchAdminAuditLogs({ limit: 50 })])
      .then(([response, auditResponse]) => {
        if (!cancelled) {
          setOverview(response);
          setAuditLogs(auditResponse.logs);
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
          setAuditLoading(false);
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

  const qualityIssues = overview?.quality?.issues ?? [];
  const filteredQualityIssues = useMemo(
    () => filterAdminQualityIssues(qualityIssues, qualityFilters),
    [qualityIssues, qualityFilters],
  );
  const selectedQualityIssue = useMemo(
    () => filteredQualityIssues.find((issue) => issue.id === selectedQualityIssueId) ?? null,
    [filteredQualityIssues, selectedQualityIssueId],
  );
  const qualityFilterSummary = getAdminQualityFilterSummary(qualityIssues.length, filteredQualityIssues.length);

  const showToast = (message: string, tone: AppToastTone = 'info') => {
    setToastMessage(message);
    setToastTone(tone);
  };

  const appendAuditLog = async (input: Parameters<typeof recordAdminAuditLog>[0]) => {
    try {
      const log = await recordAdminAuditLog(input);
      setAuditLogs((current) => [log, ...current.filter((item) => item.id !== log.id)].slice(0, 50));
    } catch {
      showToast('审计记录失败', 'error');
    }
  };

  const handleSelectQualityIssue = (issue: AdminQualityIssueDto) => {
    setSelectedQualityIssueId(issue.id);
    setAutoFixPreview(null);
    void appendAuditLog({
      action: 'quality_issue_viewed',
      targetKind: issue.targetKind,
      targetId: issue.targetId,
      metadata: {
        issueId: issue.id,
        issueType: issue.type,
        severity: issue.severity,
      },
    });
  };

  const handleNavigateQualityIssue = (issue: AdminQualityIssueDto) => {
    const target = buildAdminQualityNavigationTarget(issue);
    if (!target) {
      showToast('该问题暂无可跳转位置');
      return;
    }

    void appendAuditLog({
      action: 'quality_issue_navigated',
      targetKind: issue.targetKind,
      targetId: issue.targetId,
      metadata: {
        issueId: issue.id,
        path: target.path,
      },
    });
    onNavigateToPath(target.path);
  };

  const handleCopyQualityIssueContext = async (issue: AdminQualityIssueDto) => {
    try {
      await navigator.clipboard.writeText(serializeQualityIssueContext(issue));
      showToast('已复制问题上下文', 'success');
      void appendAuditLog({
        action: 'quality_issue_context_copied',
        targetKind: issue.targetKind,
        targetId: issue.targetId,
        metadata: {
          issueId: issue.id,
          issueType: issue.type,
        },
      });
    } catch {
      showToast('复制失败', 'error');
    }
  };

  const handleMarkQualityIssueViewed = (issue: AdminQualityIssueDto) => {
    void appendAuditLog({
      action: 'quality_issue_viewed',
      targetKind: issue.targetKind,
      targetId: issue.targetId,
      metadata: {
        issueId: issue.id,
        issueType: issue.type,
        acknowledged: true,
      },
    });
    showToast('已记录查看', 'success');
  };

  const handleQualityFiltersChange = (filters: AdminQualityFilters) => {
    setQualityFilters(filters);
    setSelectedQualityIssueId(null);
    setAutoFixPreview(null);
  };

  const removeQualityIssueFromOverview = (issueId: string) => {
    setOverview((current) => {
      if (!current?.quality) {
        return current;
      }

      const nextIssues = current.quality.issues.filter((issue) => issue.id !== issueId);
      return {
        ...current,
        quality: {
          ...current.quality,
          summary: {
            ...current.quality.summary,
            criticalCount: nextIssues.filter((issue) => issue.severity === 'critical').length,
            warningCount: nextIssues.filter((issue) => issue.severity === 'warning').length,
            infoCount: nextIssues.filter((issue) => issue.severity === 'info').length,
            affectedAccountCount: new Set(nextIssues.map((issue) => issue.accountId).filter(Boolean)).size,
          },
          issues: nextIssues,
        },
      };
    });
  };

  const handlePreviewAutoFix = async (issue: AdminQualityIssueDto) => {
    setAutoFixLoading(true);
    try {
      const result = await previewAdminQualityAutoFix(issue.id);
      setAutoFixPreview(result);
      showToast(result.status === 'preview' ? '已生成修复预览' : result.description, result.status === 'preview' ? 'success' : 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '修复预览失败', 'error');
    } finally {
      setAutoFixLoading(false);
    }
  };

  const handleApplyAutoFix = async (issue: AdminQualityIssueDto) => {
    setAutoFixApplying(true);
    try {
      const result = await applyAdminQualityAutoFix(issue.id);
      setAutoFixPreview(result);
      if (result.status === 'applied' || result.status === 'already_resolved') {
        removeQualityIssueFromOverview(issue.id);
        setSelectedQualityIssueId(null);
        setAutoFixPreview(null);
        await refreshAdminOverview();
      }
      showToast(result.status === 'applied' ? '已完成自动修复' : result.description, result.status === 'not_repairable' ? 'info' : 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '自动修复失败', 'error');
    } finally {
      setAutoFixApplying(false);
    }
  };

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
          <AdminQualityReminderPanel overview={overview} />
          <AdminQualitySummaryPanel
            overview={overview}
            onSelectIssue={handleSelectQualityIssue}
            onNavigateIssue={handleNavigateQualityIssue}
          />
          <section className="card admin-quality-workbench">
            <AdminQualityFiltersPanel
              accounts={overview.accounts}
              filters={qualityFilters}
              summary={qualityFilterSummary}
              onChange={handleQualityFiltersChange}
              onReset={() => handleQualityFiltersChange(DEFAULT_ADMIN_QUALITY_FILTERS)}
            />
            <AdminQualityIssueList
              issues={filteredQualityIssues}
              emptyMessage="暂无匹配问题"
              onSelectIssue={handleSelectQualityIssue}
              onNavigateIssue={handleNavigateQualityIssue}
            />
          </section>

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
                    <AdminAccountQualityPanel overview={overview} accountId={selectedAccount.id} />

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

                    <AdminGuideSearchTrendsPanel items={overview.guideSearchTrends ?? []} />
                    <AdminGuideSourceHealthPanel items={overview.guideSourceHealth ?? []} />
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
          <AdminAuditTrailPanel
            logs={auditLogs}
            loading={auditLoading}
            actionFilter={auditActionFilter}
            onActionFilterChange={(value) => {
              setAuditActionFilter(value);
              if (value !== 'all') {
                void appendAuditLog({
                  action: 'audit_trail_viewed',
                  targetKind: 'auditLog',
                  metadata: { actionFilter: value },
                });
              }
            }}
          />
          <AdminQualityIssueDrawer
            issue={selectedQualityIssue}
            onClose={() => setSelectedQualityIssueId(null)}
            onCopyContext={handleCopyQualityIssueContext}
            onMarkViewed={handleMarkQualityIssueViewed}
            onNavigate={handleNavigateQualityIssue}
            autoFixPreview={autoFixPreview}
            autoFixLoading={autoFixLoading}
            autoFixApplying={autoFixApplying}
            onPreviewAutoFix={handlePreviewAutoFix}
            onApplyAutoFix={handleApplyAutoFix}
          />
        </>
      ) : null}
      <AppToast open={!!toastMessage} message={toastMessage} tone={toastTone} />
    </main>
  );
}
