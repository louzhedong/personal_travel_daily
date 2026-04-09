import { openDB, IDBPDatabase } from 'idb';
import { User, TourismMark, CityVisit } from '../types';

const DB_NAME = 'travel-record-db';
const DB_VERSION = 1;

class DBService {
  private db: IDBPDatabase | null = null;

  async init() {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 创建用户存储
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }

        // 创建旅游标记存储
        if (!db.objectStoreNames.contains('tourismMarks')) {
          const markStore = db.createObjectStore('tourismMarks', { keyPath: 'id' });
          markStore.createIndex('userId', 'userId');
          markStore.createIndex('type', 'type');
        }

        // 创建城市访问存储
        if (!db.objectStoreNames.contains('cityVisits')) {
          const visitStore = db.createObjectStore('cityVisits', { keyPath: 'id' });
          visitStore.createIndex('markId', 'markId');
        }
      },
    });
  }

  // 用户相关操作
  async addUser(user: User): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('users', user);
  }

  async getUsers(): Promise<User[]> {
    if (!this.db) await this.init();
    return await this.db!.getAll('users');
  }

  async getUser(id: string): Promise<User | undefined> {
    if (!this.db) await this.init();
    return await this.db!.get('users', id);
  }

  async deleteUser(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('users', id);
  }

  // 旅游标记相关操作
  async addTourismMark(mark: TourismMark): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('tourismMarks', mark);
  }

  async getTourismMarks(): Promise<TourismMark[]> {
    if (!this.db) await this.init();
    return await this.db!.getAll('tourismMarks');
  }

  async getTourismMarksByUser(userId: string): Promise<TourismMark[]> {
    if (!this.db) await this.init();
    const index = this.db!.transaction('tourismMarks').store.index('userId');
    return await index.getAll(userId);
  }

  async getTourismMarksByType(type: 'domestic' | 'international'): Promise<TourismMark[]> {
    if (!this.db) await this.init();
    const index = this.db!.transaction('tourismMarks').store.index('type');
    return await index.getAll(type);
  }

  async deleteTourismMark(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('tourismMarks', id);
  }

  // 城市访问相关操作
  async addCityVisit(visit: CityVisit): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('cityVisits', visit);
  }

  async getCityVisits(): Promise<CityVisit[]> {
    if (!this.db) await this.init();
    return await this.db!.getAll('cityVisits');
  }

  async getCityVisitsByMarkId(markId: string): Promise<CityVisit[]> {
    if (!this.db) await this.init();
    const index = this.db!.transaction('cityVisits').store.index('markId');
    return await index.getAll(markId);
  }

  async deleteCityVisit(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('cityVisits', id);
  }

  // 数据导入/导出
  async exportData(): Promise<{ users: User[]; marks: TourismMark[]; visits: CityVisit[] }> {
    const users = await this.getUsers();
    const marks = await this.getTourismMarks();
    const visits = await this.getCityVisits();
    return { users, marks, visits };
  }

  async importData(data: { users: User[]; marks: TourismMark[]; visits: CityVisit[] }): Promise<void> {
    if (!this.db) await this.init();
    
    // 清空现有数据
    await this.clearAllData();
    
    // 导入数据
    for (const user of data.users) {
      await this.addUser(user);
    }
    
    for (const mark of data.marks) {
      await this.addTourismMark(mark);
    }
    
    for (const visit of data.visits) {
      await this.addCityVisit(visit);
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();
    
    const tx = this.db!.transaction(['users', 'tourismMarks', 'cityVisits'], 'readwrite');
    await tx.objectStore('users').clear();
    await tx.objectStore('tourismMarks').clear();
    await tx.objectStore('cityVisits').clear();
    await tx.done;
  }
}

export const dbService = new DBService();