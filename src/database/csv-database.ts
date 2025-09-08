import fs from 'fs/promises';
import type { DatabaseInterface, EntityState } from './interface.ts';
import type { PatientState } from '../models/Patient.ts';
import type { AppointmentState } from '../models/Appointment.ts';
import type { PrescriptionState } from '../models/Prescription.ts';
import type { ServiceState } from '../models/MedicalService.ts';

export class CSVDatabase implements DatabaseInterface {
  private csvPath: string;
  private cache: Map<string, EntityState[]> = new Map();
  
  constructor(csvPath: string = 'src/db.csv') {
    this.csvPath = csvPath;
  }

  async loadData(): Promise<void> {
    try {
      const csvContent = await fs.readFile(this.csvPath, 'utf-8');
      const lines = csvContent.trim().split('\n');
      
      // 清除快取
      this.cache.clear();
      
      // 跳過標題行
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim()) {
          const [table, id, dataJson] = this.parseCSVLine(line);
          
          if (table && id && dataJson) {
            try {
              const data = JSON.parse(dataJson) as EntityState;
              
              if (!this.cache.has(table)) {
                this.cache.set(table, []);
              }
              
              const tableData = this.cache.get(table)!;
              const existingIndex = tableData.findIndex(item => this.getEntityId(item) === id);
              
              if (existingIndex >= 0) {
                tableData[existingIndex] = data;
              } else {
                tableData.push(data);
              }
            } catch (error) {
              console.error(`Error parsing JSON for ${table}:${id}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading CSV data:', error);
      // 如果檔案不存在，建立空檔案
      if ((error as any).code === 'ENOENT') {
        await this.initializeCSV();
      }
    }
  }

  private async initializeCSV(): Promise<void> {
    const header = 'table,id,data\n';
    await fs.writeFile(this.csvPath, header, 'utf-8');
  }

  private parseCSVLine(line: string): [string, string, string] {
    // 簡單的 CSV 解析，處理包含逗號的 JSON
    const firstComma = line.indexOf(',');
    const secondComma = line.indexOf(',', firstComma + 1);
    
    if (firstComma === -1 || secondComma === -1) {
      return ['', '', ''];
    }
    
    const table = line.substring(0, firstComma);
    const id = line.substring(firstComma + 1, secondComma);
    const data = line.substring(secondComma + 1);
    
    // 移除引號
    return [
      table.trim(),
      id.trim(),
      data.startsWith('"') && data.endsWith('"') ? data.slice(1, -1) : data.trim()
    ];
  }

  private getEntityId(entity: EntityState): string {
    if ('info' in entity && entity.info && typeof entity.info === 'object' && 'id' in entity.info) {
      return entity.info.id as string;
    }
    return '';
  }

  private async saveData(): Promise<void> {
    const lines = ['table,id,data'];
    
    for (const [table, entities] of this.cache.entries()) {
      for (const entity of entities) {
        const id = this.getEntityId(entity);
        if (id) {
          const dataJson = JSON.stringify(entity).replace(/"/g, '""');
          lines.push(`${table},${id},"${dataJson}"`);
        }
      }
    }
    
    await fs.writeFile(this.csvPath, lines.join('\n') + '\n', 'utf-8');
  }

  async create(table: EntityType, id: string, data: EntityState): Promise<boolean> {
    await this.loadData();
    
    if (!this.cache.has(table)) {
      this.cache.set(table, []);
    }
    
    const tableData = this.cache.get(table)!;
    const exists = tableData.some(item => this.getEntityId(item) === id);
    
    if (exists) {
      return false; // 已存在
    }
    
    tableData.push(data);
    await this.saveData();
    return true;
  }

  async read(table: EntityType, id: string): Promise<EntityState | null> {
    await this.loadData();
    
    const tableData = this.cache.get(table);
    if (!tableData) {
      return null;
    }
    
    return tableData.find(item => this.getEntityId(item) === id) || null;
  }

  async update(table: EntityType, id: string, data: EntityState): Promise<boolean> {
    await this.loadData();
    
    const tableData = this.cache.get(table);
    if (!tableData) {
      return false;
    }
    
    const index = tableData.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) {
      return false;
    }
    
    tableData[index] = data;
    await this.saveData();
    return true;
  }

  async delete(table: EntityType, id: string): Promise<boolean> {
    await this.loadData();
    
    const tableData = this.cache.get(table);
    if (!tableData) {
      return false;
    }
    
    const index = tableData.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) {
      return false;
    }
    
    tableData.splice(index, 1);
    await this.saveData();
    return true;
  }

  async findAll(table: EntityType): Promise<EntityState[]> {
    await this.loadData();
    
    const tableData = this.cache.get(table);
    return tableData ? [...tableData] : [];
  }

  async findWhere(table: EntityType, condition: (item: EntityState) => boolean): Promise<EntityState[]> {
    await this.loadData();
    
    const tableData = this.cache.get(table);
    return tableData ? tableData.filter(condition) : [];
  }
}