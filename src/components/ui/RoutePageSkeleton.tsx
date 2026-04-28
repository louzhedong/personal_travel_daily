interface RoutePageSkeletonProps {
  variant?: 'story' | 'detail' | 'checklist';
}

export default function RoutePageSkeleton({ variant = 'detail' }: RoutePageSkeletonProps) {
  const panelCount = variant === 'story' ? 3 : 2;

  return (
    <main className="route-skeleton-stage" aria-label="页面加载中">
      <div className="route-skeleton-shell">
        <section className={`route-skeleton-hero route-skeleton-hero-${variant}`}>
          <div className="route-skeleton-line route-skeleton-kicker" />
          <div className="route-skeleton-line route-skeleton-title" />
          <div className="route-skeleton-line route-skeleton-copy" />
          <div className="route-skeleton-line route-skeleton-copy route-skeleton-copy-short" />
          <div className="route-skeleton-action-row">
            <div className="route-skeleton-pill" />
            <div className="route-skeleton-pill" />
          </div>
        </section>

        <section className="route-skeleton-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className="route-skeleton-card">
              <div className="route-skeleton-line route-skeleton-card-label" />
              <div className="route-skeleton-line route-skeleton-card-value" />
              <div className="route-skeleton-line route-skeleton-card-copy" />
            </article>
          ))}
        </section>

        {Array.from({ length: panelCount }).map((_, index) => (
          <section key={index} className="route-skeleton-panel">
            <div className="route-skeleton-panel-head">
              <div>
                <div className="route-skeleton-line route-skeleton-kicker" />
                <div className="route-skeleton-line route-skeleton-section-title" />
              </div>
              <div className="route-skeleton-line route-skeleton-section-copy" />
            </div>
            <div className="route-skeleton-panel-body">
              <div className="route-skeleton-row" />
              <div className="route-skeleton-row" />
              <div className="route-skeleton-row route-skeleton-row-short" />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
