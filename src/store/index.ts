import { create } from 'zustand';
import { User, TourismMark, CityVisit } from '../types';
import { dbService } from '../services/db';

interface TravelStore {
  // 状态
  users: User[];
  currentUser: User | null;
  marks: TourismMark[];
  cityVisits: CityVisit[];
  currentMode: 'domestic' | 'international';
  isAddingMark: boolean;
  selectedMark: TourismMark | null;
  
  // 动作
  setCurrentMode: (mode: 'domestic' | 'international') => void;
  setIsAddingMark: (isAdding: boolean) => void;
  setSelectedMark: (mark: TourismMark | null) => void;
  
  // 用户相关
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  switchUser: (userId: string) => void;
  deleteUser: (userId: string) => Promise<void>;
  loadUsers: () => Promise<void>;
  
  // 标记相关
  addMark: (mark: Omit<TourismMark, 'id' | 'createdAt'>) => Promise<void>;
  updateMark: (mark: TourismMark) => Promise<void>;
  deleteMark: (markId: string) => Promise<void>;
  loadMarks: () => Promise<void>;
  
  // 城市访问相关
  addCityVisit: (visit: Omit<CityVisit, 'id'>) => Promise<void>;
  updateCityVisit: (visit: CityVisit) => Promise<void>;
  deleteCityVisit: (visitId: string) => Promise<void>;
  loadCityVisits: () => Promise<void>;
  
  // 数据管理
  exportData: () => Promise<{ users: User[]; marks: TourismMark[]; visits: CityVisit[] }>;
  importData: (data: { users: User[]; marks: TourismMark[]; visits: CityVisit[] }) => Promise<void>;
  clearAllData: () => Promise<void>;
}

export const useTravelStore = create<TravelStore>((set, get) => ({
  // 初始状态
  users: [],
  currentUser: null,
  marks: [],
  cityVisits: [],
  currentMode: 'domestic',
  isAddingMark: false,
  selectedMark: null,
  
  // 动作
  setCurrentMode: (mode) => set({ currentMode: mode }),
  setIsAddingMark: (isAdding) => set({ isAddingMark: isAdding }),
  setSelectedMark: (mark) => set({ selectedMark: mark }),
  
  // 用户相关
  addUser: async (userData) => {
    const user: User = {
      ...userData,
      id: crypto.randomUUID(),
    };
    await dbService.addUser(user);
    set((state) => ({
      users: [...state.users, user],
      currentUser: state.currentUser || user,
    }));
  },
  
  switchUser: (userId) => {
    const user = get().users.find(u => u.id === userId);
    if (user) {
      set({ currentUser: user });
    }
  },
  
  deleteUser: async (userId) => {
    await dbService.deleteUser(userId);
    set((state) => ({
      users: state.users.filter(u => u.id !== userId),
      currentUser: state.currentUser?.id === userId ? state.users.find(u => u.id !== userId) || null : state.currentUser,
    }));
  },
  
  loadUsers: async () => {
    const users = await dbService.getUsers();
    set({ users, currentUser: users[0] || null });
  },
  
  // 标记相关
  addMark: async (markData) => {
    const mark: TourismMark = {
      ...markData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    await dbService.addTourismMark(mark);
    set((state) => ({
      marks: [...state.marks, mark],
      isAddingMark: false,
    }));
  },
  
  updateMark: async (mark) => {
    await dbService.addTourismMark(mark);
    set((state) => ({
      marks: state.marks.map(m => m.id === mark.id ? mark : m),
    }));
  },
  
  deleteMark: async (markId) => {
    await dbService.deleteTourismMark(markId);
    set((state) => ({
      marks: state.marks.filter(m => m.id !== markId),
      cityVisits: state.cityVisits.filter(v => v.markId !== markId),
      selectedMark: state.selectedMark?.id === markId ? null : state.selectedMark,
    }));
  },
  
  loadMarks: async () => {
    const marks = await dbService.getTourismMarks();
    set({ marks });
  },
  
  // 城市访问相关
  addCityVisit: async (visitData) => {
    const visit: CityVisit = {
      ...visitData,
      id: crypto.randomUUID(),
    };
    await dbService.addCityVisit(visit);
    set((state) => ({
      cityVisits: [...state.cityVisits, visit],
    }));
  },
  
  updateCityVisit: async (visit) => {
    await dbService.addCityVisit(visit);
    set((state) => ({
      cityVisits: state.cityVisits.map(v => v.id === visit.id ? visit : v),
    }));
  },
  
  deleteCityVisit: async (visitId) => {
    await dbService.deleteCityVisit(visitId);
    set((state) => ({
      cityVisits: state.cityVisits.filter(v => v.id !== visitId),
    }));
  },
  
  loadCityVisits: async () => {
    const visits = await dbService.getCityVisits();
    set({ cityVisits: visits });
  },
  
  // 数据管理
  exportData: async () => {
    return await dbService.exportData();
  },
  
  importData: async (data) => {
    await dbService.importData(data);
    set({
      users: data.users,
      marks: data.marks,
      cityVisits: data.visits,
      currentUser: data.users[0] || null,
    });
  },
  
  clearAllData: async () => {
    await dbService.clearAllData();
    set({
      users: [],
      currentUser: null,
      marks: [],
      cityVisits: [],
      selectedMark: null,
    });
  },
}));

// 初始化加载数据
export const initializeStore = async () => {
  const store = useTravelStore.getState();
  await store.loadUsers();
  await store.loadMarks();
  await store.loadCityVisits();
};