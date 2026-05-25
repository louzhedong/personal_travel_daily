import { useCallback, useEffect, useState } from 'react';
import type { AuthAccount } from '../../types';
import {
  acknowledgeTripReconciliationReport,
  fetchTripReconciliationReport,
  refreshTripReconciliationReport,
} from '../../lib/api/tripReconciliationApi';
import type { TripReconciliationReportDto } from '../../lib/api/dto/tripReconciliation';

/**
 * G2 · TripReconciliationPage / 旅行对账日页面
 */
interface Props {
  account: AuthAccount;
  tripId: string;
  onLogout: () => Promise<void> | void;
  onNavigateBack: () => void;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

function formatYuan(cents: number) {
  return (cents / 100).toFixed(2);
}

export default function TripReconciliationPage({ account, tripId, onLogout, onNavigateBack }: Props) {
  const [report, setReport] = useState<TripReconciliationReportDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTripReconciliationReport(tripId);
      setReport(data);
      setError(null);
    } catch {
      setError('对账报告加载失败');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = async () => {
    setBusy(true);
    try {
      const { report: next } = await refreshTripReconciliationReport(tripId);
      setReport(next);
    } finally {
      setBusy(false);
    }
  };

  const handleAcknowledge = async () => {
    setBusy(true);
    try {
      const { report: next } = await acknowledgeTripReconciliationReport(tripId);
      setReport(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="trip-reconciliation-shell">
      <div className="journey-topbar">
        <button className="ghost-button" onClick={onNavigateBack}>返回</button>
        <button className="ghost-button" onClick={() => void onLogout()}>退出登录</button>
      </div>
      <section className="card">
        <span className="hero-kicker">Trip Reconciliation Day · @{account.username}</span>
        <h1>{report?.tripName ?? '旅行对账日'}</h1>
        <p>结束一段旅程后，给规划与现实做一次温柔的对照。</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="primary-button" disabled={busy} onClick={() => void handleRefresh()}>
            {report ? '重新生成' : '生成报告'}
          </button>
          {report && !report.acknowledgedAt ? (
            <button className="ghost-button" disabled={busy} onClick={() => void handleAcknowledge()}>
              标记已查阅
            </button>
          ) : null}
        </div>
        {report?.acknowledgedAt ? <small>已于 {new Date(report.acknowledgedAt).toLocaleString()} 查阅</small> : null}
      </section>

      {loading ? <section className="card"><p>加载中…</p></section> : null}
      {error ? <section className="card"><p>{error}</p></section> : null}

      {report ? (
        <>
          <section className="card">
            <h3>对照面板</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div className="panel-card" style={{ padding: 12 }}>
                <small>规划→标记 转化率</small>
                <h2>{formatPercent(report.planVsMarkerCoverage)}</h2>
                <small>{report.convertedPlanningCount} / {report.totalPlanningCount}</small>
              </div>
              <div className="panel-card" style={{ padding: 12 }}>
                <small>清单完成度</small>
                <h2>{formatPercent(report.checklistCompletionRate)}</h2>
                <small>{report.completedChecklistCount} / {report.totalChecklistCount}</small>
              </div>
              <div className="panel-card" style={{ padding: 12 }}>
                <small>预算偏差 ({report.baseCurrency})</small>
                <h2>{formatYuan(report.budgetVarianceCents)}</h2>
                <small>计划 {formatYuan(report.budgetPlannedCents)} / 实际 {formatYuan(report.budgetActualCents)}</small>
              </div>
              <div className="panel-card" style={{ padding: 12 }}>
                <small>缺标题照片</small>
                <h2>{report.missingCaptionPhotoCount}</h2>
                <small>共 {report.totalPhotoCount} 张</small>
              </div>
            </div>
          </section>

          {report.unconvertedPlanningItems.length > 0 ? (
            <section className="card">
              <h3>未落地的规划项</h3>
              <ul>
                {report.unconvertedPlanningItems.map((item) => (
                  <li key={item.id}>
                    <strong>{item.title}</strong>
                    {item.plannedDate ? <span>（{item.plannedDate}）</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="card">
            <h3>对账总结</h3>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{report.summaryMarkdown}</pre>
          </section>
        </>
      ) : null}
    </main>
  );
}
