import { getResourceBaseUrl, httpClient } from './httpClient';
import type { PhotoAlbumsResponseDto, UpdatePhotoAlbumPreferencesInput } from './types';

export async function fetchPhotoAlbums() {
  return httpClient.get<PhotoAlbumsResponseDto>(getResourceBaseUrl(), '/photo-albums');
}

export async function updatePhotoAlbumPreferences(input: UpdatePhotoAlbumPreferencesInput) {
  return httpClient.patch<PhotoAlbumsResponseDto>(getResourceBaseUrl(), '/photo-albums/preferences', input);
}
