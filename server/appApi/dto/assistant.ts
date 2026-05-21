export type AssistantContextTypeDto = 'home' | 'trip' | 'photos' | 'journey';
export type AssistantStyleDto = 'magazine' | 'journal' | 'postcard';
export type AssistantSuggestionStatusDto = 'draft' | 'confirmed' | 'dismissed';

export interface AssistantSuggestionActionDto {
  id: string;
  type: 'checklist' | 'photo_caption' | 'story_preface' | 'tag_cleanup' | 'planning_note';
  title: string;
  description: string;
  payload: Record<string, unknown>;
}

export interface AssistantSuggestionDto {
  id: string;
  contextType: AssistantContextTypeDto;
  contextId?: string;
  style: AssistantStyleDto;
  promptSummary: string;
  actions: AssistantSuggestionActionDto[];
  status: AssistantSuggestionStatusDto;
  createdAt: string;
  confirmedAt?: string;
}

export interface AssistantPreferenceDto {
  style: AssistantStyleDto;
}

export interface CreateAssistantSuggestionInputDto {
  contextType: AssistantContextTypeDto;
  contextId?: string;
  style?: AssistantStyleDto;
}

export interface ConfirmAssistantSuggestionInputDto {
  actionIds?: string[];
}

export interface AssistantSuggestionResponseDto {
  suggestion: AssistantSuggestionDto;
}

export interface AssistantSuggestionListResponseDto {
  suggestions: AssistantSuggestionDto[];
}

export interface AssistantPreferenceResponseDto {
  preference: AssistantPreferenceDto;
}

export interface UpdateAssistantPreferenceInputDto {
  style: AssistantStyleDto;
}
