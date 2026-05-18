export type MarkerTagVocabularySourceDto = 'system' | 'custom';

export interface MarkerTagVocabularyItemDto {
  id?: string;
  value: string;
  label: string;
  source: MarkerTagVocabularySourceDto;
  isHidden: boolean;
  sortOrder: number;
  usageCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarkerTagVocabularyResponseDto {
  items: MarkerTagVocabularyItemDto[];
  visibleItems: MarkerTagVocabularyItemDto[];
  systemCount: number;
  customCount: number;
}

export interface CreateMarkerTagVocabularyInputDto {
  value?: string;
  label: string;
  sortOrder?: number;
}

export interface UpdateMarkerTagVocabularyInputDto {
  label?: string;
  isHidden?: boolean;
  sortOrder?: number;
}
