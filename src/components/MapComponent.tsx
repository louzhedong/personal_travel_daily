import React, { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { useTravelStore } from '../store';
import { MapMarker } from '../types';

// 模拟地理坐标数据
const REGION_COORDS: Record<string, [number, number]> = {
  // 国内省份
  '北京': [116.4074, 39.9042],
  '上海': [121.4737, 31.2304],
  '广州': [113.2644, 23.1291],
  '深圳': [114.0579, 22.5431],
  '杭州': [120.1551, 30.2741],
  '成都': [104.0668, 30.5728],
  '武汉': [114.3055, 30.5928],
  '西安': [108.9402, 34.3416],
  '南京': [118.7969, 32.0603],
  '重庆': [106.5504, 29.5633],
  
  // 国外国家
  '美国': [-95.7129, 37.0902],
  '日本': [138.2529, 36.2048],
  '韩国': [127.7669, 35.9078],
  '泰国': [100.5018, 13.7563],
  '新加坡': [103.8198, 1.3521],
  '澳大利亚': [133.7751, -25.2744],
  '法国': [2.2137, 46.2276],
  '英国': [-3.4359, 55.3781],
  '德国': [10.4515, 51.1657],
  '意大利': [12.5674, 41.8719],
};

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRefs = useRef<Map<string, any>>(new Map());
  
  const { 
    currentMode, 
    marks, 
    cityVisits, 
    users, 
    currentUser,
    setSelectedMark 
  } = useTravelStore();
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initMap = async () => {
      try {
        setLoading(true);
        
        const AMap = await AMapLoader.load({
          key: 'your-amap-api-key', // 请替换为实际的高德地图API密钥
          version: '2.0',
          plugins: ['AMap.Marker', 'AMap.InfoWindow'],
        });
        
        if (!isMounted || !mapRef.current) return;
        
        // 初始化地图
        mapInstance.current = new AMap.Map(mapRef.current, {
          zoom: currentMode === 'domestic' ? 5 : 3,
          center: currentMode === 'domestic' ? [104.1954, 35.8617] : [0, 0],
          viewMode: '3D',
        });
        
        // 添加标记
        updateMarkers();
        setLoading(false);
      } catch (error) {
        console.error('地图初始化失败:', error);
        setLoading(false);
      }
    };
    
    initMap();
    
    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstance.current) {
      // 更新地图中心和缩放级别
      mapInstance.current.setZoom(currentMode === 'domestic' ? 5 : 3);
      mapInstance.current.setCenter(currentMode === 'domestic' ? [104.1954, 35.8617] : [0, 0]);
      
      // 更新标记
      updateMarkers();
    }
  }, [currentMode, marks, cityVisits, users]);

  const updateMarkers = () => {
    if (!mapInstance.current) return;
    
    // 清除现有标记
    markerRefs.current.forEach(marker => {
      marker.setMap(null);
    });
    markerRefs.current.clear();
    
    // 过滤当前模式的标记
    const modeMarks = marks.filter(mark => mark.type === currentMode);
    
    modeMarks.forEach(mark => {
      const user = users.find(u => u.id === mark.userId);
      if (!user) return;
      
      const coord = REGION_COORDS[mark.regionName] || [0, 0];
      if (coord[0] === 0 && coord[1] === 0) return;
      
      // 创建标记
      const marker = new (window as any).AMap.Marker({
        position: coord,
        title: mark.regionName,
        icon: new (window as any).AMap.Icon({
          size: new (window as any).AMap.Size(30, 30),
          image: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${user.color}'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E`,
          imageSize: new (window as any).AMap.Size(30, 30),
        }),
      });
      
      // 获取该标记关联的城市访问
      const relatedCityVisits = cityVisits.filter(visit => visit.markId === mark.id);
      
      // 创建信息窗口
      const infoWindow = new (window as any).AMap.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 300px;">
            <h3 style="margin: 0 0 10px 0; color: ${user.color};">${mark.regionName}</h3>
            <p style="margin: 0 0 10px 0;">用户: ${user.name}</p>
            <h4 style="margin: 10px 0 5px 0;">访问城市:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              ${relatedCityVisits.map(visit => (
                `<li key="${visit.id}">${visit.cityName} (${new Date(visit.visitDate).toLocaleDateString()})</li>`
              )).join('')}
            </ul>
          </div>
        `,
        offset: new (window as any).AMap.Pixel(0, -30),
      });
      
      // 绑定点击事件
      marker.on('click', () => {
        infoWindow.open(mapInstance.current, coord);
        setSelectedMark(mark);
      });
      
      // 添加到地图
      marker.setMap(mapInstance.current);
      markerRefs.current.set(mark.id, marker);
    });
  };

  return (
    <div className="relative w-full h-full">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="text-lg font-medium">地图加载中...</div>
        </div>
      ) : null}
      <div ref={mapRef} className="w-full h-full"></div>
    </div>
  );
};

export default MapComponent;