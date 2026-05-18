import { useEffect, useMemo, useState } from 'react';
import {
  MARKER_BUDGET_LEVELS,
  MARKER_MOODS,
  MARKER_TRANSPORTS,
  MARKER_WEATHERS,
} from '../../../shared/markerMetadata';
import AtlasMap from '../../components/atlas/AtlasMap';
import FancySelect from '../../components/ui/FancySelect';
import RoutePageSkeleton from '../../components/ui/RoutePageSkeleton';
import { fetchAtlasTimeline } from '../../lib/api/atlasApi';
import { fetchMarkerTagVocabulary } from '../../lib/api/tagVocabularyApi';
import { MARKER_TAG_OPTIONS, type MarkerTagOption } from '../../lib/markerMetadata';
import type { AtlasScopeDto, AtlasTimelineQueryDto, AtlasTimelineResponseDto } from '../../lib/api/types';
import type { AuthAccount } from '../../types';
import {
  ATLAS_SCOPE_OPTIONS,
  buildAtlasCompanionOptions,
  buildAtlasMonthOptions,
  buildAtlasTripOptions,
  buildAtlasYearOptions,
  getAtlasCurrentReplayItem,
  getAtlasEmptyMessage,
  getAtlasProgressText,
  getTopAtlasRegions,
} from './atlasPageModel';
import { exportAtlasIndex, exportAtlasPoster, exportAtlasReplay } from './atlasExport';

interface TravelAtlasPageProps {
  account: AuthAccount;
  onLogout: () => Promise<void> | void;
  onNavigateBack: () => void;
}

const metadataOption = (label: string, value: string) => ({ value, label });
const MOOD_OPTIONS = [{ value: 'all', label: '全部情绪' }, ...MARKER_MOODS.map((value) => metadataOption(value, value))];
const WEATHER_OPTIONS = [{ value: 'all', label: '全部天气' }, ...MARKER_WEATHERS.map((value) => metadataOption(value, value))];
const TRANSPORT_OPTIONS = [{ value: 'all', label: '全部交通' }, ...MARKER_TRANSPORTS.map((value) => metadataOption(value, value))];
const BUDGET_OPTIONS = [{ value: 'all', label: '全部预算' }, ...MARKER_BUDGET_LEVELS.map((value) => metadataOption(value, value))];

