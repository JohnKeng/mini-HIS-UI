import fs from 'fs/promises';
import type { Database } from './interface.ts';
import type { PatientState } from '../models/Patient.ts';
import type { AppointmentState } from '../models/Appointment.ts';
import type { PrescriptionState } from '../models/Prescription.ts';
import type { ServiceState } from '../models/MedicalService.ts';
import type { MedicalRecordState } from '../models/MedicalRecord.ts';

type EntityState = PatientState | AppointmentState | PrescriptionState | ServiceState | MedicalRecordState;

interface DatabaseSchema {
  patients: PatientState[];
  appointments: AppointmentState[];
  prescriptions: PrescriptionState[];
  services: ServiceState[];
  medicalRecords: MedicalRecordState[];
}

export class JsonDatabase implements Database {
  private jsonPath: string;
  private cache: DatabaseSchema | null = null;
  
  constructor(jsonPath: string = 'src/db.json') {
    this.jsonPath = jsonPath;
  }

  private async loadData(): Promise<void> {
    try {
      const jsonContent = await fs.readFile(this.jsonPath, 'utf-8');
      this.cache = JSON.parse(jsonContent);
      // 向後相容：確保新增集合存在
      if (!(this.cache as any).medicalRecords) {
        (this.cache as any).medicalRecords = [];
      }
    } catch (error) {
      // 如果檔案不存在，建立空檔案
      if ((error as any).code === 'ENOENT') {
        await this.initializeJson();
      } else {
        console.error('Error loading JSON data:', error);
        throw error;
      }
    }
  }

  private async initializeJson(): Promise<void> {
    const emptySchema: DatabaseSchema = {
      patients: [],
      appointments: [],
      prescriptions: [],
      services: [],
      medicalRecords: []
    };
    this.cache = emptySchema;
    await this.saveData();
  }

  private async saveData(): Promise<void> {
    if (!this.cache) return;
    const jsonContent = JSON.stringify(this.cache, null, 2);
    await fs.writeFile(this.jsonPath, jsonContent, 'utf-8');
  }

  private getEntityId(entity: EntityState): string {
    if ('info' in entity && entity.info && typeof entity.info === 'object' && 'id' in entity.info) {
      return entity.info.id as string;
    }
    return '';
  }

  // 病患操作
  async createPatient(id: string, data: PatientState): Promise<boolean> {
    await this.loadData();
    if (!this.cache) return false;
    
    const exists = this.cache.patients.some(item => this.getEntityId(item) === id);
    if (exists) return false;
    
    this.cache.patients.push(data);
    await this.saveData();
    return true;
  }

  async readPatient(id: string): Promise<PatientState | null> {
    await this.loadData();
    if (!this.cache) return null;
    
    return this.cache.patients.find(item => this.getEntityId(item) === id) || null;
  }

  async updatePatient(id: string, data: PatientState): Promise<boolean> {
    await this.loadData();
    if (!this.cache) return false;
    
    const index = this.cache.patients.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    
    this.cache.patients[index] = data;
    await this.saveData();
    return true;
  }

  async deletePatient(id: string): Promise<boolean> {
    await this.loadData();
    if (!this.cache) return false;
    
    const index = this.cache.patients.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    
    this.cache.patients.splice(index, 1);
    await this.saveData();
    return true;
  }

  async findAllPatients(): Promise<PatientState[]> {
    await this.loadData();
    return this.cache?.patients || [];
  }

  // 預約操作
  async createAppointment(id: string, data: AppointmentState): Promise<boolean> {
    await this.loadData();
    if (!this.cache) return false;
    
    const exists = this.cache.appointments.some(item => this.getEntityId(item) === id);
    if (exists) return false;
    
    this.cache.appointments.push(data);
    await this.saveData();
    return true;
  }

  async readAppointment(id: string): Promise<AppointmentState | null> {
    await this.loadData();
    if (!this.cache) return null;
    
    return this.cache.appointments.find(item => this.getEntityId(item) === id) || null;
  }

  async updateAppointment(id: string, data: AppointmentState): Promise<boolean> {
    await this.loadData();
    if (!this.cache) return false;
    
    const index = this.cache.appointments.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    
    this.cache.appointments[index] = data;
    await this.saveData();
    return true;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    await this.loadData();
    if (!this.cache) return false;
    
    const index = this.cache.appointments.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    
    this.cache.appointments.splice(index, 1);
    await this.saveData();
    return true;
  }

