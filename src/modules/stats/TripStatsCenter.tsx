import { useEffect, useMemo, useState } from 'react';
import TravelIcon from '../../components/ui/TravelIcon';
import StatsCenterFilters from '../../components/stats/StatsCenterFilters';
import StatsHeatmapPanel from '../../components/stats/StatsHeatmapPanel';
import StatsSummaryGrid from '../../components/stats/StatsSummaryGrid';
import { fetchStatsOverview } from '../../lib/api/statsApi';
import type {
  StatsCompanionRankingItemDto,
  StatsOverviewResponseDto,
  StatsRegionRankingItemDto,
  StatsTripDetailItemDto,
  StatsTripRankingItemDto,
} from '../../lib/api/types';
import {
  createDefaultStatsUiFilters,
  formatGeneratedAt,
  formatStatsDateRange,
  getBarPercentage,
  getTopMetricValue,
  mapUiFiltersToQuery,
  type StatsUiFilters,
} from './statsCenterModel';

interface TripStatsCenterProps {
  onOpenTripDetail?: (tripId: string) => void;
}

function SectionBars<T extends { markerCount: number }>({
  title,
  description,
  items,
  renderLabel,
  renderValue,
  panelClassName = '',
  listClassName = '',
}: {
  title: string;
  description: string;
  items: T[];
  renderLabel: (item: T) => string;
  renderValue?: (item: T) => string;
  panelClassName?: string;
  listClassName?: string;
}) {
  const maxValue = getTopMetricValue(items, 'markerCount');

  return (
    <section className={`card stats-panel ${panelClassName}`.trim()}>
      <div className="stats-section-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="stats-empty">当前筛选条件下暂无数据。</div>
      ) : (
        <div className={`stats-bar-list ${listClassName}`.trim()}>
          {items.map((item, index) => (
            <article key={`${renderLabel(item)}-${index}`} className="stats-bar-row">
              <div className="stats-bar-copy">
                <strong>{renderLabel(item)}</strong>
                <span>{renderValue ? renderValue(item) : `${item.markerCount} 条记录`}</span>
              </div>
              <div className="stats-bar-track">
                <div className="stats-bar-fill" style={{ width: `${getBarPercentage(item.markerCount, maxValue)}%` }} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionTrend<T extends { markerCount: number; travelDays: number }>({
  title,
  description,
  items,
  keyField,
}: {
  title: string;
  description: string;
  items: T[];
  keyField: keyof T;
}) {
  const maxValue = getTopMetricValue(items, 'travelDays');

  return (
    <section className="card stats-panel">
      <div className="stats-section-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <div className="stats-trend-grid">
        {items.map((item) => (
          <article key={String(item[keyField])} className="stats-trend-item">
            <span>{String(item[keyField])}</span>
            <strong>{item.markerCount}</strong>
            <small>{item.travelDays} 天</small>
            <div className="stats-trend-track">
              <div
                className="stats-trend-fill"
                style={{ height: `${getBarPercentage(item.travelDays, maxValue)}%` }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TripDetailsPanel({
  items,
  onOpenTripDetail,
}: {
  items: StatsTripDetailItemDto[];
  onOpenTripDetail?: (tripId: string) => void;
}) {
  return (
    <section className="card stats-panel">
      <div className="stats-section-heading">
        <div>
          <h3>行程明细</h3>
          <p>展示筛选条件下的行程列表，并预留详情跳转入口。</p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="stats-empty">当前筛选条件下暂无行程。</div>
      ) : (
        <div className="stats-trip-detail-list">
          {items.map((trip) => (
            <button
              key={trip.tripId}
              type="button"
              className="stats-trip-detail"
              onClick={() => onOpenTripDetail?.(trip.tripId)}
            >
              <div className="stats-trip-detail-main">
                <strong>{trip.tripName}</strong>
                <p>{formatStatsDateRange(trip.startsAt, trip.endsAt)}</p>
                <span>{trip.note || '暂无行程备注'}</span>
              </div>
              <div className="stats-trip-detail-meta">
                <span>{trip.markerCount} 条记录</span>
                <span>{trip.travelDays} 天</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function CompanionRankingPanel({ items }: { items: StatsCompanionRankingItemDto[] }) {
  const maxValue = getTopMetricValue(items, 'markerCount');

  return (
    <section className="card stats-panel stats-panel-fixed">
      <div className="stats-section-heading">
        <div>
          <h3>旅伴排行</h3>
          <p>用更轻量的旅伴名片查看谁最活跃，也顺带保留旅行天数和记录量对比。</p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="stats-empty">当前筛选条件下暂无数据。</div>
      ) : (
        <div className="stats-companion-ranking stats-panel-scroll">
          {items.map((item, index) => (
            <article key={item.companionId} className="stats-companion-card">
              <div
                className="stats-companion-accent"
                style={{ background: `linear-gradient(180deg, ${item.color}, ${item.color}88)` }}
              />
              <div className="stats-companion-card-main">
                <div className="stats-companion-card-top">
                  <div className="stats-companion-identity">
                    <span className="stats-companion-rank">#{index + 1}</span>
                    <strong>{item.companionName}</strong>
                  </div>
                  <span className="stats-companion-days">{item.travelDays} 天</span>
                </div>
                <div className="stats-companion-track">
                  <div
                    className="stats-companion-fill"
                    style={{
                      width: `${getBarPercentage(item.markerCount, maxValue)}%`,
                      background: `linear-gradient(90deg, ${item.color}, ${item.color}aa)`,
                    }}
                  />
                </div>
                <div className="stats-companion-meta">
                  <span>{item.markerCount} 条记录</span>
                  <span>覆盖天数 {item.travelDays}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function TripStatsCenter({ onOpenTripDetail }: TripStatsCenterProps) {
  const [filters, setFilters] = useState<StatsUiFilters>(() => createDefaultStatsUiFilters());
  const [data, setData] = useState<StatsOverviewResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchStatsOverview(mapUiFiltersToQuery(filters))
      .then((response) => {
        if (cancelled) {
          return;
        }
        setData(response);
        setErrorMessage('');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : '统计中心加载失败');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const tripHighlights = useMemo(
    () =>
      data?.tripHighlights.longestTrip || data?.tripHighlights.mostMarkersTrip
        ? [
            data?.tripHighlights.longestTrip
              ? `最长行程：${data.tripHighlights.longestTrip.tripName} · ${data.tripHighlights.longestTrip.days} 天`
              : null,
            data?.tripHighlights.mostMarkersTrip
              ? `记录最多：${data.tripHighlights.mostMarkersTrip.tripName} · ${data.tripHighlights.mostMarkersTrip.markerCount} 条`
              : null,
          ].filter(Boolean)
        : ['当前筛选条件下暂无行程亮点'],
    [data],
  );

  return (
    <section className="stats-center-section">
      {loading ? (
        <section className="card stats-loading-card">
          <strong>正在生成统计中心...</strong>
          <p>正在从当前账号的旅行记录、行程与旅伴数据中聚合统计结果。</p>
        </section>
      ) : null}

      {!loading && errorMessage ? (
        <section className="card stats-loading-card stats-loading-card-error">
          <strong>统计中心加载失败</strong>
          <p>{errorMessage}</p>
        </section>
      ) : null}

      {!loading && data ? (
        <>
          <section className="stats-editorial-stage">
            <article className="card stats-editorial-copy">
              <span className="stats-editorial-eyebrow">Journey Lens</span>
              <h2>把旅行记录整理成一页旅程年鉴</h2>
              <p>从年份、范围、旅伴与行程切换统计口径，先看趋势，再看热点，最后钻取到具体行程详情。</p>
              <div className="stats-highlight-pill-row">
                {tripHighlights.map((item) => (
                  <span key={item} className="stats-highlight-pill">
                    {item}
                  </span>
                ))}
              </div>
            </article>

            <aside className="card stats-filter-panel">
              <div className="stats-filter-panel-head">
                <div>
                  <span className="stats-filter-panel-eyebrow">Filter Lens</span>
                  <strong>切换统计视角</strong>
                  <p>把“这趟旅程”切成不同口径去看，不用在长页里来回找控件。</p>
                </div>
                <span className="stats-generated-at">统计生成于 {formatGeneratedAt(data.generatedAt)}</span>
              </div>
              <StatsCenterFilters filters={filters} data={data} onChange={setFilters} />
            </aside>
          </section>

          <StatsSummaryGrid data={data} />

          <section className="stats-highlights-row">
            <article className="card stats-highlight-card stats-highlight-card-featured">
              <div className="stats-highlight-icon">
                <TravelIcon name="route" size={18} />
              </div>
              <div>
                <strong>本轮统计摘要</strong>
                <p>{tripHighlights.join(' / ')}</p>
              </div>
            </article>
          </section>

          <div className="stats-two-column-grid">
            <SectionTrend
              title="年度趋势"
              description="在当前范围、旅伴和行程条件下，跨年份观察记录与旅行天数变化。"
              items={data.yearlySeries}
              keyField="year"
            />
            <SectionTrend
              title="月度分布"
              description="观察当前筛选口径下，一年 12 个月的旅行分布情况。"
              items={data.monthlyDistribution}
              keyField="month"
            />
          </div>

          <div className="stats-two-column-grid">
            <SectionBars<StatsRegionRankingItemDto>
              title="地区排行"
              description="按访问记录数量查看最常去的地区。"
              items={data.topRegions}
              renderLabel={(item) => item.scopeName}
              renderValue={(item) => `${item.markerCount} 条记录`}
            />
            <SectionBars<StatsRegionRankingItemDto>
              title="城市排行"
              description="按访问记录数量查看最常出现的城市。"
              items={data.topCities as unknown as StatsRegionRankingItemDto[]}
              renderLabel={(item) => (item as unknown as { city: string }).city}
              renderValue={(item) => `${item.markerCount} 条记录`}
            />
          </div>

          <div className="stats-two-column-grid stats-two-column-grid-equal">
            <CompanionRankingPanel items={data.companionRanking} />
            <SectionBars<StatsTripRankingItemDto>
              title="行程排行"
              description="按记录数查看最活跃的行程。"
              items={data.tripRanking}
              renderLabel={(item) => item.tripName}
              renderValue={(item) => `${item.markerCount} 条记录 · ${item.travelDays} 天`}
              panelClassName="stats-panel-fixed"
              listClassName="stats-panel-scroll"
            />
          </div>

          <StatsHeatmapPanel scope={filters.scope} heatmap={data.heatmap} />
          <TripDetailsPanel items={data.tripDetails} onOpenTripDetail={onOpenTripDetail} />
        </>
      ) : null}
    </section>
  );
}
