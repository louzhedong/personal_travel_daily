import type { AdminAuditActionDto, AdminAuditLogDto } from '../../lib/api/types';
import {
  ADMIN_AUDIT_ACTION_LABELS,
  filterAdminAuditLogs,
  formatAdminAuditAction,
  formatAdminDate,
} from '../../modules/admin/adminPageModel';
import FancySelect from '../ui/FancySelect';

interface AdminAuditTrailPanelProps {
  logs: AdminAuditLogDto[];
  loading: boolean;
  actionFilter: AdminAuditActionDto | 'all';
  onActionFilterChange: (value: AdminAuditActionDto | 'all') => void;
}

export default function AdminAuditTrailPanel({
  logs,
  loading,
  actionFilter,
  onActionFilterChange,
}: AdminAuditTrailPanelProps) {
  const filteredLogs = filterAdminAuditLogs(logs, actionFilter);

  return (
    <section className="card admin-audit-panel">
      <div className="admin-section-title admin-audit-heading">
        <div>
          <h2>审计日志</h2>
          <p>只记录后台治理动作</p>
        </div>
        <FancySelect
          value={actionFilter}
          placeholder="动作"
          ariaLabel="审计动作"
          options={[
            { value: 'all', label: '全部动作' },
            ...Object.entries(ADMIN_AUDIT_ACTION_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
          onChange={(value) => onActionFilterChange(value as AdminAuditActionDto | 'all')}
          usePortal
        />
      </div>

      {loading ? <div className="admin-empty-block">正在加载审计日志。</div> : null}
      {!loading && filteredLogs.length === 0 ? <div className="admin-empty-block">暂无审计日志</div> : null}
      {!loading && filteredLogs.length > 0 ? (
        <div className="admin-audit-list">
          {filteredLogs.map((log) => (
            <article key={log.id} className="admin-audit-row">
              <div>
                <strong>{formatAdminAuditAction(log.action)}</strong>
                <p>
                  {log.adminAccountName} · {log.targetKind ?? '后台'} {log.targetId ? `· ${log.targetId}` : ''}
                </p>
              </div>
              <time>{formatAdminDate(log.createdAt)}</time>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
