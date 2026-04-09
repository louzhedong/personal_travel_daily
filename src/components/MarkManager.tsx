import React, { useState, useEffect } from 'react';
import { useTravelStore } from '../store';

// 省份/国家数据
const REGIONS = {
  domestic: [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆',
    '天津', '苏州', '厦门', '青岛', '大连', '宁波', '福州', '长沙', '郑州', '济南'
  ],
  international: [
    '美国', '日本', '韩国', '泰国', '新加坡', '澳大利亚', '法国', '英国', '德国', '意大利',
    '加拿大', '新西兰', '西班牙', '葡萄牙', '希腊', '埃及', '南非', '巴西', '阿根廷', '俄罗斯'
  ]
};

// 城市数据（模拟）
const CITIES: Record<string, string[]> = {
  '北京': ['北京市'],
  '上海': ['上海市'],
  '广州': ['广州市'],
  '深圳': ['深圳市'],
  '杭州': ['杭州市'],
  '成都': ['成都市'],
  '武汉': ['武汉市'],
  '西安': ['西安市'],
  '南京': ['南京市'],
  '重庆': ['重庆市'],
  '美国': ['纽约', '洛杉矶', '芝加哥', '迈阿密', '旧金山'],
  '日本': ['东京', '大阪', '京都', '北海道', '福冈'],
  '韩国': ['首尔', '釜山', '济州岛', '仁川', '大邱'],
  '泰国': ['曼谷', '清迈', '普吉岛', '芭提雅', '苏梅岛'],
  '新加坡': ['新加坡市'],
  '澳大利亚': ['悉尼', '墨尔本', '布里斯班', '珀斯', '阿德莱德'],
  '法国': ['巴黎', '马赛', '里昂', '尼斯', '戛纳'],
  '英国': ['伦敦', '曼彻斯特', '利物浦', '爱丁堡', '格拉斯哥'],
  '德国': ['柏林', '慕尼黑', '汉堡', '法兰克福', '科隆'],
  '意大利': ['罗马', '米兰', '威尼斯', '佛罗伦萨', '那不勒斯']
};

const MarkManager: React.FC = () => {
  const { 
    currentMode, 
    currentUser, 
    isAddingMark, 
    setIsAddingMark, 
    addMark, 
    addCityVisit,
    selectedMark,
    cityVisits
  } = useTravelStore();
  
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // 过滤当前模式的区域
  const currentRegions = REGIONS[currentMode];
  
  // 根据选择的区域过滤城市
  const filteredCities = selectedRegion ? CITIES[selectedRegion] || [] : [];
  
  // 获取当前标记的城市访问
  const currentCityVisits = selectedMark ? cityVisits.filter(visit => visit.markId === selectedMark.id) : [];

  const handleAddMark = async () => {
    if (!currentUser || !selectedRegion) return;
    
    await addMark({
      userId: currentUser.id,
      type: currentMode,
      regionId: selectedRegion,
      regionName: selectedRegion
    });
    
    // 重置表单
    setSelectedRegion('');
    setSelectedCity('');
    setVisitDate('');
    setDescription('');
    setImageUrl('');
  };
  
  const handleAddCityVisit = async () => {
    if (!selectedMark || !selectedCity || !visitDate) return;
    
    await addCityVisit({
      markId: selectedMark.id,
      cityName: selectedCity,
      visitDate: new Date(visitDate).getTime(),
      description,
      imageUrl
    });
    
    // 重置表单
    setSelectedCity('');
    setVisitDate('');
    setDescription('');
    setImageUrl('');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">标记管理</h2>
      
      {!isAddingMark ? (
        <button 
          onClick={() => setIsAddingMark(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          添加新标记
        </button>
      ) : (
        <div className="space-y-4">
          <h3 className="text-md font-medium">添加{currentMode === 'domestic' ? '省份' : '国家'}标记</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择{currentMode === 'domestic' ? '省份' : '国家'}
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择</option>
              {currentRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleAddMark}
            disabled={!selectedRegion}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            保存标记
          </button>
          
          <button 
            onClick={() => setIsAddingMark(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
        </div>
      )}
      
      {selectedMark && (
        <div className="mt-6 space-y-4">
          <h3 className="text-md font-medium">{selectedMark.regionName} - 添加城市访问</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择城市
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择</option>
              {filteredCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              访问日期
            </label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              游玩描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入游玩体验..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              图片链接（可选）
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="请输入图片URL..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button 
            onClick={handleAddCityVisit}
            disabled={!selectedCity || !visitDate}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            添加城市访问
          </button>
          
          {currentCityVisits.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">已添加的城市：</h4>
              <ul className="space-y-2">
                {currentCityVisits.map(visit => (
                  <li key={visit.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div>
                      <span className="font-medium">{visit.cityName}</span>
                      <span className="text-sm text-gray-500 ml-2">({new Date(visit.visitDate).toLocaleDateString()})</span>
                    </div>
                    <div className="text-sm text-gray-500">{visit.description.substring(0, 20)}...</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarkManager;