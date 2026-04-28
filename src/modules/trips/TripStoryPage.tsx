import { useEffect, useMemo, useState } from 'react';
import RoutePageSkeleton from '../../components/ui/RoutePageSkeleton';
import { fetchTripDetail } from '../../lib/api/tripsApi';
import type { TripDetailResponseDto } from '../../lib/api/types';
import type { AuthAccount } from '../../types';
import { isTripDetailNotFoundError } from './tripDetailPageModel';
import { buildTripStoryViewModel } from './tripStoryPageModel';

interface TripStoryPageProps {
  account: AuthAccount;
  tripId: string;
  onNavigateBack: () => void;
  onLogout: () => Promise<void> | void;
}

export default function TripStoryPage({
  account,
  tripId,
  onNavigateBack,
  onLogout,
}: TripStoryPageProps) {
  const [data, setData] = useState<TripDetailResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchTripDetail(tripId)
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
        setData(null);
        setErrorMessage(error instanceof Error ? error.message : '旅行故事加载失败');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const story = useMemo(() => (data ? buildTripStoryViewModel(data) : null), [data]);

  if (loading) {
    return <RoutePageSkeleton variant="story" />;
  }

  return (
    <main className="trip-story-stage">
      <div className="trip-story-shell">
        <section className="trip-story-hero">
          {story?.coverImageUrl ? (
            <img className="trip-story-hero-image" src={story.coverImageUrl} alt={`${story.title} 封面`} />
          ) : null}
          <div className="trip-story-hero-shade" />
          <div className="trip-story-hero-content">
            <span className="hero-kicker">Travel Story</span>
            <h1>{story?.title ?? '正在载入旅行故事...'}</h1>
            <p>{story ? story.lead : '正在把行程记录、照片、攻略和清单整理成一页可回看的旅行故事。'}</p>
            <div className="trip-story-hero-meta">
              <span>{story?.dateRange ?? 'Loading'}</span>
              <span>当前账号 {account.name}</span>
            </div>
            <div className="trip-story-actions">
              <button type="button" className="ghost-button" onClick={onNavigateBack}>
                返回行程详情
              </button>
              <button type="button" className="ghost-button" onClick={() => void onLogout()}>
                退出登录
              </button>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="card trip-detail-state-card trip-detail-state-card-error">
            <strong>{isTripDetailNotFoundError(errorMessage) ? '行程不存在或无权访问' : '旅行故事加载失败'}</strong>
            <p>{errorMessage}</p>
            <button type="button" className="ghost-button" onClick={onNavigateBack}>
              返回行程详情
            </button>
          </section>
        ) : null}

        {story ? (
          <>
            <section className="trip-story-intro card">
              <div>
                <span className="hero-kicker">Story Brief</span>
                <h2>这次旅行的故事骨架</h2>
                <p>{story.summaryText}</p>
              </div>
            </section>

            <section className="trip-story-highlight-grid" aria-label="旅行故事摘要">
              {story.highlights.map((highlight) => (
                <article key={highlight.label} className="card trip-story-highlight-card">
                  <span>{highlight.label}</span>
                  <strong>{highlight.value}</strong>
                  <p>{highlight.description}</p>
                </article>
              ))}
            </section>

            <section className="card trip-story-panel">
              <div className="trip-story-section-heading">
                <div>
                  <span className="hero-kicker">Route Film</span>
                  <h2>路线胶片</h2>
                </div>
                <p>按时间串起这次行程经过的地点，先用轻量只读方式呈现路线节奏。</p>
              </div>
              {story.routeStops.length === 0 ? (
                <div className="trip-story-empty">还没有可展示的路线停靠点。</div>
              ) : (
                <ol className="trip-story-route-film">
                  {story.routeStops.map((stop, index) => (
                    <li key={stop.key}>
                      <span className="trip-story-route-index">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <strong>{stop.label}</strong>
                        <p>{stop.date} · {stop.companionName}</p>
                      </div>
                      <span className="trip-story-route-dot" style={{ backgroundColor: stop.companionColor }} />
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="card trip-story-panel">
              <div className="trip-story-section-heading">
                <div>
                  <span className="hero-kicker">Timeline</span>
                  <h2>时间线叙事</h2>
                </div>
                <p>每一天保留原始游记，也把标签、天气、交通和预算这些轻量元数据带进故事。</p>
              </div>
              {story.timelineDays.length === 0 ? (
                <div className="trip-story-empty">这次行程还没有旅行记录。</div>
              ) : (
                <div className="trip-story-timeline">
                  {story.timelineDays.map((day) => (
                    <section key={day.date} className="trip-story-day">
                      <header>
                        <span>{day.date}</span>
                        <h3>{day.title}</h3>
                      </header>
                      <div className="trip-story-marker-list">
                        {day.markers.map((marker) => (
                          <article key={marker.id} className="trip-story-marker-card">
                            <div className="trip-story-marker-head">
                              <div>
                                <strong>{marker.scopeName} · {marker.city}</strong>
                                <p>{marker.displayRange} · {marker.companionName}</p>
                              </div>
                              <span style={{ backgroundColor: marker.companionColor }} />
                            </div>
                            <p>{marker.note || '这条记录还没有补充游记。'}</p>
                            {marker.metadataLabels.length > 0 ? (
                              <div className="trip-story-chip-row">
                                {marker.metadataLabels.map((label) => (
                                  <span key={label}>{label}</span>
                                ))}
                              </div>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </section>

            <section className="trip-story-two-column">
              <section className="card trip-story-panel">
                <div className="trip-story-section-heading">
                  <div>
                    <span className="hero-kicker">Photos</span>
                    <h2>照片段落</h2>
                  </div>
                </div>
                {story.photoGroups.length === 0 ? (
                  <div className="trip-story-empty">这次旅行还没有照片，后续补图后故事页会自动展示。</div>
                ) : (
                  <div className="trip-story-photo-stack">
                    {story.photoGroups.map((group) => (
                      <section key={group.date}>
                        <strong>{group.date}</strong>
                        <div className="trip-story-photo-grid">
                          {group.photos.map((photo) => (
                            <figure key={`${photo.markerId}-${photo.imageUrl}`}>
                              <img src={photo.imageUrl} alt={`${photo.markerTitle} ${photo.visitedStartAt}`} loading="lazy" />
                              <figcaption>{photo.markerTitle}</figcaption>
                            </figure>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </section>

              <section className="card trip-story-panel">
                <div className="trip-story-section-heading">
                  <div>
                    <span className="hero-kicker">Guides</span>
                    <h2>攻略摘录</h2>
                  </div>
                </div>
                {story.guides.length === 0 ? (
                  <div className="trip-story-empty">这次行程还没有关联攻略。</div>
                ) : (
                  <div className="trip-story-guide-list">
                    {story.guides.map((guide) => (
                      <article key={guide.id} className="trip-story-guide-card">
                        <span>{guide.result.sourceName}</span>
                        <h3>{guide.result.title}</h3>
                        <p>{guide.result.summary}</p>
                        {/^https?:\/\//.test(guide.result.sourceUrl) ? (
                          <a href={guide.result.sourceUrl} target="_blank" rel="noreferrer">
                            查看原文
                          </a>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </section>

            <section className="card trip-story-panel">
              <div className="trip-story-section-heading">
                <div>
                  <span className="hero-kicker">Checklist Review</span>
                  <h2>行前清单回顾</h2>
                </div>
                <p>{story.checklistReview.completionText}</p>
              </div>
              {story.checklistReview.total === 0 ? (
                <div className="trip-story-empty">这次行程还没有清单事项。</div>
              ) : (
                <div className="trip-story-checklist-grid">
                  {story.checklistReview.groups.map((group) => (
                    <article key={group.stage} className="trip-story-checklist-card">
                      <span>{group.readableStage}</span>
                      <strong>{group.itemCount}</strong>
                      <p>{group.title}</p>
                      <ul>
                        {group.items.slice(0, 3).map((item) => (
                          <li key={item.id}>{item.title}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
