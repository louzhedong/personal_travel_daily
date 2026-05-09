import type { AdminOverviewResponseDto } from '../../lib/api/types';
import { getAccountQualityIssues } from '../../modules/admin/adminPageModel';
import AdminQualityIssueList from './AdminQualityIssueList';

interface AdminAccountQualityPanelProps {
  overview: AdminOverviewResponseDto;
  accountId: string;
}

export default function AdminAccountQualityPanel({ overview, accountId }: AdminAccountQualityPanelProps) {
  const issues = getAccountQualityIssues(overview, accountId, 5);
  const criticalCount = issues.filter((issue) => issue.severity === 'critical').length;
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length;
  const infoCount = issues.filter((issue) => issue.severity === 'info').length;

  return (
    <section className="admin-data-card admin-account-quality-card">
      <div className="admin-section-title admin-quality-heading">
        <div>
          <h3>账号质量</h3>
          <p>
            严重 {criticalCount} · 注意 {warningCount} · 建议 {infoCount}
          </p>
        </div>
      </div>
      <AdminQualityIssueList issues={issues} compact />
    </section>
  );
}
