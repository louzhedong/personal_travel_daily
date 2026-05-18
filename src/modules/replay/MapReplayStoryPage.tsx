import { useEffect, useMemo, useState } from 'react';
import AtlasMap from '../../components/atlas/AtlasMap';
import RoutePageSkeleton from '../../components/ui/RoutePageSkeleton';
import {
  fetchCompanionMapReplayStory,
  fetchTripMapReplayStory,
  fetchYearMapReplayStory,
} from '../../lib/api/mapReplayStoriesApi';
import type { MapReplayStoryResponseDto, MapReplayStoryTargetTypeDto } from '../../lib/api/types';
import type { AuthAccount } from '../../types';
import { exportMapReplayStoryLongImage } from './mapReplayStoryExport';
import {
  getMapReplayStoryCurrentItem,
  getMapReplayStoryFeaturedPhotos,
  getMapReplayStoryHeroText,
  getMapReplayStoryProgressText,
} from './mapReplayStoryModel';

interface MapReplayStoryPageProps {
  account: AuthAccount;
  targetType: MapReplayStoryTargetTypeDto;
  targetId: string;
  onLogout: () => Promise<void> | void;
  onNavigateBack: () => void;
}

function fetchReplayStory(targetType: MapReplayStoryTargetTypeDto, targetId: string) {
  if (targetType === 'trip') return fetchTripMapReplayStory(targetId);
  if (targetType === 'year') return fetchYearMapReplayStory(targetId);
  return fetchCompanionMapReplayStory(targetId);
}

export default function MapReplayStoryPage({
  account,
  targetType,
  targetId,
  onLogout,
  onNavigateBack,
}: MapReplayStoryPageProps) {
  const [data, setData] = useState<MapReplayStoryResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [replayIndex, setReplayIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchReplayStory(targetType, targetId)
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setReplayIndex(0);
        setErrorMessage('');
      })
      .catch((error) => {
        if (!cancelled) setErrorMessage(error instanceof Error ? error.message : '地图回放故事加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [targetId, targetType]);

  useEffect(() => {
    if (!playing || !data || data.replay.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setReplayIndex((current) => (current + 1 >= data.replay.length ? 0 : current + 1));
    }, 1500);
    return () => window.clearInterval(timer);
  }, [data, playing]);

  const currentItem = useMemo(() => (data ? getMapReplayStoryCurrentItem(data, replayIndex) : undefined), [data, replayIndex]);
  const featuredPhotos = useMemo(() => (data ? getMapReplayStoryFeaturedPhotos(data) : []), [data]);

  if (loading) {
    return <RoutePageSkeleton variant="story" />;
  }

  return (
    <main className="map-replay-story-shell">
      <header className="map-replay-story-topbar">
        <button type="button" className="ghost-button" onClick={onNavigateBack}>
          返回首页
        </button>
        <button type="button" className="ghost-button" onClick={() => void onLogout()}>
          退出登录
        </button>
      </header>

      {errorMessage || !data ? (
        <section className="map-replay-story-state">
          <span className="hero-kicker">Map Replay Story</span>
          <h1>地图回放故事暂时无法打开</h1>
          <p>{errorMessage || '当前来源不存在或无权访问。'}</p>
        </section>
      ) : (
        <>
          <section className="map-replay-story-hero">
            <span className="hero-kicker">Map Replay Story</span>
            <h1>{data.exportModel.posterTitle}</h1>
            <p>{getMapReplayStoryHeroText(data)}</p>
            <div className="map-replay-story-meta">
              <span>当前账号 {account.name}</span>
              <span>{data.target.subtitle ?? data.target.label}</span>
            </div>
            <div className="map-replay-story-actions">
              <button type="button" className="primary-button" onClick={() => exportMapReplayStoryLongImage(data)}>
                导出回放长图
              </button>
              <button type="button" className="ghost-button" onClick={() => window.print()}>
                导出 PDF / 打印
              </button>
            </div>
          </section>

          <section className="map-replay-story-stage">
            <AtlasMap regions={data.placeIndex.regions} currentItem={currentItem} />
            <aside>
              <span className="hero-kicker">Replay</span>
              <h2>{currentItem?.title ?? '等待轨迹'}</h2>
              <p>{currentItem?.description || data.emptyStates[0] || '路线回放会按时间顺序播放足迹。'}</p>
              <strong>{getMapReplayStoryProgressText(data, replayIndex)}</strong>
              <div className="map-replay-story-controls">
                <button type="button" className="ghost-button" onClick={() => setReplayIndex((index) => Math.max(index - 1, 0))}>
                  上一站
                </button>
                <button type="button" className="primary-button" onClick={() => setPlaying((value) => !value)}>
                  {playing ? '暂停' : '播放'}
                </button>
                <button type="button" className="ghost-button" onClick={() => setReplayIndex((index) => Math.min(index + 1, data.replay.length - 1))}>
                  下一站
                </button>
              </div>
            </aside>
          </section>

          <section className="map-replay-story-summary" aria-label="地图回放故事摘要">
            <div><span>旅行记录</span><strong>{data.summary.markerCount}</strong></div>
            <div><span>旅行天数</span><strong>{data.summary.travelDays}</strong></div>
            <div><span>城市</span><strong>{data.summary.cityCount}</strong></div>
            <div><span>照片</span><strong>{data.summary.photoCount}</strong></div>
          </section>

          <section className="map-replay-story-chapters">
            {data.chapters.map((chapter) => (
              <article key={chapter.id}>
                <span className="hero-kicker">{chapter.eyebrow}</span>
                <h2>{chapter.title}</h2>
                <p>{chapter.body}</p>
              </article>
            ))}
          </section>

          <section className="map-replay-story-media">
            <article>
              <span className="hero-kicker">Photos</span>
              <h2>回放瞬间</h2>
              <div className="map-replay-story-photo-grid">
                {featuredPhotos.map((photo) => (
                  <figure key={photo.imageId}>
                    <img src={photo.imageUrl} alt={photo.caption || photo.title} loading="lazy" />
                    <figcaption>{photo.caption || photo.title}</figcaption>
                  </figure>
                ))}
              </div>
            </article>
            <article>
              <span className="hero-kicker">Guides</span>
              <h2>攻略摘录</h2>
              {data.guides.slice(0, 5).map((guide) => (
                <div key={guide.id} className="map-replay-story-guide">
                  <strong>{guide.title}</strong>
                  <p>{guide.summary}</p>
                  <span>{guide.sourceName}</span>
                </div>
              ))}
              {data.guides.length === 0 ? <p className="map-replay-story-empty">当前回放范围还没有攻略摘录。</p> : null}
            </article>
          </section>
        </>
      )}
    </main>
  );
}
