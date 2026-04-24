import { useEffect, useMemo, useState } from 'react';
import type { Scope } from '../../types';
import type { StatsHeatmapItemDto } from '../../lib/api/types';
import { loadGeoForScope, normalizeChinaName, type LoadedFeature } from '../../geo/loader';
import { pathFor, projectionFor } from '../../geo/projection';
import { getHeatmapLabel, getHeatmapTone } from '../../modules/stats/statsCenterModel';

interface StatsHeatmapMapProps {
  scope: Scope;
  heatmap: StatsHeatmapItemDto[];
}

export default function StatsHeatmapMap({ scope, heatmap }: StatsHeatmapMapProps) {
  const [features, setFeatures] = useState<LoadedFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [hoveredScopeId, setHoveredScopeId] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');

    loadGeoForScope(scope)
      .then((data) => {
        if (!cancelled) {
          setFeatures(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setFeatures([]);
          setLoadError(error instanceof Error ? error.message : '地图加载失败');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [scope]);

  const items = heatmap
    .filter((item) => item.scope === scope && item.markerCount > 0)
    .sort((left, right) => {
      if (right.markerCount !== left.markerCount) {
        return right.markerCount - left.markerCount;
      }
      return left.scopeName.localeCompare(right.scopeName, 'zh-CN');
    });

  const featureKeyMap = useMemo(
    () =>
      new Map(
        items.map((item) => [
          scope === 'domestic' ? normalizeChinaName(item.scopeName) : item.scopeName,
          item,
        ]),
      ),
    [items, scope],
  );

  const mapWidth = scope === 'domestic' ? 740 : 820;
  const mapHeight = scope === 'domestic' ? 520 : 440;

  const mapPaths = useMemo(() => {
    if (features.length === 0) {
      return [];
    }

    const featureCollection = {
      type: 'FeatureCollection' as const,
      features: features.map((item) => item.feature),
    };
    const projection = projectionFor(scope, mapWidth, mapHeight, featureCollection);
    const pathBuilder = pathFor(projection);

    return features.map((feature) => {
      const item = featureKeyMap.get(feature.name);
      return {
        id: feature.id,
        name: feature.name,
        path: pathBuilder(feature.feature as never) ?? '',
        item,
        tone: item ? getHeatmapTone(item.intensity) : 'is-muted',
      };
    });
  }, [featureKeyMap, features, mapHeight, mapWidth, scope]);

  const hoveredItem = useMemo(
    () => items.find((item) => `${item.scope}:${item.scopeId}` === hoveredScopeId) ?? null,
    [hoveredScopeId, items],
  );

  if (loading) {
    return <div className="stats-heatmap-empty">正在加载地图底图...</div>;
  }

  if (loadError) {
    return <div className="stats-heatmap-empty">地图加载失败，请稍后重试。</div>;
  }

  if (items.length === 0) {
    return <div className="stats-heatmap-empty">当前筛选条件下暂无热力分布数据。</div>;
  }

  return (
    <div className={`stats-heatmap-map-layout stats-heatmap-map-layout-${scope}`}>
      <div className="stats-heatmap-svg-wrap">
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className={`stats-heatmap-svg stats-heatmap-svg-${scope}`}
          role="img"
          aria-label={scope === 'domestic' ? '中国热力地图' : '世界热力地图'}
        >
          {mapPaths.map((item) => (
            <path
              key={item.id}
              d={item.path}
              className={`stats-heatmap-shape ${item.tone}${item.item ? ' is-active' : ''}${
                item.item && hoveredScopeId === `${item.item.scope}:${item.item.scopeId}` ? ' is-hovered' : ''
              }`}
              vectorEffect="non-scaling-stroke"
              onMouseEnter={() => setHoveredScopeId(item.item ? `${item.item.scope}:${item.item.scopeId}` : '')}
              onMouseLeave={() => setHoveredScopeId('')}
            >
              <title>{item.item ? getHeatmapLabel(item.item) : `${item.name} · 暂无记录`}</title>
            </path>
          ))}
        </svg>
      </div>

      <aside className="stats-heatmap-legend">
        <div className="stats-heatmap-legend-head">
          <strong>{scope === 'domestic' ? '省级热区' : '国家热区'}</strong>
          <span>按访问记录聚合</span>
        </div>
        <div className="stats-heatmap-legend-scale-card">
          <div className="stats-heatmap-legend-scale">
            <span className="stats-heatmap-legend-swatch level-1" />
            <span className="stats-heatmap-legend-swatch level-3" />
            <span className="stats-heatmap-legend-swatch level-5" />
          </div>
          <div className="stats-heatmap-legend-scale-copy">
            <span>低频</span>
            <span>中频</span>
            <span>高频</span>
          </div>
        </div>
        <div className="stats-heatmap-hover-card">
          {hoveredItem ? (
            <>
              <strong>{hoveredItem.scopeName}</strong>
              <span>{getHeatmapLabel(hoveredItem)}</span>
            </>
          ) : (
            <>
              <strong>悬停地图区域</strong>
              <span>查看该地区的记录数和热度等级。</span>
            </>
          )}
        </div>
        <div className="stats-heatmap-legend-list">
          {items.slice(0, 8).map((item, index) => (
            <article
              key={`${item.scope}-${item.scopeId}`}
              className={`stats-heatmap-legend-item${
                hoveredScopeId === `${item.scope}:${item.scopeId}` ? ' is-hovered' : ''
              }`}
              onMouseEnter={() => setHoveredScopeId(`${item.scope}:${item.scopeId}`)}
              onMouseLeave={() => setHoveredScopeId('')}
            >
              <div className="stats-heatmap-legend-rank">
                <span>#{index + 1}</span>
                <strong>{item.scopeName}</strong>
              </div>
              <div className="stats-heatmap-legend-meta">
                <span>{item.markerCount} 次记录</span>
                <i className={`stats-heatmap-dot ${getHeatmapTone(item.intensity)}`} />
              </div>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}
