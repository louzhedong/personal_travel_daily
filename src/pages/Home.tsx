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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 font-sans">
      {/* 顶部导航栏 */}
      <header className="bg-white bg-opacity-90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600 mb-4 md:mb-0">
            <span className="inline-block mr-2">✈️</span> 旅行足迹
          </h1>
          
          <div className="flex items-center space-x-4">
            {/* 国内/国外切换 */}
            <div className="flex bg-green-50 p-1 rounded-full shadow-sm">
              <button
                onClick={() => setCurrentMode('domestic')}
                className={`px-6 py-2 rounded-full transition-all ${currentMode === 'domestic' ? 'bg-green-500 text-white shadow-md' : 'text-green-700 hover:bg-green-100'}`}
              >
                国内
              </button>
              <button
                onClick={() => setCurrentMode('international')}
                className={`px-6 py-2 rounded-full transition-all ${currentMode === 'international' ? 'bg-blue-500 text-white shadow-md' : 'text-blue-700 hover:bg-blue-100'}`}
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
          <div className="lg:col-span-2 h-[80vh] rounded-2xl overflow-hidden shadow-lg">
            <MapComponent />
          </div>
          
          {/* 右侧控制面板 */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-md p-5">
              <MarkManager />
            </div>
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-md p-5">
              <UserManager />
            </div>
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-md p-5">
              <DataManager />
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white bg-opacity-90 backdrop-blur-sm shadow-sm mt-6 py-4">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p className="flex items-center justify-center gap-2">
            <span>🌍</span>
            <span>记录每一次美好的旅行</span>
            <span>✨</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;