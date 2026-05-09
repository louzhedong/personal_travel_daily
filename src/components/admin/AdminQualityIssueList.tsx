import type { AdminQualityIssueDto } from '../../lib/api/types';
import {
  ADMIN_QUALITY_SEVERITY_LABELS,
  ADMIN_QUALITY_TYPE_LABELS,
  formatAdminDate,
} from '../../modules/admin/adminPageModel';

interface AdminQualityIssueListProps {
  issues: AdminQualityIssueDto[];
  compact?: boolean;
  emptyMessage?: string;
  onSelectIssue?: (issue: AdminQualityIssueDto) => void;
  onNavigateIssue?: (issue: AdminQualityIssueDto) => void;
}

export default function AdminQualityIssueList({
  issues,
  compact = false,
  emptyMessage = '暂无质量问题',
  onSelectIssue,
  onNavigateIssue,
}: AdminQualityIssueListProps) {
  if (issues.length === 0) {
    return <div className="admin-empty-block">{emptyMessage}</div>;
  }

  return (
    <div className={compact ? 'admin-quality-list admin-quality-list-compact' : 'admin-quality-list'}>
      {issues.map((issue) => (
        <article key={issue.id} className={`admin-quality-issue admin-quality-issue-${issue.severity}`}>
          <button
            type="button"
            className="admin-quality-issue-main"
            onClick={() => onSelectIssue?.(issue)}
            disabled={!onSelectIssue}
          >
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
          </button>
          {!compact ? (
            <div className="admin-quality-action">
              <span>{issue.suggestedAction}</span>
              {issue.canNavigate && onNavigateIssue ? (
                <button type="button" className="ghost-button" onClick={() => onNavigateIssue(issue)}>
                  定位
                </button>
              ) : null}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
