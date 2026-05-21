export function registerTravelServiceWorker() {
  if (typeof window === 'undefined') return;
  void import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => {
      // PWA is a progressive enhancement; development builds can run without the virtual module.
    });
}
