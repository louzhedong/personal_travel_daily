import React, { useEffect, useRef, useState } from 'react';
import { useTravelStore } from '../store';
import { MapMarker } from '../types';

// 模拟地理坐标数据（简化版，使用SVG坐标）
const REGION_COORDS: Record<string, [number, number]> = {
  // 国内省份
  '北京': [150, 80],
  '上海': [200, 150],
  '广州': [180, 220],
  '深圳': [190, 230],
  '杭州': [190, 140],
  '成都': [80, 160],
  '武汉': [140, 160],
  '西安': [100, 120],
  '南京': [170, 130],
  '重庆': [90, 180],
  
  // 国外国家
  '美国': [400, 100],
  '日本': [350, 120],
  '韩国': [330, 110],
  '泰国': [300, 180],
  '新加坡': [310, 200],
  '澳大利亚': [450, 220],
  '法国': [250, 80],
  '英国': [230, 70],
  '德国': [250, 90],
  '意大利': [260, 100],
};

// 简化的地图SVG路径
const mapPaths = {
  domestic: (
    <g id="domestic-map">
      {/* 简化的中国地图轮廓 */}
      <path 
        d="M100,50 Q150,30 200,50 T300,70 Q320,100 310,150 T280,200 Q250,230 200,240 T100,220 Q80,180 70,130 T100,50" 
        fill="#E6F7FF" 
        stroke="#91D5FF" 
        strokeWidth="2"
      />
      {/* 一些主要城市的点 */}
      {Object.entries(REGION_COORDS).filter(([key]) => [
        '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'
      ].includes(key)).map(([name, [x, y]]) => (
        <circle key={name} cx={x} cy={y} r="3" fill="#1890FF" />
      ))}
    </g>
  ),
  international: (
    <g id="international-map">
      {/* 简化的世界地图轮廓 */}
      <path 
        d="M200,40 Q250,20 300,40 T400,60 Q450,80 460,120 T450,180 Q420,220 350,240 T250,230 Q220,200 210,150 T200,40" 
        fill="#E6F7FF" 
        stroke="#91D5FF" 
        strokeWidth="2"
      />
      {/* 一些主要国家的点 */}
      {Object.entries(REGION_COORDS).filter(([key]) => [
        '美国', '日本', '韩国', '泰国', '新加坡', '澳大利亚', '法国', '英国', '德国', '意大利'
      ].includes(key)).map(([name, [x, y]]) => (
        <circle key={name} cx={x} cy={y} r="3" fill="#1890FF" />
      ))}
    </g>
  )
};

const MapComponent: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const { 
    currentMode, 
    marks, 
    cityVisits, 
    users, 
    currentUser,
    setSelectedMark 
  } = useTravelStore();
  
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);

  // 过滤当前模式的标记
  const modeMarks = marks.filter(mark => mark.type === currentMode);

  const handleMarkerClick = (markId: string) => {
    const mark = marks.find(m => m.id === markId);
    if (mark) {
      setSelectedMark(mark);
      setSelectedMarkId(markId);
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden">
      <svg 
        ref={svgRef} 
        className="w-full h-full" 
        viewBox="0 0 500 280"
        style={{ overflow: 'visible' }}
      >
        {/* 绘制地图背景 */}
        {currentMode === 'domestic' ? mapPaths.domestic : mapPaths.international}
        
        {/* 绘制用户标记 */}
        {modeMarks.map(mark => {
          const user = users.find(u => u.id === mark.userId);
          if (!user) return null;
          
          const coord = REGION_COORDS[mark.regionName] || [0, 0];
          if (coord[0] === 0 && coord[1] === 0) return null;
          
          const [x, y] = coord;
          const isSelected = selectedMarkId === mark.id;
          
          return (
            <g key={mark.id} onClick={() => handleMarkerClick(mark.id)} className="cursor-pointer">
              {/* 标记点 */}
              <circle 
                cx={x} 
                cy={y} 
                r={isSelected ? 8 : 6} 
                fill={user.color} 
                stroke="white" 
                strokeWidth="2"
              />
              {/* 标记光晕 */}
              <circle 
                cx={x} 
                cy={y} 
                r={isSelected ? 12 : 10} 
                fill={user.color} 
                fillOpacity="0.3"
              />
              {/* 标记文本 */}
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
              
              {/* 显示城市访问信息 */}
              {isSelected && (
                <g>
                  <rect 
                    x={x - 100} 
                    y={y - 60} 
                    width="200" 
                    height="auto" 
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