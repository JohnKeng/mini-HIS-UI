import type { DatabaseInterface, DatabaseConfig } from './interface.ts';
import { CSVDatabase } from './csv-database.ts';

export class DatabaseFactory {
  static create(config: DatabaseConfig): DatabaseInterface {
    switch (config.type) {
      case 'csv':
        return new CSVDatabase(config.file);
      
      case 'json':
        // 未來可以實現 JSON 檔案資料庫
        throw new Error('JSON database not implemented yet');
      
      case 'sqlite':
        // 未來可以實現 SQLite 資料庫
        throw new Error('SQLite database not implemented yet');
      
      case 'postgresql':
        // 未來可以實現 PostgreSQL 資料庫
        throw new Error('PostgreSQL database not implemented yet');
      
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
  }
}

// 預設資料庫配置
export const defaultDatabaseConfig: DatabaseConfig = {
  type: 'csv',
  file: 'src/db.csv'
};

// 全域資料庫實例
export const database = DatabaseFactory.create(defaultDatabaseConfig);