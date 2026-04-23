export interface DefaultCompanion {
  name: string;
  color: string;
  sortOrder: number;
}

export function buildSingleDefaultCompanion(primaryName = '小悠'): DefaultCompanion[] {
  return [
    {
      name: primaryName,
      color: '#2563eb',
      sortOrder: 0,
    },
  ];
}

export function buildDefaultCompanions(primaryName = '小悠'): DefaultCompanion[] {
  return [
    ...buildSingleDefaultCompanion(primaryName),
    {
      name: '阿泽',
      color: '#f97316',
      sortOrder: 1,
    },
  ];
}

export const defaultCompanions: DefaultCompanion[] = buildDefaultCompanions();
