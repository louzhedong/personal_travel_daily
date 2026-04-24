import { useEffect, useMemo, useState } from 'react';
import TravelIcon from '../../components/ui/TravelIcon';
import { fetchTripDetail } from '../../lib/api/tripsApi';
import type { TripDetailResponseDto } from '../../lib/api/types';
import type { AuthAccount } from '../../types';
import {
  buildTripDetailSummaryCards,
  buildTripGuideMeta,
  buildTripPhotoAlt,
  formatTripDetailDateRange,
  formatTripMarkerRange,
  groupTripDetailPhotos,
  groupTripDetailMarkers,
  isTripDetailNotFoundError,
} from './tripDetailPageModel';

interface TripDetailPageProps {
  account: AuthAccount;
  tripId: string;
  onNavigateBack: () => void;
  onLogout: () => Promise<void> | void;
}

export default function TripDetailPage({ account, tripId, onNavigateBack, onLogout }: TripDetailPageProps) {
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
        setErrorMessage(error instanceof Error ? error.message : '行程详情加载失败');
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

  const summaryCards = useMemo(() => (data ? buildTripDetailSummaryCards(data) : []), [data]);
  const markerGroups = useMemo(() => (data ? groupTripDetailMarkers(data.markers) : []), [data]);
  const photoGroups = useMemo(() => (data ? groupTripDetailPhotos(data.photos) : []), [data]);
  const markerLabelById = useMemo(
    () =>
      new Map(
        (data?.markers ?? []).map((marker) => [marker.id, `${marker.scopeName} · ${marker.city}`]),
      ),
    [data],
  );

  return (
    <main className="trip-detail-stage">
      <div className="trip-detail-shell">
      <section className="trip-detail-hero card">
        <div className="trip-detail-hero-copy">
          <span className="hero-kicker">行程详情</span>
          <h1>{data?.trip.name ?? '正在载入行程...'}</h1>
          <p>
            {data
              ? `${formatTripDetailDateRange(data.trip.startsAt, data.trip.endsAt)} · 当前账号 ${account.name}`
              : '从统计中心钻取后，可在这里回看某个具体行程的记录、攻略和照片。'}
          </p>
          <div className="trip-detail-hero-actions">
            <button type="button" className="ghost-button" onClick={onNavigateBack}>
              返回统计中心
            </button>
            <button type="button" className="ghost-button" onClick={() => void onLogout()}>
              退出登录
            </button>
          </div>
        </div>
        {data?.trip.note ? (
          <aside className="trip-detail-note-card">
            <span className="trip-detail-note-eyebrow">Trip Note</span>
            <strong>{data.trip.note}</strong>
          </aside>
        ) : null}
      </section>

      {loading ? (
        <section className="card trip-detail-state-card">
          <strong>正在加载行程详情...</strong>
          <p>正在聚合这段旅程里的记录、攻略和照片。</p>
        </section>
      ) : null}

      {!loading && errorMessage ? (
        <section className="card trip-detail-state-card trip-detail-state-card-error">
          <strong>{isTripDetailNotFoundError(errorMessage) ? '行程不存在或无权访问' : '行程详情加载失败'}</strong>
          <p>{errorMessage}</p>
          <button type="button" className="ghost-button" onClick={onNavigateBack}>
            返回统计中心
          </button>
        </section>
      ) : null}

      {!loading && data ? (
        <>
          <section className="trip-detail-summary-grid">
            {summaryCards.map((card) => (
              <article key={card.label} className="card trip-detail-summary-card">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <p>{card.description}</p>
              </article>
            ))}
          </section>

          <section className="trip-detail-two-column">
            <section className="card trip-detail-panel">
              <div className="trip-detail-section-heading">
                <div>
                  <h2>旅伴参与</h2>
                  <p>按记录数查看本次行程中各旅伴的参与情况。</p>
                </div>
              </div>
              <div className="trip-detail-companion-grid">
                {data.companions.map((companion) => (
                  <article key={companion.id} className="trip-detail-companion-card">
                    <div className="trip-detail-companion-card-head">
                      <span className="trip-detail-companion-dot" style={{ backgroundColor: companion.color }} />
                      <strong>{companion.name}</strong>
                    </div>
                    <div className="trip-detail-companion-card-metrics">
                      <span>{companion.markerCount} 条记录</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="card trip-detail-panel">
              <div className="trip-detail-section-heading">
                <div>
                  <h2>行程概览</h2>
                  <p>快速把握这次旅行的时间范围、备注与生成时间。</p>
                </div>
              </div>
              <div className="trip-detail-overview-list">
                <div>
                  <span>日期范围</span>
                  <strong>{formatTripDetailDateRange(data.trip.startsAt, data.trip.endsAt)}</strong>
                </div>
                <div>
                  <span>行程备注</span>
                  <strong>{data.trip.note || '暂无行程备注'}</strong>
                </div>
                <div>
                  <span>统计生成于</span>
                  <strong>{data.meta.generatedAt.slice(0, 16).replace('T', ' ')}</strong>
                </div>
              </div>
            </section>
          </section>

          <section className="card trip-detail-panel trip-detail-panel-fixed">
            <div className="trip-detail-section-heading">
              <div>
                <h2>行程记录</h2>
                <p>按日期回看这次行程内的旅行记录、旅伴与图片分布。</p>
              </div>
            </div>
            {markerGroups.length === 0 ? (
              <div className="trip-detail-empty">当前行程暂无旅行记录。</div>
            ) : (
              <div className="trip-detail-marker-groups trip-detail-panel-scroll">
                {markerGroups.map((group) => (
                  <section key={group.date} className="trip-detail-marker-group">
                    <header>
                      <strong>{group.date}</strong>
                    </header>
                    <div className="trip-detail-marker-list">
                      {group.items.map((marker) => (
                        <article key={marker.id} className="trip-detail-marker-card">
                          <div className="trip-detail-marker-head">
                            <div>
                              <strong>
                                {marker.scopeName} · {marker.city}
                              </strong>
                              <p>{formatTripMarkerRange(marker)}</p>
                            </div>
                            <span
                              className="trip-detail-companion-inline"
                              style={{ backgroundColor: `${marker.companionColor}14`, color: marker.companionColor }}
                            >
                              {marker.companionName}
                            </span>
                          </div>
                          <p className="trip-detail-marker-note">{marker.note || '暂无备注'}</p>
                          <div className="trip-detail-marker-meta">
                            <span>{marker.scope === 'domestic' ? '国内行程' : '国际行程'}</span>
                            <span>{marker.imageUrls?.length ?? 0} 张图片</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </section>

          <section className="trip-detail-photo-guide-grid">
            <section className="card trip-detail-panel trip-detail-panel-fixed">
              <div className="trip-detail-section-heading">
                <div>
                  <h2>行程照片</h2>
                  <p>只展示当前行程内记录所关联的照片素材。</p>
                </div>
              </div>
              {data.photos.length === 0 ? (
                <div className="trip-detail-empty">当前行程还没有照片。</div>
              ) : (
                <div className="trip-detail-photo-groups trip-detail-panel-scroll">
                  {photoGroups.map((group) => (
                    <section key={group.date} className="trip-detail-photo-group">
                      <header>
                        <strong>{group.date}</strong>
                      </header>
                      <div className="trip-detail-photo-grid">
                        {group.items.map((photo) => (
                          <figure key={`${photo.markerId}-${photo.imageUrl}`} className="trip-detail-photo-card">
                            <img src={photo.imageUrl} alt={buildTripPhotoAlt(photo)} loading="lazy" />
                            <figcaption>
                              <strong>{photo.markerTitle}</strong>
                              <span>
                                {photo.scopeName} · {photo.city}
                              </span>
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </section>

            <section className="card trip-detail-panel trip-detail-panel-fixed">
              <div className="trip-detail-section-heading">
                <div>
                  <h2>关联攻略</h2>
                  <p>汇总与这次行程记录相关的收藏攻略，便于复盘与后续再出发。</p>
                </div>
              </div>
              {data.guides.length === 0 ? (
                <div className="trip-detail-empty">当前行程还没有关联攻略。</div>
              ) : (
                <div className="trip-detail-guide-list trip-detail-panel-scroll">
                  {data.guides.map((guide) => (
                    <article key={guide.id} className="trip-detail-guide-card">
                      <div className="trip-detail-guide-top">
                        <span className="travel-icon-badge travel-icon-badge-orange">
                          <TravelIcon name="spark" size={14} />
                        </span>
                        <div>
                          <strong>{guide.result.title}</strong>
                          <p>{buildTripGuideMeta(guide)}</p>
                        </div>
                      </div>
                      <p className="trip-detail-guide-summary">{guide.result.summary}</p>
                      <div className="trip-detail-guide-meta">
                        <span>关键词：{guide.keyword}</span>
                        {guide.markerId ? (
                          <span>关联地点：{markerLabelById.get(guide.markerId) ?? '已关联行程记录'}</span>
                        ) : null}
                      </div>
                      <div className="trip-detail-guide-actions">
                        {/^https?:\/\//.test(guide.result.sourceUrl) ? (
                          <a
                            href={guide.result.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="trip-detail-guide-link"
                          >
                            查看原文
                          </a>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        </>
      ) : null}
      </div>
    </main>
  );
}
