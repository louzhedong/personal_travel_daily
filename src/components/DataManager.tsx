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
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">数据管理</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-md font-medium mb-2">导出数据</h3>
          <p className="text-sm text-gray-600 mb-2">将所有旅游记录导出为JSON文件，用于备份或转移数据。</p>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            导出数据
          </button>
        </div>
        
        <div>
          <h3 className="text-md font-medium mb-2">导入数据</h3>
          <p className="text-sm text-gray-600 mb-2">从JSON文件导入旅游记录数据，会覆盖现有数据。</p>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <h3 className="text-md font-medium mb-2">清空数据</h3>
          <p className="text-sm text-gray-600 mb-2">清空所有旅游记录数据，此操作不可恢复。</p>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            清空数据
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataManager;