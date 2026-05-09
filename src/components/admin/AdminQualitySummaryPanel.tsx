import type { AdminQualityReportDto } from '../../lib/api/types';
import { getTopQualityIssues } from '../../modules/admin/adminPageModel';
import type { AdminOverviewResponseDto } from '../../lib/api/types';
import AdminQualityIssueList from './AdminQualityIssueList';

interface AdminQualitySummaryPanelProps {
  overview: AdminOverviewResponseDto;
}

export default function AdminQualitySummaryPanel({ overview }: AdminQualitySummaryPanelProps) {
  const report: AdminQualityReportDto | undefined = overview.quality;
  const topIssues = getTopQualityIssues(overview, 8);

  return (
    <section className="card admin-quality-panel">
      <div className="admin-section-title admin-quality-heading">
        <div>
          <h2>质量巡检</h2>
          <p>只读巡检 · 不执行后台修复</p>
        </div>
        <span>{report?.summary.checkedAt ? `检查于 ${new Date(report.summary.checkedAt).toLocaleString('zh-CN')}` : '暂无检查'}</span>
      </div>

      <div className="admin-quality-summary">
        <div className="admin-quality-summary-item admin-quality-summary-critical">
          <span>严重</span>
          <strong>{report?.summary.criticalCount ?? 0}</strong>
        </div>
        <div className="admin-quality-summary-item admin-quality-summary-warning">
          <span>注意</span>
          <strong>{report?.summary.warningCount ?? 0}</strong>
        </div>
        <div className="admin-quality-summary-item admin-quality-summary-info">
          <span>建议</span>
          <strong>{report?.summary.infoCount ?? 0}</strong>
        </div>
        <div className="admin-quality-summary-item">
          <span>影响账号</span>
          <strong>{report?.summary.affectedAccountCount ?? 0}</strong>
        </div>
      </div>

      <AdminQualityIssueList issues={topIssues} />
    </section>
  );
}
