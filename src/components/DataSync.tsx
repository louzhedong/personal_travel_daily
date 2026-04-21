import { useMemo, useRef, useState } from 'react';
import TravelIcon from './TravelIcon';
import type { TravelStore } from '../types';
import {
  createTravelStoreImportPreview,
  isTravelStoreImportPayload,
  normalizeImportedStore,
  type TravelStoreImportPreview,
  type TravelStoreMergeStats,
} from '../lib/storage';

interface DataSyncProps {
  store: TravelStore;
  onRestore: (store: TravelStore) => void;
  variant?: 'panel' | 'dialog';
}

type PreviewFilter = 'all' | 'users' | 'records' | 'skipped';

function createEmptyStats(): TravelStoreMergeStats {
  return {
    usersAdded: 0,
    usersUpdated: 0,
    markersAdded: 0,
    markersUpdated: 0,
    markersSkippedInvalidUser: 0,
  };
}

function getPreviewActionLabel(action: 'add' | 'update' | 'skip') {
  if (action === 'add') {
    return '新增';
  }
  if (action === 'skip') {
    return '跳过';
  }
  return '更新';
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const raw = String(value);
  // RFC4180-ish: quote when containing comma/quote/newline, and escape quotes.
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export default function DataSync({ store, onRestore, variant = 'panel' }: DataSyncProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [mergeStats, setMergeStats] = useState<TravelStoreMergeStats>(createEmptyStats);
  const [resultOpen, setResultOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFilter, setPreviewFilter] = useState<PreviewFilter>('all');
  const [importPreview, setImportPreview] = useState<TravelStoreImportPreview | null>(null);
  const [pendingImportedStore, setPendingImportedStore] = useState<ReturnType<
    typeof normalizeImportedStore
  > | null>(null);

  const previewUsers = useMemo(() => {
    if (!importPreview || previewFilter === 'records' || previewFilter === 'skipped') {
      return [];
    }

    return importPreview.users;
  }, [importPreview, previewFilter]);

  const previewMarkers = useMemo(() => {
    if (!importPreview || previewFilter === 'users') {
      return [];
    }

    if (previewFilter === 'skipped') {
      return importPreview.markers.filter((item) => item.action === 'skip');
    }

    return importPreview.markers;
  }, [importPreview, previewFilter]);

  const handleExportPreviewCsv = () => {
    if (!importPreview) {
      return;
    }

    const datePart = new Date().toISOString().split('T')[0];
    const filterPart = previewFilter;
    const filename = `voyage-atlas-import-preview-${filterPart}-${datePart}.csv`;

    const header = [
      'category',
      'action',
      'id',
      'name',
      'color',
      'userId',
      'userName',
      'scope',
      'scopeId',
      'scopeName',
      'city',
      'note',
      'visitedStartAt',
      'visitedEndAt',
      'createdAt',
      'reason',
    ];

    const rows: Array<Record<string, unknown>> = [];

    previewUsers.forEach((user) => {
      rows.push({
        category: 'user',
        action: user.action,
        id: user.id,
        name: user.name,
        color: user.color,
      });
    });

    previewMarkers.forEach((marker) => {
      rows.push({
        category: previewFilter === 'skipped' ? 'skipped' : 'marker',
        action: marker.action,
        id: marker.id,
        userId: marker.userId,
        userName: marker.userName ?? '',
        scope: marker.scope,
        scopeId: marker.scopeId,
        scopeName: marker.scopeName,
        city: marker.city,
        note: marker.note,
        visitedStartAt: marker.visitedStartAt,
        visitedEndAt: marker.visitedEndAt,
        createdAt: marker.createdAt,
        reason: marker.reason ?? '',
      });
    });

    const csv = [
      header.join(','),
      ...rows.map((row) => header.map((key) => escapeCsvCell(row[key])).join(',')),
    ].join('\r\n');

    try {
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出 CSV 失败:', error);
      alert('导出 CSV 失败，请重试');
    }
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(store, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `voyage-atlas-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const rawData: unknown = JSON.parse(text);

      if (!isTravelStoreImportPayload(rawData)) {
        throw new Error('INVALID_IMPORT_PAYLOAD');
      }

      const importedStore = normalizeImportedStore(rawData);
      if (importedStore.users.length === 0 && importedStore.markers.length === 0) {
        throw new Error('EMPTY_IMPORT_PAYLOAD');
      }

      const preview = createTravelStoreImportPreview(store, importedStore);
      setPendingImportedStore(importedStore);
      setImportPreview(preview);
      setPreviewFilter('all');
      setPreviewOpen(true);
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败：请确认文件为有效的 JSON 备份，且至少包含可导入的用户或旅行记录。');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelPreview = () => {
    setPreviewOpen(false);
    setPreviewFilter('all');
    setImportPreview(null);
    setPendingImportedStore(null);
  };

  const handleConfirmImport = () => {
    if (!pendingImportedStore) {
      handleCancelPreview();
      return;
    }

    const preview = createTravelStoreImportPreview(store, pendingImportedStore);
    onRestore(preview.mergedStore);
    setMergeStats(preview.stats);
    setResultOpen(true);
    setPreviewOpen(false);
    setPreviewFilter('all');
    setImportPreview(null);
    setPendingImportedStore(null);
  };

  return (
    <div className={variant === 'dialog' ? 'data-sync-panel data-sync-panel-dialog' : 'data-sync-panel'}>
      <div className="data-sync-header">
        <div className="data-sync-title-group">
          <TravelIcon name="route" size={16} />
          <h3>数据备份与恢复</h3>
        </div>
        <p className="data-sync-desc">
          所有旅行记录均保存在浏览器本地，清除缓存会导致数据丢失，建议定期导出备份；导入时会按 ID 合并现有数据。
        </p>
      </div>

      <div className="data-sync-actions">
        <button
          className="sync-btn sync-export-btn"
          onClick={handleExport}
          title="将当前所有数据导出为 JSON 文件"
        >
          <TravelIcon name="spark" size={14} />
          <span>导出备份</span>
        </button>

        <button
          className="sync-btn sync-import-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          title="从 JSON 文件按 ID 合并导入数据"
        >
          <TravelIcon name="users" size={14} />
          <span>{importing ? '导入中...' : '导入数据'}</span>
        </button>
        <input
          type="file"
          accept=".json,application/json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </div>

      {resultOpen ? (
        <div className="data-sync-result-backdrop" onClick={() => setResultOpen(false)}>
          <div
            className="data-sync-result-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="data-sync-result-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="data-sync-result-header">
              <div>
                <p className="data-sync-result-eyebrow">导入完成</p>
                <h4 id="data-sync-result-title">已按 ID 合并本地数据</h4>
              </div>
              <button
                type="button"
                className="data-sync-result-close"
                aria-label="关闭导入结果弹窗"
                onClick={() => setResultOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="data-sync-result-grid">
              <div className="data-sync-result-card">
                <span className="data-sync-result-label">新增用户</span>
                <strong>{mergeStats.usersAdded}</strong>
              </div>
              <div className="data-sync-result-card">
                <span className="data-sync-result-label">更新用户</span>
                <strong>{mergeStats.usersUpdated}</strong>
              </div>
              <div className="data-sync-result-card">
                <span className="data-sync-result-label">新增记录</span>
                <strong>{mergeStats.markersAdded}</strong>
              </div>
              <div className="data-sync-result-card">
                <span className="data-sync-result-label">更新记录</span>
                <strong>{mergeStats.markersUpdated}</strong>
              </div>
            </div>

            <p className="data-sync-result-note">
              {mergeStats.markersSkippedInvalidUser > 0
                ? `有 ${mergeStats.markersSkippedInvalidUser} 条记录因缺少有效关联用户而被跳过。`
                : '所有可识别的数据都已成功合并到当前本地数据中。'}
            </p>

            <div className="data-sync-result-actions">
              <button type="button" className="sync-btn sync-export-btn" onClick={() => setResultOpen(false)}>
                我知道了
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {previewOpen && importPreview ? (
        <div className="data-sync-result-backdrop" onClick={handleCancelPreview}>
          <div
            className="data-sync-result-modal data-sync-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="data-sync-preview-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="data-sync-result-header">
              <div>
                <p className="data-sync-result-eyebrow">导入预检查</p>
                <h4 id="data-sync-preview-title">确认后才会写入本地数据</h4>
              </div>
              <button
                type="button"
                className="data-sync-result-close"
                aria-label="关闭导入预览弹窗"
                onClick={handleCancelPreview}
              >
                ×
              </button>
            </div>

            <div className="data-sync-result-grid">
              <div className="data-sync-result-card">
                <span className="data-sync-result-label">新增用户</span>
                <strong>{importPreview.stats.usersAdded}</strong>
              </div>
              <div className="data-sync-result-card">
                <span className="data-sync-result-label">更新用户</span>
                <strong>{importPreview.stats.usersUpdated}</strong>
              </div>
              <div className="data-sync-result-card">
                <span className="data-sync-result-label">新增记录</span>
                <strong>{importPreview.stats.markersAdded}</strong>
              </div>
              <div className="data-sync-result-card">
                <span className="data-sync-result-label">更新记录</span>
                <strong>{importPreview.stats.markersUpdated}</strong>
              </div>
            </div>

            <p className="data-sync-result-note">
              {importPreview.stats.markersSkippedInvalidUser > 0
                ? `有 ${importPreview.stats.markersSkippedInvalidUser} 条记录因缺少有效关联用户而将被跳过。`
                : '所有可识别的数据都可以合并到当前本地数据中。'}
            </p>

            <div className="data-sync-preview-toolbar">
              <div className="data-sync-preview-filter" role="tablist" aria-label="导入预览筛选">
                {([
                  ['all', '全部'],
                  ['users', '用户'],
                  ['records', '记录'],
                  ['skipped', '跳过项'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={previewFilter === value}
                    className={`data-sync-preview-filter-chip${
                      previewFilter === value ? ' active' : ''
                    }`}
                    onClick={() => setPreviewFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="data-sync-preview-export"
                onClick={handleExportPreviewCsv}
                title="导出本次导入明细预览为 CSV（按当前筛选）"
              >
                导出 CSV
              </button>
            </div>

            <div className="data-sync-preview-lists">
              {previewFilter !== 'records' && previewFilter !== 'skipped' ? (
                <div className="data-sync-preview-section">
                  <div className="data-sync-preview-section-title">
                    <strong>用户明细</strong>
                    <span>{previewUsers.length} 条</span>
                  </div>
                  {previewUsers.length > 0 ? (
                    <ul className="data-sync-preview-list" aria-label="用户导入明细">
                      {previewUsers.slice(0, 50).map((user) => (
                        <li key={user.id} className="data-sync-preview-item">
                          <span className={`data-sync-preview-tag data-sync-preview-tag-${user.action}`}>
                            {getPreviewActionLabel(user.action)}
                          </span>
                          <span className="data-sync-preview-primary">{user.name}</span>
                          <span className="data-sync-preview-secondary">{user.id}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="data-sync-preview-empty">未发现可导入用户。</p>
                  )}
                  {previewUsers.length > 50 ? (
                    <p className="data-sync-preview-more">仅展示前 50 条用户明细。</p>
                  ) : null}
                </div>
              ) : null}

              {previewFilter !== 'users' ? (
                <div className="data-sync-preview-section">
                  <div className="data-sync-preview-section-title">
                    <strong>{previewFilter === 'skipped' ? '跳过项明细' : '记录明细'}</strong>
                    <span>{previewMarkers.length} 条</span>
                  </div>
                  {previewMarkers.length > 0 ? (
                    <ul
                      className="data-sync-preview-list"
                      aria-label={previewFilter === 'skipped' ? '跳过项导入明细' : '记录导入明细'}
                    >
                      {previewMarkers.slice(0, 50).map((marker) => (
                        <li key={marker.id} className="data-sync-preview-item">
                          <span className={`data-sync-preview-tag data-sync-preview-tag-${marker.action}`}>
                            {getPreviewActionLabel(marker.action)}
                          </span>
                          <span className="data-sync-preview-primary">
                            {marker.scopeName} · {marker.city}
                          </span>
                          <span className="data-sync-preview-secondary">
                            {marker.userName ?? '未知用户'}
                            {marker.reason ? ` · ${marker.reason}` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="data-sync-preview-empty">
                      {previewFilter === 'skipped' ? '本次导入没有需要跳过的记录。' : '未发现可导入记录。'}
                    </p>
                  )}
                  {previewMarkers.length > 50 ? (
                    <p className="data-sync-preview-more">
                      仅展示前 50 条{previewFilter === 'skipped' ? '跳过项' : '记录'}明细。
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="data-sync-result-actions data-sync-preview-actions">
              <button type="button" className="sync-btn" onClick={handleCancelPreview}>
                取消
              </button>
              <button type="button" className="sync-btn sync-import-btn" onClick={handleConfirmImport}>
                确认导入
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
