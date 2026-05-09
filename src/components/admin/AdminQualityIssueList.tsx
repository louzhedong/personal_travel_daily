import type { AdminQualityIssueDto } from '../../lib/api/types';
import {
  ADMIN_QUALITY_SEVERITY_LABELS,
  ADMIN_QUALITY_TYPE_LABELS,
  formatAdminDate,
} from '../../modules/admin/adminPageModel';

interface AdminQualityIssueListProps {
  issues: AdminQualityIssueDto[];
  compact?: boolean;
}

export default function AdminQualityIssueList({ issues, compact = false }: AdminQualityIssueListProps) {
  if (issues.length === 0) {
    return <div className="admin-empty-block">暂无质量问题</div>;
  }

  return (
    <div className={compact ? 'admin-quality-list admin-quality-list-compact' : 'admin-quality-list'}>
      {issues.map((issue) => (
        <article key={issue.id} className={`admin-quality-issue admin-quality-issue-${issue.severity}`}>
          <div className="admin-quality-issue-main">
            <div className="admin-quality-issue-title">
              <span className={`admin-quality-badge admin-quality-badge-${issue.severity}`}>
                {ADMIN_QUALITY_SEVERITY_LABELS[issue.severity]}
              </span>
              <span className="admin-quality-type">{ADMIN_QUALITY_TYPE_LABELS[issue.type]}</span>
              <strong>{issue.title}</strong>
            </div>
            <p>{issue.description}</p>
            <div className="admin-quality-meta">
              {issue.accountName ? <span>{issue.accountName}</span> : null}
              <span>{issue.targetLabel}</span>
              <span>{formatAdminDate(issue.detectedAt)}</span>
            </div>
          </div>
          {!compact ? <div className="admin-quality-action">{issue.suggestedAction}</div> : null}
        </article>
      ))}
    </div>
  );
}
