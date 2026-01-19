
import { Dexie, Table } from 'dexie';
import { DiaryEntry, AppSettings } from './types';

export class MyDatabase extends Dexie {
  diaries!: Table<DiaryEntry, number>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('PinkDiaryDB');
    this.version(2).stores({
      diaries: '++id, date, year, *tags',
      settings: 'key'
    });
    this.diaries = this.table('diaries');
    this.settings = this.table('settings');
  }
}

export const db = new MyDatabase();

// Utility functions for DB operations
export const saveDiary = async (entry: DiaryEntry) => {
  return await db.diaries.put(entry);
};

export const deleteDiary = async (id: number) => {
  return await db.diaries.delete(id);
};

export const getDiariesByYear = async (year: number) => {
  return await db.diaries.where('year').equals(year).reverse().sortBy('date');
};

export const getAllYears = async (): Promise<number[]> => {
  const diaries = await db.diaries.toArray();
  const yearList: number[] = diaries.map(d => d.year);
  const years = Array.from(new Set(yearList)) as number[];
  return years.length > 0 ? years.sort((a, b) => b - a) : [new Date().getFullYear()];
};

// Settings utilities
export const getSetting = async (key: string, defaultValue: any) => {
  const setting = await db.settings.get(key);
  return setting ? setting.value : defaultValue;
};

export const setSetting = async (key: string, value: any) => {
  return await db.settings.put({ key, value });
};
