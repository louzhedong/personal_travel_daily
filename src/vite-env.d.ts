/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IMGBB_API_KEY?: string;
  readonly VITE_GUIDE_SEARCH_PROVIDER?: 'mock' | 'remote';
  readonly VITE_GUIDE_SEARCH_API_BASE_URL?: string;
  readonly VITE_GUIDE_SEARCH_API_KEY?: string;
  readonly VITE_GUIDE_CONTENT_MODE?: 'summary';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
