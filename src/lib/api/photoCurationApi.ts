import { getResourceBaseUrl, httpClient } from './httpClient';
import type {
  PhotoCurationQuery,
  PhotoCurationResponseDto,
  UpdatePhotoCurationInput,
} from './types';

function buildPhotoCurationPath(params: PhotoCurationQuery = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  });
  const queryString = query.toString();
  return queryString ? `/photos/curation?${queryString}` : '/photos/curation';
}

export async function fetchPhotoCuration(params: PhotoCurationQuery = {}) {
  return httpClient.get<PhotoCurationResponseDto>(getResourceBaseUrl(), buildPhotoCurationPath(params));
}

export async function updatePhotoCuration(input: UpdatePhotoCurationInput, params: PhotoCurationQuery = {}) {
  return httpClient.patch<PhotoCurationResponseDto>(getResourceBaseUrl(), buildPhotoCurationPath(params), input);
}
