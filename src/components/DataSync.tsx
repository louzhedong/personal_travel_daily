import { useState } from 'react';
import TravelIcon from './TravelIcon';
import type { TravelStore } from '../types';

interface DataSyncProps {
  store: TravelStore;
  variant?: 'panel' | 'dialog';
}

export default function DataSync({ store, variant = 'panel' }: DataSyncProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
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
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={variant === 'dialog' ? 'data-sync-panel data-sync-panel-dialog' : 'data-sync-panel'}>
      <div className="data-sync-header">
        <div className="data-sync-title-group">
          <TravelIcon name="route" size={16} />
          <h3>数据备份</h3>
        </div>
        <p className="data-sync-desc">
          当前版本以云端主数据为准。这里保留导出当前聚合快照的能力，用于手动备份；本地 JSON 导入恢复已暂停开放。
        </p>
      </div>

      <div className="data-sync-actions">
        <button
          className="sync-btn sync-export-btn"
          onClick={handleExport}
          disabled={exporting}
          title="将当前所有数据导出为 JSON 文件"
        >
          <TravelIcon name="spark" size={14} />
          <span>{exporting ? '导出中...' : '导出备份'}</span>
        </button>
      </div>

      <div className="data-sync-cloud-note">
        <p>云端版说明</p>
        <ul>
          <li>当前主数据默认从主业务 API 加载，并写入 MySQL。</li>
          <li>导出的 JSON 仅作为人工备份快照，不再作为应用内恢复入口。</li>
          <li>攻略搜索缓存与正文抓取仍由现有本地缓存和攻略 API 链路处理。</li>
        </ul>
      </div>
    </div>
  );
}
