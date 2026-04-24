import type { StatsHeatmapItemDto, StatsScopeDto } from '../../lib/api/types';
import StatsHeatmapMap from './StatsHeatmapMap';

interface StatsHeatmapPanelProps {
  scope: StatsScopeDto;
  heatmap: StatsHeatmapItemDto[];
}

export default function StatsHeatmapPanel({ scope, heatmap }: StatsHeatmapPanelProps) {
  const showDomestic = scope === 'all' || scope === 'domestic';
  const showInternational = scope === 'all' || scope === 'international';

  return (
    <section className="card stats-panel">
      <div className="stats-section-heading">
        <div>
          <h3>区域热力图</h3>
          <p>按访问记录给真实地图着色，国内使用中国省级地图，国际使用世界地图，并在右侧保留热区榜单。</p>
        </div>
      </div>

      <div className="stats-heatmap-layout">
        {showDomestic ? (
          <article className="stats-heatmap-card">
            <header>
              <strong>国内热力</strong>
              <span>按省级区域聚合</span>
            </header>
            <StatsHeatmapMap scope="domestic" heatmap={heatmap} />
          </article>
        ) : null}
        {showInternational ? (
          <article className="stats-heatmap-card">
            <header>
              <strong>国际热力</strong>
              <span>按国家区域聚合</span>
            </header>
            <StatsHeatmapMap scope="international" heatmap={heatmap} />
          </article>
        ) : null}
      </div>
    </section>
  );
}
