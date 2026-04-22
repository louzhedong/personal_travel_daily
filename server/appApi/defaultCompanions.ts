export interface DefaultCompanion {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export const defaultCompanions: DefaultCompanion[] = [
  {
    id: 'user-alice',
    name: '小悠',
    color: '#2563eb',
    sortOrder: 0,
  },
  {
    id: 'user-bob',
    name: '阿泽',
    color: '#f97316',
    sortOrder: 1,
  },
];
