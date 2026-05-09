import type { AdminQualityIssueDto } from '../../lib/api/types';
import {
  ADMIN_QUALITY_SEVERITY_LABELS,
  ADMIN_QUALITY_TYPE_LABELS,
  buildAdminQualityNavigationTarget,
  formatAdminDate,
} from '../../modules/admin/adminPageModel';

interface AdminQualityIssueDrawerProps {
  issue: AdminQualityIssueDto | null;
  onClose: () => void;
  onCopyContext: (issue: AdminQualityIssueDto) => void;
  onMarkViewed: (issue: AdminQualityIssueDto) => void;
  onNavigate: (issue: AdminQualityIssueDto) => void;
}

export default function AdminQualityIssueDrawer({
  issue,
  onClose,
  onCopyContext,
  onMarkViewed,
  onNavigate,
}: AdminQualityIssueDrawerProps) {
  if (!issue) {
    return null;
  }

  const navigationTarget = buildAdminQualityNavigationTarget(issue);

  return (
    <div className="admin-quality-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="admin-quality-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="质量问题详情"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-quality-drawer-header">
          <div>
            <span className={`admin-quality-badge admin-quality-badge-${issue.severity}`}>
              {ADMIN_QUALITY_SEVERITY_LABELS[issue.severity]}
            </span>
            <h2>{issue.title}</h2>
            <p>{ADMIN_QUALITY_TYPE_LABELS[issue.type]}</p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            关闭
          </button>
        </div>

        <dl className="admin-quality-drawer-meta">
          <div>
            <dt>账号</dt>
            <dd>{issue.accountName ?? '系统级'}</dd>
          </div>
          <div>
            <dt>目标</dt>
            <dd>{issue.targetLabel}</dd>
          </div>
          <div>
            <dt>检测时间</dt>
            <dd>{formatAdminDate(issue.detectedAt)}</dd>
          </div>
        </dl>

        <section className="admin-quality-drawer-section">
          <h3>说明</h3>
          <p>{issue.description}</p>
        </section>

        <section className="admin-quality-drawer-section">
          <h3>建议</h3>
          <p>{issue.suggestedAction}</p>
        </section>

        <div className="admin-quality-drawer-actions">
          {navigationTarget ? (
            <button type="button" className="primary-button" onClick={() => onNavigate(issue)}>
              {navigationTarget.label}
            </button>
          ) : null}
          <button type="button" className="ghost-button" onClick={() => onCopyContext(issue)}>
            复制上下文
          </button>
          <button type="button" className="ghost-button" onClick={() => onMarkViewed(issue)}>
            已查看
          </button>
        </div>
      </aside>
    </div>
  );
}
