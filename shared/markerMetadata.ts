/**
 * Shared marker tag and lightweight metadata vocabularies.
 * 前后端共享的旅行记录标签与轻量元数据枚举，保持值域一致。
 */

export const MARKER_TAGS = [
  'food',
  'hiking',
  'beach',
  'museum',
  'photography',
  'family',
  'weekend',
  'business',
  'nature',
  'citywalk',
] as const;

export const MARKER_MOODS = ['relaxed', 'excited', 'tired', 'surprised', 'peaceful'] as const;

export const MARKER_WEATHERS = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'] as const;

export const MARKER_TRANSPORTS = ['walk', 'car', 'train', 'plane', 'metro', 'bus'] as const;

export const MARKER_BUDGET_LEVELS = ['low', 'medium', 'high'] as const;

export type SystemMarkerTag = (typeof MARKER_TAGS)[number];
export type MarkerTag = string;
export type MarkerMood = (typeof MARKER_MOODS)[number];
export type MarkerWeather = (typeof MARKER_WEATHERS)[number];
export type MarkerTransport = (typeof MARKER_TRANSPORTS)[number];
export type MarkerBudgetLevel = (typeof MARKER_BUDGET_LEVELS)[number];
