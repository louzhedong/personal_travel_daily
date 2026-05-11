import type { AdminQualityIssueDto, AdminQualityReportDto } from '../../lib/api/types';
import { getTopQualityIssues } from '../../modules/admin/adminPageModel';
import type { AdminOverviewResponseDto } from '../../lib/api/types';
import AdminQualityIssueList from './AdminQualityIssueList';

interface AdminQualitySummaryPanelProps {
  overview: AdminOverviewResponseDto;
  onSelectIssue?: (issue: AdminQualityIssueDto) => void;
  onNavigateIssue?: (issue: AdminQualityIssueDto) => void;
}

export default function AdminQualitySummaryPanel({
  overview,
  onSelectIssue,
  onNavigateIssue,
}: AdminQualitySummaryPanelProps) {
  const report: AdminQualityReportDto | undefined = overview.quality;
  const topIssues = getTopQualityIssues(overview, 8);
  const repairableCount = topIssues.filter((issue) => issue.autoFix?.repairable).length;

  return (
    <section className="card admin-quality-panel">
      <div className="admin-section-title admin-quality-heading">
        <div>
          <h2>质量巡检</h2>
          <p>默认只读 · 低风险可确认修复</p>
        </div>
        <span>
          {repairableCount > 0 ? `${repairableCount} 项可修复 · ` : ''}
          {report?.summary.checkedAt ? `检查于 ${new Date(report.summary.checkedAt).toLocaleString('zh-CN')}` : '暂无检查'}
        </span>
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

      <AdminQualityIssueList
        issues={topIssues}
        onSelectIssue={onSelectIssue}
        onNavigateIssue={onNavigateIssue}
      />
    </section>
  );
}
