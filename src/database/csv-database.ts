import fs from 'fs/promises';
import type { Database } from './interface.ts';
import type { PatientState } from '../models/Patient.ts';
import type { AppointmentState } from '../models/Appointment.ts';
import type { PrescriptionState } from '../models/Prescription.ts';
import type { ServiceState } from '../models/MedicalService.ts';

type EntityState = PatientState | AppointmentState | PrescriptionState | ServiceState;

export class CSVDatabase implements Database {
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
    // 正確解析 CSV：找到前兩個逗號，其餘都是 JSON 資料
    const firstComma = line.indexOf(',');
    const secondComma = line.indexOf(',', firstComma + 1);
    
    if (firstComma === -1 || secondComma === -1) {
      return ['', '', ''];
    }
    
    const table = line.substring(0, firstComma).trim();
    const id = line.substring(firstComma + 1, secondComma).trim();
    const dataField = line.substring(secondComma + 1);
    
    // 處理 CSV 中被雙引號包圍的 JSON 字串
    let cleanData = dataField.trim();
    if (cleanData.startsWith('"') && cleanData.endsWith('"')) {
      cleanData = cleanData.slice(1, -1);
      // 將 CSV 轉義的雙引號 ("") 轉換回正常的雙引號 (")
      cleanData = cleanData.replace(/""/g, '"');
    }
    
    return [table, id, cleanData];
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

  // 病患操作
  async createPatient(id: string, data: PatientState): Promise<boolean> {
    await this.loadData();
    if (!this.cache.has('patients')) {
      this.cache.set('patients', []);
    }
    const tableData = this.cache.get('patients')!;
    const exists = tableData.some(item => this.getEntityId(item) === id);
    if (exists) return false;
    tableData.push(data);
    await this.saveData();
    return true;
  }

  async readPatient(id: string): Promise<PatientState | null> {
    await this.loadData();
    const tableData = this.cache.get('patients');
    if (!tableData) return null;
    return (tableData.find(item => this.getEntityId(item) === id) as PatientState) || null;
  }

  async updatePatient(id: string, data: PatientState): Promise<boolean> {
    await this.loadData();
    const tableData = this.cache.get('patients');
    if (!tableData) return false;
    const index = tableData.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    tableData[index] = data;
    await this.saveData();
    return true;
  }

  async deletePatient(id: string): Promise<boolean> {
    await this.loadData();
    const tableData = this.cache.get('patients');
    if (!tableData) return false;
    const index = tableData.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    tableData.splice(index, 1);
    await this.saveData();
    return true;
  }

  async findAllPatients(): Promise<PatientState[]> {
    await this.loadData();
    const tableData = this.cache.get('patients');
    return tableData ? [...tableData] as PatientState[] : [];
  }

  // 預約操作
  async createAppointment(id: string, data: AppointmentState): Promise<boolean> {
    await this.loadData();
    if (!this.cache.has('appointments')) {
      this.cache.set('appointments', []);
    }
    const tableData = this.cache.get('appointments')!;
    const exists = tableData.some(item => this.getEntityId(item) === id);
    if (exists) return false;
    tableData.push(data);
    await this.saveData();
    return true;
  }

  async readAppointment(id: string): Promise<AppointmentState | null> {
    await this.loadData();
    const tableData = this.cache.get('appointments');
    if (!tableData) return null;
    return (tableData.find(item => this.getEntityId(item) === id) as AppointmentState) || null;
  }

  async updateAppointment(id: string, data: AppointmentState): Promise<boolean> {
    await this.loadData();
    const tableData = this.cache.get('appointments');
    if (!tableData) return false;
    const index = tableData.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    tableData[index] = data;
    await this.saveData();
    return true;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    await this.loadData();
    const tableData = this.cache.get('appointments');
    if (!tableData) return false;
    const index = tableData.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    tableData.splice(index, 1);
    await this.saveData();
    return true;
  }

  async findAllAppointments(): Promise<AppointmentState[]> {
    await this.loadData();
    const tableData = this.cache.get('appointments');
    return tableData ? [...tableData] as AppointmentState[] : [];
  }

  // 處方操作
  async createPrescription(id: string, data: PrescriptionState): Promise<boolean> {
    await this.loadData();
    if (!this.cache.has('prescriptions')) {
      this.cache.set('prescriptions', []);
    }
    const tableData = this.cache.get('prescriptions')!;
    const exists = tableData.some(item => this.getEntityId(item) === id);
    if (exists) return false;
    tableData.push(data);
    await this.saveData();
    return true;
  }

  async readPrescription(id: string): Promise<PrescriptionState | null> {
    await this.loadData();
    const tableData = this.cache.get('prescriptions');
    if (!tableData) return null;
    return (tableData.find(item => this.getEntityId(item) === id) as PrescriptionState) || null;
  }

  async updatePrescription(id: string, data: PrescriptionState): Promise<boolean> {
    await this.loadData();
    const tableData = this.cache.get('prescriptions');
    if (!tableData) return false;
    const index = tableData.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    tableData[index] = data;
    await this.saveData();
    return true;
  }

  async deletePrescription(id: string): Promise<boolean> {
    await this.loadData();
    const tableData = this.cache.get('prescriptions');
    if (!tableData) return false;
    const index = tableData.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    tableData.splice(index, 1);
    await this.saveData();
    return true;
  }

  async findAllPrescriptions(): Promise<PrescriptionState[]> {
    await this.loadData();
    const tableData = this.cache.get('prescriptions');
    return tableData ? [...tableData] as PrescriptionState[] : [];
  }

  // 醫療服務操作
  async createService(id: string, data: ServiceState): Promise<boolean> {
    await this.loadData();
    if (!this.cache.has('services')) {
      this.cache.set('services', []);
    }
    const tableData = this.cache.get('services')!;
    const exists = tableData.some(item => this.getEntityId(item) === id);
    if (exists) return false;
    tableData.push(data);
    await this.saveData();
    return true;
  }

  async readService(id: string): Promise<ServiceState | null> {
    await this.loadData();
    const tableData = this.cache.get('services');
    if (!tableData) return null;
    return (tableData.find(item => this.getEntityId(item) === id) as ServiceState) || null;
  }

  async updateService(id: string, data: ServiceState): Promise<boolean> {
    await this.loadData();
    const tableData = this.cache.get('services');
    if (!tableData) return false;
    const index = tableData.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    tableData[index] = data;
    await this.saveData();
    return true;
  }

  async deleteService(id: string): Promise<boolean> {
    await this.loadData();
    const tableData = this.cache.get('services');
    if (!tableData) return false;
    const index = tableData.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    tableData.splice(index, 1);
    await this.saveData();
    return true;
  }

  async findAllServices(): Promise<ServiceState[]> {
    await this.loadData();
    const tableData = this.cache.get('services');
    return tableData ? [...tableData] as ServiceState[] : [];
  }
}