import type { AssistantSuggestionDto } from '../../lib/api/types';

export function getAssistantActionSummary(suggestion: AssistantSuggestionDto | null) {
  if (!suggestion) return '还没有生成建议。';
  return `已生成 ${suggestion.actions.length} 条 ${suggestion.style} 风格建议。`;
}
