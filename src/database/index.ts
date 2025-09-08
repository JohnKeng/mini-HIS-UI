import { JsonDatabase } from './json-database.ts';

// 建立全域資料庫實例
export const database = new JsonDatabase('src/db.json');