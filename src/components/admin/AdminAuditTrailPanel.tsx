import { useEffect, useMemo, useState } from 'react';
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

const PAGE_SIZE = 8;

export default function AdminAuditTrailPanel({
  logs,
  loading,
  actionFilter,
  onActionFilterChange,
}: AdminAuditTrailPanelProps) {
  const filteredLogs = filterAdminAuditLogs(logs, actionFilter);
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  useEffect(() => {
    setPage(1);
  }, [actionFilter, filteredLogs.length]);
  const visibleLogs = useMemo(
    () => filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredLogs, page],
  );

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
        <>
          <div className="admin-audit-list">
            {visibleLogs.map((log) => (
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
          {pageCount > 1 ? (
            <nav className="admin-pagination" aria-label="审计日志分页">
              <button
                type="button"
                className="ghost-button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                上一页
              </button>
              <span>
                第 {page} / {pageCount} 页 · 共 {filteredLogs.length} 条
              </span>
              <button
                type="button"
                className="ghost-button"
                disabled={page >= pageCount}
                onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              >
                下一页
              </button>
            </nav>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