export default function TravelAtlasPage({ account, onLogout, onNavigateBack }: TravelAtlasPageProps) {
  const [data, setData] = useState<AtlasTimelineResponseDto | null>(null);
  const [filters, setFilters] = useState<AtlasTimelineQueryDto>({ year: 'all', month: 'all', scope: 'all' });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [replayIndex, setReplayIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tagOptions, setTagOptions] = useState<MarkerTagOption[]>(MARKER_TAG_OPTIONS);


  useEffect(() => {
    let cancelled = false;
    fetchMarkerTagVocabulary()
      .then((response) => {
        if (cancelled) return;
        setTagOptions(response.visibleItems.map((item) => ({ value: item.value, label: item.label, source: item.source })));
      })
      .catch(() => {
        if (!cancelled) setTagOptions(MARKER_TAG_OPTIONS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAtlasTimeline(filters)
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setReplayIndex(0);
        setErrorMessage('');
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : '地图时间机器加载失败');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  useEffect(() => {
    if (!playing || !data || data.replay.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setReplayIndex((current) => (current + 1 >= data.replay.length ? 0 : current + 1));
    }, 1600);
    return () => window.clearInterval(timer);
  }, [data, playing]);

  const currentReplayItem = useMemo(() => (data ? getAtlasCurrentReplayItem(data.replay, replayIndex) : undefined), [data, replayIndex]);
  const topRegions = useMemo(() => (data ? getTopAtlasRegions(data.placeIndex.regions) : []), [data]);

  const updateFilter = (key: keyof AtlasTimelineQueryDto, value: string) => {
    setFilters((current) => ({ ...current, [key]: value === 'all' ? 'all' : value }));
  };

  if (loading && !data) {
    return <RoutePageSkeleton variant="detail" />;
  }

  return (
    <main className="travel-atlas-shell">
      <header className="travel-atlas-topbar">
        <button type="button" className="ghost-button" onClick={onNavigateBack}>
          返回首页
        </button>
        <button type="button" className="ghost-button" onClick={() => void onLogout()}>
          退出登录
        </button>
      </header>

      <section className="travel-atlas-hero">
        <span className="hero-kicker">Travel Atlas</span>
        <h1>地图时间机器</h1>
        <p>{account.name} 的全局旅行地图册，按时间播放足迹，按地点整理回忆。</p>
      </section>

      <section className="travel-atlas-filters" aria-label="地图时间机器筛选">
        <FancySelect value={filters.year ?? 'all'} options={buildAtlasYearOptions(data?.availableYears ?? [])} onChange={(value) => updateFilter('year', value)} placeholder="年份" ariaLabel="年份" />
        <FancySelect value={filters.month ?? 'all'} options={buildAtlasMonthOptions()} onChange={(value) => updateFilter('month', value)} placeholder="月份" ariaLabel="月份" />
        <FancySelect value={filters.scope ?? 'all'} options={ATLAS_SCOPE_OPTIONS} onChange={(value) => updateFilter('scope', value as AtlasScopeDto)} placeholder="范围" ariaLabel="范围" />
        <FancySelect value={filters.companionId ?? 'all'} options={buildAtlasCompanionOptions(data?.companions ?? [])} onChange={(value) => updateFilter('companionId', value)} placeholder="旅伴" ariaLabel="旅伴" />
        <FancySelect value={filters.tripId ?? 'all'} options={buildAtlasTripOptions(data?.trips ?? [])} onChange={(value) => updateFilter('tripId', value)} placeholder="行程" ariaLabel="行程" />
        <FancySelect value={filters.tag ?? 'all'} options={[{ value: 'all', label: '全部标签' }, ...tagOptions]} onChange={(value) => updateFilter('tag', value)} placeholder="标签" ariaLabel="标签" />
        <FancySelect value={filters.mood ?? 'all'} options={MOOD_OPTIONS} onChange={(value) => updateFilter('mood', value)} placeholder="情绪" ariaLabel="情绪" />
        <FancySelect value={filters.weather ?? 'all'} options={WEATHER_OPTIONS} onChange={(value) => updateFilter('weather', value)} placeholder="天气" ariaLabel="天气" />
        <FancySelect value={filters.transport ?? 'all'} options={TRANSPORT_OPTIONS} onChange={(value) => updateFilter('transport', value)} placeholder="交通" ariaLabel="交通" />
        <FancySelect value={filters.budgetLevel ?? 'all'} options={BUDGET_OPTIONS} onChange={(value) => updateFilter('budgetLevel', value)} placeholder="预算" ariaLabel="预算" />
      </section>

      {errorMessage ? <p className="travel-atlas-error">{errorMessage}</p> : null}

      {data ? (
        <>
          <section className="travel-atlas-stage">
            <AtlasMap regions={data.placeIndex.regions} currentItem={currentReplayItem} />
            <aside className="travel-atlas-replay-panel">
              <span className="hero-kicker">Timeline</span>
              <h2>{currentReplayItem?.title ?? '等待轨迹'}</h2>
              <p>{currentReplayItem?.description || getAtlasEmptyMessage(data)}</p>
              <div className="travel-atlas-progress">{getAtlasProgressText(data.replay, replayIndex)}</div>
              <div className="travel-atlas-replay-actions">
                <button type="button" className="ghost-button" onClick={() => setReplayIndex((index) => Math.max(index - 1, 0))}>
                  上一站
                </button>
                <button type="button" className="primary-button" onClick={() => setPlaying((value) => !value)}>
                  {playing ? '暂停' : '播放'}
                </button>
                <button type="button" className="ghost-button" onClick={() => setReplayIndex((index) => (data.replay.length === 0 ? 0 : Math.min(index + 1, data.replay.length - 1)))}>
                  下一站
                </button>
                <button type="button" className="ghost-button" onClick={() => setReplayIndex(0)}>
                  重置
                </button>
              </div>
            </aside>
          </section>

          <section className="travel-atlas-summary" aria-label="地图时间机器摘要">
            <div><span>旅行记录</span><strong>{data.summary.markerCount}</strong></div>
            <div><span>旅行天数</span><strong>{data.summary.travelDays}</strong></div>
            <div><span>城市</span><strong>{data.summary.cityCount}</strong></div>
            <div><span>照片</span><strong>{data.summary.photoCount}</strong></div>
          </section>

          <section className="travel-atlas-grid">
            <article className="travel-atlas-index">
              <span className="hero-kicker">Place Index</span>
              <h2>地名索引</h2>
              {topRegions.map((region, index) => (
                <div key={`${region.scope}:${region.scopeId}`} className="travel-atlas-index-row">
                  <strong>{String(index + 1).padStart(2, '0')}</strong>
                  <div>
                    <h3>{region.scopeName}</h3>
                    <p>{region.markerCount} 段记录 · {region.photoCount} 张照片 · {region.cities.slice(0, 4).map((city) => city.city).join(' / ')}</p>
                  </div>
                </div>
              ))}
            </article>

            <article className="travel-atlas-compare">
              <span className="hero-kicker">Compare</span>
              <h2>变化对比</h2>
              {data.compare.years.slice(0, 5).map((item) => (
                <div key={item.year} className="travel-atlas-compare-row">
                  <span>{item.year}</span>
                  <strong>{item.markerCount} 段</strong>
                  <em>{item.cityCount} 城 / {item.photoCount} 图</em>
                </div>
              ))}
            </article>
          </section>

          <section className="travel-atlas-export">
            <span className="hero-kicker">Export</span>
            <h2>导出地图册</h2>
            <div>
              <button type="button" className="primary-button" onClick={() => exportAtlasPoster(data)}>年度地图海报</button>
              <button type="button" className="ghost-button" onClick={() => exportAtlasIndex(data)}>城市索引长图</button>
              <button type="button" className="ghost-button" onClick={() => exportAtlasReplay(data)}>路线回放图</button>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
