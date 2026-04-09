import React, { useEffect, useRef, useState } from 'react';
import { useTravelStore } from '../store';
import { MapMarker } from '../types';

// 模拟地理坐标数据（使用SVG坐标）
const REGION_COORDS: Record<string, [number, number]> = {
  // 国内省份 - 基于参考图片的位置
  '北京': [720, 180],
  '上海': [820, 320],
  '广州': [740, 480],
  '深圳': [750, 500],
  '杭州': [800, 300],
  '成都': [480, 380],
  '武汉': [650, 380],
  '西安': [520, 280],
  '南京': [760, 280],
  '重庆': [560, 430],
  '天津': [740, 200],
  '苏州': [810, 310],
  '厦门': [780, 460],
  '青岛': [760, 230],
  '大连': [860, 200],
  '宁波': [810, 290],
  '福州': [770, 430],
  '长沙': [630, 410],
  '郑州': [680, 330],
  '济南': [740, 250],
  
  // 国外国家
  '美国': [100, 150],
  '日本': [950, 250],
  '韩国': [900, 230],
  '泰国': [600, 580],
  '新加坡': [620, 620],
  '澳大利亚': [550, 700],
  '法国': [300, 150],
  '英国': [250, 120],
  '德国': [320, 170],
  '意大利': [350, 200],
  '加拿大': [150, 80],
  '新西兰': [580, 750],
  '西班牙': [330, 220],
  '葡萄牙': [310, 230],
  '希腊': [380, 230],
  '埃及': [400, 280],
  '南非': [450, 600],
  '巴西': [150, 450],
  '阿根廷': [180, 550],
  '俄罗斯': [500, 80],
};

// 鸡形状的中国地图SVG路径
const chinaMapPath = (
  <g id="china-map">
    {/* 中国地图轮廓 - 鸡形状 */}
    <path 
      d="M880,150 L920,180 L950,220 L940,280 L900,320 L870,300 L830,310 L790,290 L750,270 L710,260 L670,270 L630,250 L590,230 L550,240 L510,230 L470,240 L430,230 L390,250 L350,240 L310,260 L270,240 L230,260 L200,290 L180,350 L190,400 L230,430 L270,410 L310,420 L350,410 L390,430 L430,410 L470,420 L510,410 L550,430 L590,420 L630,430 L670,420 L710,430 L750,420 L790,430 L830,420 L870,430 L910,410 L950,450 L930,550 L890,580 L850,560 L810,540 L770,550 L730,540 L690,550 L650,540 L610,550 L570,540 L530,550 L490,540 L450,550 L410,540 L370,550 L330,540 L290,550 L250,540 L220,520 L200,490 L180,450 L190,400 L230,380 L270,390 L310,380 L350,390 L390,380 L430,390 L470,380 L510,390 L550,380 L590,390 L630,380 L670,390 L710,380 L750,390 L790,380 L830,390 L870,380 L910,390 L950,380 L930,300 L900,280 L870,290 L830,280 L790,290 L750,280 L710,290 L670,280 L630,290 L590,280 L550,290 L510,280 L470,290 L430,280 L390,290 L350,280 L310,290 L270,280 L230,290 L200,280 L180,300 L150,250 L170,200 L200,160 L240,130 L300,100 L350,90 L400,100 L450,110 L500,100 L550,110 L600,100 L650,110 L700,100 L750,120 L800,140 L850,160" 
      fill="#E6F7FF" 
      stroke="#1890FF" 
      strokeWidth="2"
    />
    
    {/* 省份详细分界线 - 鸡形状地图 */}
    {/* 东北三省 */}
    <path d="M850,190 L850,310" stroke="#91D5FF" strokeWidth="1" />
    <path d="M880,210 L880,290" stroke="#91D5FF" strokeWidth="1" />
    
    {/* 华北地区 */}
    <path d="M720,170 L720,290" stroke="#91D5FF" strokeWidth="1" />
    <path d="M680,210 L680,270" stroke="#91D5FF" strokeWidth="1" />
    
    {/* 华东地区 */}
    <path d="M760,250 L760,370" stroke="#91D5FF" strokeWidth="1" />
    <path d="M800,290 L800,390" stroke="#91D5FF" strokeWidth="1" />
    
    {/* 中南地区 */}
    <path d="M650,310 L650,440" stroke="#91D5FF" strokeWidth="1" />
    <path d="M610,350 L610,420" stroke="#91D5FF" strokeWidth="1" />
    
    {/* 西南地区 */}
    <path d="M500,330 L500,470" stroke="#91D5FF" strokeWidth="1" />
    <path d="M460,370 L460,440" stroke="#91D5FF" strokeWidth="1" />
    
    {/* 西北地区 */}
    <path d="M400,270 L400,410" stroke="#91D5FF" strokeWidth="1" />
    <path d="M360,310 L360,370" stroke="#91D5FF" strokeWidth="1" />
    
    {/* 主要城市标记 */}
    {Object.entries(REGION_COORDS).filter(([key]) => [
      '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆',
      '天津', '苏州', '厦门', '青岛', '大连', '宁波', '福州', '长沙', '郑州', '济南'
    ].includes(key)).map(([name, [x, y]]) => (
      <g key={name}>
        <circle cx={x} cy={y} r="3" fill="#1890FF" />
        <text x={x + 8} y={y - 5} fill="#333" fontSize="12">{name}</text>
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
    <path d="M180,100 L180,200" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M280,100 L280,200" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M380,100 L380,200" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M140,150 L240,150" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M240,150 L340,150" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M340,150 L440,150" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M250,340 L350,340" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M100,260 L180,260" stroke="#91D5FF" strokeWidth="1" strokeDasharray="2,2" />
    
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
        viewBox="0 0 1000 800"
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