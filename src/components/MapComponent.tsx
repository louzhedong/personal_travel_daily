import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTravelStore } from '../store';
import { geoMercator, geoPath, GeoProjection, GeoPath } from 'd3-geo';
import { chinaProvincesGeoJSON } from '../data/china-provinces';

const MapComponent: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const chinaGeoJSON = chinaProvincesGeoJSON;
  
  const { 
    currentMode, 
    marks, 
    cityVisits, 
    users, 
    currentUser,
    setSelectedMark 
  } = useTravelStore();
  
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);

  const mapConfig = useMemo(() => {
    const width = 1000;
    const height = 800;
    
    const projection: GeoProjection = geoMercator()
      .center([104, 35])
      .scale(900)
      .translate([width / 2, height / 2]);
    
    const pathGenerator: GeoPath<any, any> = geoPath().projection(projection);
    
    return { projection, pathGenerator, width, height };
  }, []);

  const getProjection = useMemo(() => {
    if (currentMode === 'domestic') {
      return mapConfig.projection;
    }
    return geoMercator()
      .center([0, 20])
      .scale(150)
      .translate([500, 400]);
  }, [currentMode, mapConfig.projection]);

  const getPathGenerator = useMemo(() => {
    return geoPath().projection(getProjection);
  }, [getProjection]);

  const cityCoords: Record<string, [number, number]> = {
    '北京': [116.405285, 39.904989],
    '上海': [121.4737, 31.2304],
    '广州': [113.2644, 23.1291],
    '深圳': [114.0579, 22.5431],
    '杭州': [120.1551, 30.2741],
    '成都': [104.0668, 30.5728],
    '武汉': [114.3055, 30.5931],
    '西安': [108.9398, 34.3416],
    '南京': [118.7969, 32.0603],
    '重庆': [106.5516, 29.5630],
    '天津': [117.2008, 39.0842],
    '苏州': [120.6195, 31.2990],
    '厦门': [118.0894, 24.4798],
    '青岛': [120.3826, 36.0671],
    '大连': [121.6147, 38.9140],
    '宁波': [121.5498, 29.8683],
    '福州': [119.3062, 26.0745],
    '长沙': [112.9388, 28.2282],
    '郑州': [113.6254, 34.7466],
    '济南': [117.1200, 36.6512],
    '美国': [-98.0, 38.0],
    '日本': [139.0, 35.0],
    '韩国': [127.0, 37.0],
    '泰国': [100.0, 15.0],
    '新加坡': [103.8, 1.35],
    '澳大利亚': [133.0, -27.0],
    '法国': [2.0, 46.0],
    '英国': [-1.0, 52.0],
    '德国': [10.0, 51.0],
    '意大利': [12.0, 42.0],
    '加拿大': [-96.0, 54.0],
    '新西兰': [174.0, -41.0],
    '西班牙': [-3.0, 40.0],
    '葡萄牙': [-8.0, 39.0],
    '希腊': [22.0, 39.0],
    '埃及': [31.0, 30.0],
    '南非': [24.0, -29.0],
    '巴西': [-53.0, -10.0],
    '阿根廷': [-64.0, -34.0],
    '俄罗斯': [100.0, 60.0]
  };

  const modeMarks = marks.filter(mark => mark.type === currentMode);

  const handleMarkerClick = (markId: string) => {
    const mark = marks.find(m => m.id === markId);
    if (mark) {
      setSelectedMark(mark);
      setSelectedMarkId(markId);
    }
  };

  const getCoord = (regionName: string) => {
    const coord = cityCoords[regionName];
    if (coord) {
      return getProjection(coord) || [0, 0];
    }
    return [0, 0];
  };

  const renderChinaProvinces = () => {
    return (chinaGeoJSON.features || []).map((feature: any, index: number) => {
      const path = mapConfig.pathGenerator(feature);
      if (!path) return null;
      
      return (
        <path
          key={`province-${index}`}
          d={path}
          fill="#E6F7FF"
          stroke="#1890FF"
          strokeWidth={1.5}
          style={{ cursor: 'pointer' }}
        />
      );
    });
  };

  const renderWorldMap = () => {
    return (
      <g id="world-map">
        <ellipse cx="500" cy="400" rx="450" ry="250" fill="#F0F9FF" stroke="#1890FF" strokeWidth="1" strokeDasharray="5,5" />
        <rect x="100" y="200" width="150" height="150" fill="#E6F7FF" stroke="#1890FF" strokeWidth="1.5" />
        <rect x="280" y="150" width="200" height="200" fill="#E6F7FF" stroke="#1890FF" strokeWidth="1.5" />
        <rect x="550" y="180" width="200" height="150" fill="#E6F7FF" stroke="#1890FF" strokeWidth="1.5" />
        <rect x="680" y="100" width="150" height="120" fill="#E6F7FF" stroke="#1890FF" strokeWidth="1.5" />
        <rect x="300" y="420" width="180" height="150" fill="#E6F7FF" stroke="#1890FF" strokeWidth="1.5" />
      </g>
    );
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden">
      <svg 
        ref={svgRef} 
        className="w-full h-full" 
        viewBox="0 0 1000 800"
        style={{ overflow: 'visible' }}
      >
        {currentMode === 'domestic' ? renderChinaProvinces() : renderWorldMap()}
        
        {modeMarks.map(mark => {
          const user = users.find(u => u.id === mark.userId);
          if (!user) return null;
          
          const [x, y] = getCoord(mark.regionName);
          if (x === 0 && y === 0) return null;
          
          const isSelected = selectedMarkId === mark.id;
          
          return (
            <g key={mark.id} onClick={() => handleMarkerClick(mark.id)} className="cursor-pointer">
              <circle 
                cx={x} 
                cy={y} 
                r={isSelected ? 8 : 6} 
                fill={user.color} 
                stroke="white" 
                strokeWidth="2"
              />
              <circle 
                cx={x} 
                cy={y} 
                r={isSelected ? 12 : 10} 
                fill={user.color} 
                fillOpacity="0.3"
              />
              <text 
                x={x} 
                y={y - 15} 
                textAnchor="middle" 
                fill="#333" 
                fontSize="12" 
                fontWeight="500"
              >
                {mark.regionName}
              </text>
              
              {isSelected && (
                <g>
                  <rect 
                    x={x - 100} 
                    y={y - 60} 
                    width="200" 
                    height="150" 
                    rx="8" 
                    fill="white" 
                    stroke="#E8F3FF" 
                    strokeWidth="2"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                  />
                  <text 
                    x={x} 
                    y={y - 45} 
                    textAnchor="middle" 
                    fill={user.color} 
                    fontSize="14" 
                    fontWeight="600"
                  >
                    {mark.regionName}
                  </text>
                  <text 
                    x={x} 
                    y={y - 30} 
                    textAnchor="middle" 
                    fill="#666" 
                    fontSize="12"
                  >
                    用户: {user.name}
                  </text>
                  <text 
                    x={x} 
                    y={y - 15} 
                    textAnchor="middle" 
                    fill="#999" 
                    fontSize="11"
                  >
                    访问城市:
                  </text>
                  {cityVisits
                    .filter(visit => visit.markId === mark.id)
                    .slice(0, 3)
                    .map((visit, index) => (
                      <text 
                        key={visit.id} 
                        x={x} 
                        y={y + 5 + index * 12} 
                        textAnchor="middle" 
                        fill="#666" 
                        fontSize="11"
                      >
                        {visit.cityName} ({new Date(visit.visitDate).toLocaleDateString()})
                      </text>
                    ))
                  }
                </g>
              )}
            </g>
          );
        })}        
      </svg>
    </div>
  );
};

export default MapComponent;
