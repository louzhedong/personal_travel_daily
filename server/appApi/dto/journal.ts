/**
 * F3 · Journal DTOs / 智能日记 DTO
 */
export type JournalMoodDto = 'delighted' | 'calm' | 'tired' | 'excited' | 'reflective' | 'neutral';

export interface JournalEntryDto {
  id: string;
  tripId: string;
  entryDate: string;
  mood: JournalMoodDto;
  weather: string | null;
  bodyMd: string;
  aiDraftMd: string | null;
  aiModel: string | null;
  aiGeneratedAt: string | null;
  isPinned: boolean;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JournalListResponseDto {
  items: JournalEntryDto[];
}

export interface UpsertJournalEntryBodyDto {
  tripId: string;
  entryDate: string;
  mood?: JournalMoodDto;
  weather?: string;
  bodyMd?: string;
  isPinned?: boolean;
}

export interface GenerateJournalDraftBodyDto {
  tripId: string;
  entryDate: string;
}

export interface GenerateJournalDraftResponseDto {
  entry: JournalEntryDto;
  source: 'llm' | 'fallback';
}

export interface AcceptJournalDraftBodyDto {
  entryId: string;
}
