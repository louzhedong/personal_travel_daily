import { useState } from 'react';
import TravelIcon from './ui/TravelIcon';
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
        <p className="data-sync-desc">导出当前快照，用于手动备份。</p>
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
        <p>说明</p>
        <ul>
          <li>主数据以云端为准。</li>
          <li>JSON 仅作人工备份。</li>
        </ul>
      </div>
    </div>
  );
}
