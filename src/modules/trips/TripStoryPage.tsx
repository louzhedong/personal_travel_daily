import { useEffect, useMemo, useState } from 'react';
import RoutePageSkeleton from '../../components/ui/RoutePageSkeleton';
import { fetchTripDetail } from '../../lib/api/tripsApi';
import type { TripDetailResponseDto } from '../../lib/api/types';
import type { AuthAccount } from '../../types';
import { exportTripStoryLongImage, exportTripStoryShareCard } from './tripStoryExport';
import { isTripDetailNotFoundError } from './tripDetailPageModel';
import {
  buildTripStoryViewModel,
  type TripStoryShareCardVariant,
  type TripStoryTemplate,
} from './tripStoryPageModel';

interface TripStoryPageProps {
  account: AuthAccount;
  tripId: string;
  onNavigateBack: () => void;
  onLogout: () => Promise<void> | void;
  onOpenPhotoCuration?: (query: { tripId: string }) => void;
}

const TEMPLATE_OPTIONS: Array<{ value: TripStoryTemplate; label: string }> = [
  { value: 'magazine', label: '杂志风' },
  { value: 'memoir', label: '纪念册' },
  { value: 'postcard', label: '明信片' },
];

export default function TripStoryPage({
  account,
  tripId,
  onNavigateBack,
  onLogout,
  onOpenPhotoCuration,
}: TripStoryPageProps) {
  const [data, setData] = useState<TripDetailResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [template, setTemplate] = useState<TripStoryTemplate>('magazine');

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
  const shouldShowPhotoCurationLink =
    !!story && !!data?.photos.length && !story.featuredPhotos.some((photo) => photo.isFeatured);

  useEffect(() => {
    if (!story) {
      return;
    }

    const previousTitle = document.title;
    document.title = `${story.title} · 旅行故事`;
    return () => {
      document.title = previousTitle;
    };
  }, [story]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportLongImage = () => {
    if (story) {
      exportTripStoryLongImage(story, template);
    }
  };

  const handleExportShareCard = (variant: TripStoryShareCardVariant) => {
    if (story) {
      exportTripStoryShareCard(story, template, variant);
    }
  };

  if (loading) {
    return <RoutePageSkeleton variant="story" />;
  }

  return (
    <main className={`trip-story-stage trip-story-template-${template}`}>
      <div className="trip-story-shell">
        <section className="trip-story-hero">
          {story?.coverImageUrl ? (
            <img className="trip-story-hero-image" src={story.coverImageUrl} alt={`${story.title} 封面`} />
          ) : null}
          <div className="trip-story-hero-shade" />
          <div className="trip-story-hero-content">
            <span className="hero-kicker">Story Studio</span>
            <h1>{story?.title ?? '正在载入旅行故事...'}</h1>
            <p>{story ? story.lead : '正在把行程记录、照片、攻略和清单整理成一页可回看的旅行故事。'}</p>
            <div className="trip-story-hero-meta">
              <span>{story?.dateRange ?? 'Loading'}</span>
              <span>当前账号 {account.name}</span>
            </div>
            <div className="trip-story-actions">
              {story && !errorMessage ? (
                <>
                  <div className="trip-story-template-switch" aria-label="故事模板">
                    {TEMPLATE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={template === option.value ? 'is-active' : undefined}
                        onClick={() => setTemplate(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="primary-button trip-story-print-button" onClick={handlePrint}>
                    导出 PDF / 打印
                  </button>
                  <button type="button" className="ghost-button" onClick={handleExportLongImage}>
                    导出长图
                  </button>
                  <button type="button" className="ghost-button" onClick={() => handleExportShareCard('square')}>
                    导出方形分享卡
                  </button>
                  <button type="button" className="ghost-button" onClick={() => handleExportShareCard('story')}>
                    导出竖版分享卡
                  </button>
                </>
              ) : null}
              <button type="button" className="ghost-button" onClick={onNavigateBack}>
                返回行程详情
              </button>
              <button type="button" className="ghost-button trip-story-logout-button" onClick={() => void onLogout()}>
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
                <p className="trip-story-smart-copy">{story.smartNarrative}</p>
              </div>
            </section>

            <section className="card trip-story-panel">
              <div className="trip-story-section-heading">
                <div>
                  <span className="hero-kicker">Story Badges</span>
                  <h2>故事徽章</h2>
                </div>
                <p>从路线、照片、清单、攻略和记录细节里自动挑出这次旅行的记忆片段。</p>
              </div>
              <div className="trip-story-badge-grid" aria-label="故事徽章">
                {story.badges.map((badge) => (
                  <article key={badge.id} className={`trip-story-badge trip-story-badge-${badge.tone}`}>
                    <span>{badge.label}</span>
                    <strong>{badge.value}</strong>
                    <p>{badge.description}</p>
                  </article>
                ))}
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
                  <span className="hero-kicker">Featured Memories</span>
                  <h2>精选瞬间</h2>
                </div>
                {shouldShowPhotoCurationLink && onOpenPhotoCuration ? (
                  <button type="button" className="ghost-button" onClick={() => onOpenPhotoCuration({ tripId })}>
                    去整理照片
                  </button>
                ) : null}
                <p>优先展示行程素材里手动精选的照片；还没有精选时，会用照片流生成故事开场。</p>
              </div>
              {story.featuredPhotos.length === 0 ? (
                <div className="trip-story-empty">这次旅行还没有照片，精选瞬间会在补图后自动出现。</div>
              ) : (
                <div className="trip-story-featured-grid">
                  {story.featuredPhotos.map((photo, index) => (
                    <figure key={photo.imageId} className={index === 0 ? 'is-primary' : undefined}>
                      <img src={photo.imageUrl} alt={`${photo.markerTitle} ${photo.visitedStartAt}`} loading="lazy" />
                      <figcaption>
                        <span>{photo.isFeatured ? '精选照片' : '照片开场'}</span>
                        <strong>{photo.caption || photo.markerTitle}</strong>
                        <small>{photo.visitedStartAt} · {photo.city}</small>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </section>

            <section className="card trip-story-panel trip-story-route-poster-panel">
              <div className="trip-story-section-heading">
                <div>
                  <span className="hero-kicker">Route Replay Poster</span>
                  <h2>路线回放海报</h2>
                </div>
                <p>用静态海报表达这次路线的回放感，不依赖地图截图或额外服务。</p>
              </div>
              {story.routePoster.stops.length === 0 ? (
                <div className="trip-story-empty">{story.routePoster.emptyText}</div>
              ) : (
                <div className="trip-story-route-poster">
                  <div className="trip-story-route-poster-copy">
                    <span>{story.routePoster.stops.length} 站</span>
                    <strong>{story.routePoster.title}</strong>
                    <p>{story.routePoster.subtitle}</p>
                  </div>
                  <ol className="trip-story-route-track" aria-label="路线回放站点">
                    {story.routePoster.stops.map((stop, index) => (
                      <li key={stop.key}>
                        <span className="trip-story-route-track-dot" style={{ backgroundColor: stop.companionColor }}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <strong>{stop.shortLabel}</strong>
                          <p>{stop.date} · {stop.label}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
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
                {story.photoSections.length === 0 ? (
                  <div className="trip-story-empty">这次旅行还没有照片，后续补图后故事页会自动展示。</div>
                ) : (
                  <div className="trip-story-photo-stack">
                    {story.photoSections.map((section) => (
                      <section key={section.key}>
                        <strong>{section.title}</strong>
                        <p>{section.description}</p>
                        <div className="trip-story-photo-grid">
                          {section.photos.map((photo) => (
                            <figure key={photo.imageId} className={photo.isFeatured ? 'is-featured' : undefined}>
                              <img src={photo.imageUrl} alt={`${photo.markerTitle} ${photo.visitedStartAt}`} loading="lazy" />
                              <figcaption>
                                <strong>{photo.caption || photo.markerTitle}</strong>
                                <span>{photo.isFeatured ? '精选 · ' : ''}{photo.visitedStartAt}</span>
                              </figcaption>
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
