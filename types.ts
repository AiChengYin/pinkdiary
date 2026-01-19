
export interface DiaryEntry {
  id?: number;
  date: string; // ISO format
  content: string;
  mood: string;
  images: string[]; // Base64 or URLs
  tags: string[];
  location?: string;
  year: number;
}

export interface AppSettings {
  key: string;
  value: any;
}

export enum Mood {
  EXCITED = '🥰',
  HAPPY = '😊',
  NORMAL = '😐',
  SAD = '😢',
  ANGRY = '😡'
}
