import React, { useEffect, useRef, useState } from 'react';
import { useTravelStore } from '../store';
import { MapMarker } from '../types';

// 模拟地理坐标数据（使用SVG坐标）
const REGION_COORDS: Record<string, [number, number]> = {
  // 国内省份
  '北京': [380, 120],
  '上海': [420, 200],
  '广州': [360, 280],
  '深圳': [365, 290],
  '杭州': [410, 190],
  '成都': [220, 220],
  '武汉': [320, 220],
  '西安': [250, 180],
  '南京': [390, 180],
  '重庆': [260, 240],
  '天津': [390, 130],
  '苏州': [415, 195],
  '厦门': [380, 260],
  '青岛': [395, 150],
  '大连': [430, 140],
  '宁波': [415, 180],
  '福州': [370, 250],
  '长沙': [310, 240],
  '郑州': [330, 200],
  '济南': [370, 160],
  
  // 国外国家
  '美国': [100, 150],
  '日本': [480, 140],
  '韩国': [460, 130],
  '泰国': [320, 320],
  '新加坡': [330, 340],
  '澳大利亚': [280, 400],
  '法国': [220, 100],
  '英国': [190, 80],
  '德国': [240, 110],
  '意大利': [250, 130],
  '加拿大': [120, 80],
  '新西兰': [300, 420],
  '西班牙': [230, 140],
  '葡萄牙': [220, 150],
  '希腊': [260, 150],
  '埃及': [280, 180],
  '南非': [280, 320],
  '巴西': [80, 280],
  '阿根廷': [90, 340],
  '俄罗斯': [300, 60],
};

// 更精确的中国地图SVG路径
const chinaMapPath = (
  <g id="china-map">
    {/* 中国地图轮廓 - 更精确的路径 */}
    <path 
      d="M340,60 L380,70 L420,60 L460,80 L480,120 L470,160 L450,180 L430,170 L410,180 L390,160 L380,140 L360,130 L340,140 L320,120 L300,100 L280,80 L260,90 L240,70 L220,80 L200,100 L180,120 L160,150 L140,180 L130,220 L120,260 L130,300 L150,330 L180,350 L220,360 L260,350 L290,330 L320,310 L340,290 L360,270 L380,250 L400,230 L420,210 L440,200 L460,210 L480,230 L490,260 L480,290 L460,310 L440,320 L420,310 L400,290 L380,280 L360,290 L340,300 L320,310 L300,300 L280,280 L260,260 L240,240 L220,220 L200,200 L180,180 L160,160 L140,140 L120,120 L100,100 L90,80 L100,60 L120,50 L160,40 L200,50 L240,40 L280,50" 
      fill="#E6F7FF" 
      stroke="#1890FF" 
      strokeWidth="2"
    />
    
    {/* 省份分界线 - 更详细的路径 */}
    {/* 华北地区 */}
    <path d="M380,120 L380,180" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M340,140 L340,200" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M300,160 L300,220" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    
    {/* 华东地区 */}
    <path d="M400,180 L400,240" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M360,200 L360,260" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    
    {/* 中南地区 */}
    <path d="M320,220 L320,280" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    
    {/* 西南地区 */}
    <path d="M260,200 L260,260" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M220,200 L220,260" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    
    {/* 西北地区 */}
    <path d="M240,160 L240,220" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    
    {/* 东北地区 */}
    <path d="M420,120 L420,180" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    
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

// 详细的世界地图SVG路径
const worldMapPath = (
  <g id="world-map">
    {/* 世界地图轮廓 */}
    <path 
      d="M100,80 L150,60 L200,70 L250,50 L300,60 L350,80 L400,100 L450,120 L480,150 L490,190 L480,230 L450,260 L400,280 L350,290 L300,280 L250,260 L200,240 L150,220 L100,200 L80,160 L90,120 Z" 
      fill="#E6F7FF" 
      stroke="#1890FF" 
      strokeWidth="2"
    />
    <path 
      d="M250,300 L300,290 L350,300 L380,320 L390,350 L380,380 L350,400 L300,410 L250,400 L220,380 L210,350 L220,320 Z" 
      fill="#E6F7FF" 
      stroke="#1890FF" 
      strokeWidth="2"
    />
    <path 
      d="M80,220 L120,210 L160,220 L190,240 L200,270 L190,300 L160,320 L120,330 L80,320 L60,290 L50,260 L60,230 Z" 
      fill="#E6F7FF" 
      stroke="#1890FF" 
      strokeWidth="2"
    />
    
    {/* 国家分界线 */}
    <path d="M180,100 L180,200" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />    <path d="M280,100 L280,200" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />    <path d="M380,100 L380,200" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />    <path d="M140,150 L240,150" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />    <path d="M240,150 L340,150" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />    <path d="M340,150 L440,150" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />    <path d="M250,340 L350,340" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />    <path d="M100,260 L180,260" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />    
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
        viewBox="0 0 500 450"
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