  async findAllAppointments(): Promise<AppointmentState[]> {
    await this.loadData();
    return this.cache?.appointments || [];
  }

  // 處方操作
  async createPrescription(id: string, data: PrescriptionState): Promise<boolean> {
    await this.loadData();
    if (!this.cache) return false;
    
    const exists = this.cache.prescriptions.some(item => this.getEntityId(item) === id);
    if (exists) return false;
    
    this.cache.prescriptions.push(data);
    await this.saveData();
    return true;
  }

  async readPrescription(id: string): Promise<PrescriptionState | null> {
    await this.loadData();
    if (!this.cache) return null;
    
    return this.cache.prescriptions.find(item => this.getEntityId(item) === id) || null;
  }

  async updatePrescription(id: string, data: PrescriptionState): Promise<boolean> {
    await this.loadData();
    if (!this.cache) return false;
    
    const index = this.cache.prescriptions.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    
    this.cache.prescriptions[index] = data;
    await this.saveData();
    return true;
  }

  async deletePrescription(id: string): Promise<boolean> {
    await this.loadData();
    if (!this.cache) return false;
    
    const index = this.cache.prescriptions.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    
    this.cache.prescriptions.splice(index, 1);
    await this.saveData();
    return true;
  }

  async findAllPrescriptions(): Promise<PrescriptionState[]> {
    await this.loadData();
    return this.cache?.prescriptions || [];
  }

  // 醫療服務操作
  async createService(id: string, data: ServiceState): Promise<boolean> {
    await this.loadData();
    if (!this.cache) return false;
    
    const exists = this.cache.services.some(item => this.getEntityId(item) === id);
    if (exists) return false;
    
    this.cache.services.push(data);
    await this.saveData();
    return true;
  }

  async readService(id: string): Promise<ServiceState | null> {
    await this.loadData();
    if (!this.cache) return null;
    
    return this.cache.services.find(item => this.getEntityId(item) === id) || null;
  }

  async updateService(id: string, data: ServiceState): Promise<boolean> {
    await this.loadData();
    if (!this.cache) return false;
    
    const index = this.cache.services.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    
    this.cache.services[index] = data;
    await this.saveData();
    return true;
  }

  async deleteService(id: string): Promise<boolean> {
    await this.loadData();
    if (!this.cache) return false;
    
    const index = this.cache.services.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    
    this.cache.services.splice(index, 1);
    await this.saveData();
    return true;
  }

  async findAllServices(): Promise<ServiceState[]> {
    await this.loadData();
    return this.cache?.services || [];
  }

  // 病歷操作
  async createMedicalRecord(id: string, data: MedicalRecordState): Promise<boolean> {
    await this.loadData();
    if (!this.cache) return false;
    const exists = this.cache.medicalRecords.some(item => this.getEntityId(item) === id);
    if (exists) return false;
    this.cache.medicalRecords.push(data);
    await this.saveData();
    return true;
  }

  async readMedicalRecord(id: string): Promise<MedicalRecordState | null> {
    await this.loadData();
    if (!this.cache) return null;
    return this.cache.medicalRecords.find(item => this.getEntityId(item) === id) || null;
  }

  async updateMedicalRecord(id: string, data: MedicalRecordState): Promise<boolean> {
    await this.loadData();
    if (!this.cache) return false;
    const index = this.cache.medicalRecords.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    this.cache.medicalRecords[index] = data;
    await this.saveData();
    return true;
  }

  async deleteMedicalRecord(id: string): Promise<boolean> {
    await this.loadData();
    if (!this.cache) return false;
    const index = this.cache.medicalRecords.findIndex(item => this.getEntityId(item) === id);
    if (index === -1) return false;
    this.cache.medicalRecords.splice(index, 1);
    await this.saveData();
    return true;
  }

  async findMedicalRecordsByPatient(patientId: string): Promise<MedicalRecordState[]> {
    await this.loadData();
    return (this.cache?.medicalRecords || []).filter(r => r.info.patientId === patientId);
  }
}
