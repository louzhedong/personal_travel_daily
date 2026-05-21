export type HomeDashboardCardIdDto = 'latest-trip' | 'next-trip' | 'pending-materials' | 'live-trip' | 'recent-achievement';

export interface HomeDashboardSuggestionDto {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  path: string;
  tone: 'info' | 'warning' | 'success';
  source: 'reminder' | 'organize' | 'trip' | 'achievement';
}

export interface HomeDashboardCardDto {
  id: HomeDashboardCardIdDto;
  title: string;
  eyebrow: string;
  description: string;
  path?: string;
  metricLabel?: string;
  metricValue?: string;
}

export interface HomeDashboardPreferenceDto {
  layout: HomeDashboardCardIdDto[];
  hiddenCardIds: HomeDashboardCardIdDto[];
}

export interface HomeDashboardResponseDto {
  suggestions: HomeDashboardSuggestionDto[];
  cards: HomeDashboardCardDto[];
  preference: HomeDashboardPreferenceDto;
  generatedAt: string;
}

export interface UpdateHomeDashboardPreferenceInputDto {
  layout: HomeDashboardCardIdDto[];
  hiddenCardIds: HomeDashboardCardIdDto[];
}
