import TravelIcon, { withIconVars } from './ui/TravelIcon';
import type { Scope, UserProfile, VisitMarker } from '../types';

interface StatsPanelProps {
  scope: Scope;
  markers: VisitMarker[];
  users: UserProfile[];
}

export function StatsPanel({ scope, markers, users }: StatsPanelProps) {
  const visitedRegions = new Set(markers.map((item) => item.scopeId)).size;
  const activeUsers = new Set(markers.map((item) => item.userId)).size;
  const cards = [
    {
      label: '当前模式',
      value: scope === 'domestic' ? '国内旅行' : '国际旅行',
      caption: scope === 'domestic' ? '适合梳理省市周游与周末短途记忆' : '适合收藏跨国旅行与远方目的地灵感',
      icon: 'compass' as const,
      className: 'stat-card-blue',
      iconStyle: withIconVars('#2563eb', 'rgba(37,99,235,0.12)'),
    },
    {
      label: '总标记数',
      value: String(markers.length),
      caption: markers.length > 0 ? '每一次停留都在累积你的旅行故事密度' : '从第一条记录开始，慢慢铺开自己的旅行版图',
      icon: 'pin' as const,
      className: 'stat-card-orange',
      iconStyle: withIconVars('#f97316', 'rgba(249,115,22,0.12)'),
    },
    {
      label: '已点亮地区',
      value: String(visitedRegions),
      caption: visitedRegions > 0 ? '这些地区已被点亮，成为旅途记忆的一部分' : '还没有点亮地区，下一次出发就从这里开始',
      icon: 'globe' as const,
      className: 'stat-card-teal',
      iconStyle: withIconVars('#14b8a6', 'rgba(20,184,166,0.12)'),
    },
    {
      label: '参与用户',
      value: `${activeUsers}/${users.length}`,
      caption: users.length > 1 ? '把同行人的旅行视角一起收藏进这张地图' : '一个人的旅行地图，也能慢慢长成完整档案',
      icon: 'users' as const,
      className: 'stat-card-sky',
      iconStyle: withIconVars('#0ea5e9', 'rgba(14,165,233,0.12)'),
    },
  ];

  return (
    <section className="stats-grid">
      {cards.map((card) => (
        <article key={card.label} className={`stat-card ${card.className}`}>
          <div className="stat-card-header">
            <span className="travel-icon-badge stat-icon-badge" style={card.iconStyle}>
              <TravelIcon name={card.icon} size={16} />
            </span>
            <span className="stat-label">{card.label}</span>
          </div>
          <strong>{card.value}</strong>
          <p className="stat-caption">{card.caption}</p>
        </article>
      ))}
    </section>
  );
}

export default StatsPanel;
