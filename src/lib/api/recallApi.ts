import { httpClient, getResourceBaseUrl } from './httpClient';
import type {
  RecallQueryFiltersDto,
  RecallQueryResponseDto,
  RecallRebuildResponseDto,
} from './dto/recall';

/**
 * G3 · Event-Centric Recall API client / 事件维度回想 API 客户端
 */
export async function queryRecallEvents(filters: RecallQueryFiltersDto = {}) {
  return httpClient.post<RecallQueryResponseDto>(
    getResourceBaseUrl(),
    '/recall/query',
    filters,
  );
}

export async function rebuildRecallIndex() {
  return httpClient.post<RecallRebuildResponseDto>(
    getResourceBaseUrl(),
    '/recall/rebuild',
    {},
  );
}
