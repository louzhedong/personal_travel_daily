import type { GuideDocument, GuideSearchParams, GuideSearchResponse } from '../../types';

export interface GuideSearchProvider {
  search(params: GuideSearchParams): Promise<GuideSearchResponse>;
}

export interface GuideContentProvider {
  getDocument(sourceUrl: string): Promise<GuideDocument | null>;
}
