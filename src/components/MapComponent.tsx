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
  '天津': [145, 90],
  '苏州': [195, 145],
  '厦门': [195, 200],
  '青岛': [160, 110],
  '大连': [170, 90],
  '宁波': [195, 135],
  '福州': [190, 190],
  '长沙': [130, 175],
  '郑州': [130, 130],
  '济南': [150, 120],
  
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
  '加拿大': [400, 60],
  '新西兰': [460, 240],
  '西班牙': [260, 90],
  '葡萄牙': [250, 95],
  '希腊': [270, 110],
  '埃及': [270, 140],
  '南非': [300, 240],
  '巴西': [450, 180],
  '阿根廷': [460, 210],
  '俄罗斯': [300, 60],
};

// 更详细的中国地图SVG路径（简化版）
const chinaMapPath = (
  <g id="china-map">
    {/* 中国地图轮廓 */}
    <path 
      d="M100,50 Q150,30 200,50 T300,70 Q320,100 310,150 T280,200 Q250,230 200,240 T100,220 Q80,180 70,130 T100,50" 
      fill="#E6F7FF" 
      stroke="#91D5FF" 
      strokeWidth="2"
    />
    
    {/* 省份分界线 */}
    <path d="M150,80 L150,150" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M100,120 L200,120" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M100,160 L200,160" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M100,200 L200,200" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M120,50 L120,220" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M180,50 L180,220" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    
    {/* 主要城市标记 */}
    {Object.entries(REGION_COORDS).filter(([key]) => [
      '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆',
      '天津', '苏州', '厦门', '青岛', '大连', '宁波', '福州', '长沙', '郑州', '济南'
    ].includes(key)).map(([name, [x, y]]) => (
      <g key={name}>
        <circle cx={x} cy={y} r="3" fill="#1890FF" />
        <text x={x + 5} y={y - 5} fill="#333" fontSize="10">{name}</text>
      </g>
    ))}
  </g>
);

// 更详细的世界地图SVG路径（简化版）
const worldMapPath = (
  <g id="world-map">
    {/* 世界地图轮廓 */}
    <path 
      d="M200,40 Q250,20 300,40 T400,60 Q450,80 460,120 T450,180 Q420,220 350,240 T250,230 Q220,200 210,150 T200,40" 
      fill="#E6F7FF" 
      stroke="#91D5FF" 
      strokeWidth="2"
    />
    
    {/* 国家分界线 */}
    <path d="M330,70 L330,130" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M280,70 L280,130" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M380,70 L380,130" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M430,70 L430,130" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M250,100 L350,100" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M250,140 L350,140" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M350,140 L450,140" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M350,180 L450,180" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    
    {/* 主要国家标记 */}
    {Object.entries(REGION_COORDS).filter(([key]) => [
      '美国', '日本', '韩国', '泰国', '新加坡', '澳大利亚', '法国', '英国', '德国', '意大利',
      '加拿大', '新西兰', '西班牙', '葡萄牙', '希腊', '埃及', '南非', '巴西', '阿根廷', '俄罗斯'
    ].includes(key)).map(([name, [x, y]]) => (
      <g key={name}>
        <circle cx={x} cy={y} r="3" fill="#1890FF" />
        <text x={x + 5} y={y - 5} fill="#333" fontSize="10">{name}</text>
      </g>
    ))}
  </g>
);

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
        {currentMode === 'domestic' ? chinaMapPath : worldMapPath}
        
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