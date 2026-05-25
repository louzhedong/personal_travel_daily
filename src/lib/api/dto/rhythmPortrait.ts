/**
 * G5 · Travel Rhythm Portrait DTOs (frontend mirror) / 旅行节奏画像前端 DTO 镜像
 */
export type RhythmBudgetTierDto = 'frugal' | 'balanced' | 'comfort' | 'lavish';

export interface RhythmTopMonthDto {
  month: number;
  label: string;
  count: number;
  share: number;
}

export interface RhythmTopTransportDto {
  value: string;
  label: string;
  count: number;
  share: number;
}

export interface RhythmThemeMixDto {
  food: number;
  scenery: number;
  history: number;
  healing: number;
  nature: number;
}

export interface RhythmPortraitDto {
  id: string | null;
  generatedAt: string | null;
  windowYears: string;
  available: boolean;
  windowYearCount: number;
  topMonths: RhythmTopMonthDto[];
  topTransports: RhythmTopTransportDto[];
  avgTripDays: number;
  budgetTier: RhythmBudgetTierDto;
  themeMix: RhythmThemeMixDto;
  companionDiversityIndex: number;
  totalTripCount: number;
  totalMarkerCount: number;
  summaryMarkdown: string;
  shareCardUrl: string;
}

export interface RhythmPortraitActionResponseDto {
  portrait: RhythmPortraitDto;
}
