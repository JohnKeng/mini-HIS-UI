import type { PatientState } from '../models/Patient.ts';
import type { AppointmentState } from '../models/Appointment.ts';
import type { PrescriptionState } from '../models/Prescription.ts';
import type { ServiceState } from '../models/MedicalService.ts';

export type EntityType = 'patients' | 'appointments' | 'prescriptions' | 'services';

export type EntityState = PatientState | AppointmentState | PrescriptionState | ServiceState;

export interface DatabaseInterface {
  // 通用 CRUD 操作
  create(table: EntityType, id: string, data: EntityState): Promise<boolean>;
  read(table: EntityType, id: string): Promise<EntityState | null>;
  update(table: EntityType, id: string, data: EntityState): Promise<boolean>;
  delete(table: EntityType, id: string): Promise<boolean>;
  
  // 查詢操作
  findAll(table: EntityType): Promise<EntityState[]>;
  findWhere(table: EntityType, condition: (item: EntityState) => boolean): Promise<EntityState[]>;
}

export interface DatabaseConfig {
  type: 'csv' | 'json' | 'sqlite' | 'postgresql';
  connection?: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
  };
  file?: string;
}