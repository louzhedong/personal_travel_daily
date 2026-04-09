import React from 'react';
import { useTravelStore } from '../store';

const DataManager: React.FC = () => {
  const { exportData, importData, clearAllData } = useTravelStore();

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel-record-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        await importData(data);
        alert('数据导入成功！');
      } catch (error) {
        alert('数据导入失败，请检查文件格式是否正确。');
        console.error('数据导入失败:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (window.confirm('确定要清空所有数据吗？此操作不可恢复。')) {
      clearAllData();
      alert('数据已清空！');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-orange-700 flex items-center gap-2">
        <span>💾</span> 数据管理
      </h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-orange-50 rounded-xl">
          <h3 className="text-md font-medium text-orange-700 mb-2 flex items-center gap-2">
            <span>📤</span> 导出数据
          </h3>
          <p className="text-sm text-orange-600 mb-3">将所有旅游记录导出为JSON文件，用于备份或转移数据。</p>
          <button
            onClick={handleExport}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <span>📥</span>
            <span>导出数据</span>
          </button>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-xl">
          <h3 className="text-md font-medium text-blue-700 mb-2 flex items-center gap-2">
            <span>📥</span> 导入数据
          </h3>
          <p className="text-sm text-blue-600 mb-3">从JSON文件导入旅游记录数据，会覆盖现有数据。</p>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          />
        </div>
        
        <div className="p-4 bg-red-50 rounded-xl">
          <h3 className="text-md font-medium text-red-700 mb-2 flex items-center gap-2">
            <span>🗑️</span> 清空数据
          </h3>
          <p className="text-sm text-red-600 mb-3">清空所有旅游记录数据，此操作不可恢复。</p>
          <button
            onClick={handleClearAll}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <span>⚠️</span>
            <span>清空数据</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataManager;