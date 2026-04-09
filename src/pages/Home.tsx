import React, { useEffect } from 'react';
import { useTravelStore, initializeStore } from '../store';
import MapComponent from '../components/MapComponent';
import MarkManager from '../components/MarkManager';
import UserManager from '../components/UserManager';
import DataManager from '../components/DataManager';

const Home: React.FC = () => {
  const { currentMode, setCurrentMode } = useTravelStore();

  useEffect(() => {
    // 初始化数据
    initializeStore();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">个人旅游记录</h1>
          
          <div className="flex items-center space-x-4">
            {/* 国内/国外切换 */}
            <div className="flex bg-gray-100 p-1 rounded-md">
              <button
                onClick={() => setCurrentMode('domestic')}
                className={`px-4 py-2 rounded-md transition-colors ${currentMode === 'domestic' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}
              >
                国内
              </button>
              <button
                onClick={() => setCurrentMode('international')}
                className={`px-4 py-2 rounded-md transition-colors ${currentMode === 'international' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}
              >
                国外
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧地图区域 */}
          <div className="lg:col-span-2 h-[80vh] rounded-lg overflow-hidden shadow-md">
            <MapComponent />
          </div>
          
          {/* 右侧控制面板 */}
          <div className="lg:col-span-1 space-y-6">
            <MarkManager />
            <UserManager />
            <DataManager />
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white shadow-md mt-6 py-4">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2026 个人旅游记录网站 | 记录每一次美好的旅行</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;