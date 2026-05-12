import type { AtlasPlaceRegionDto, AtlasReplayItemDto } from '../../lib/api/types';

interface AtlasMapProps {
  regions: AtlasPlaceRegionDto[];
  currentItem?: AtlasReplayItemDto;
}

export default function AtlasMap({ regions, currentItem }: AtlasMapProps) {
  const visibleRegions = regions.slice(0, 12);
  return (
    <div className="atlas-map" aria-label="旅行地图时间机器地图">
      <svg viewBox="0 0 920 520" role="img" aria-label="旅行足迹热力地图">
        <defs>
          <linearGradient id="atlas-map-bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#f8fafc" />
            <stop offset="1" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="920" height="520" rx="36" fill="url(#atlas-map-bg)" />
        {visibleRegions.map((region, index) => {
          const x = 120 + (index % 4) * 200;
          const y = 130 + Math.floor(index / 4) * 128;
          const radius = 22 + Math.min(region.markerCount, 24);
          const active = currentItem?.scopeId === region.scopeId || currentItem?.scopeName === region.scopeName;
          return (
            <g key={`${region.scope}:${region.scopeId}`}>
              <circle cx={x} cy={y} r={radius} fill={active ? '#0f172a' : '#334155'} opacity={active ? 0.34 : 0.14} />
              <circle cx={x} cy={y} r={5} fill="#0f172a" />
              <text x={x} y={y + radius + 24} textAnchor="middle" fill="#334155" fontSize="18" fontWeight="800">
                {region.scopeName}
              </text>
            </g>
          );
        })}
        {currentItem ? (
          <text x="48" y="470" fill="#0f172a" fontSize="24" fontWeight="900">
            当前：{currentItem.title} · {currentItem.visitedStartAt}
          </text>
        ) : null}
      </svg>
    </div>
  );
}
