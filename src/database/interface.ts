import type { PatientState } from '../models/Patient.ts';
import type { AppointmentState } from '../models/Appointment.ts';
import type { PrescriptionState } from '../models/Prescription.ts';
import type { ServiceState } from '../models/MedicalService.ts';

export type EntityState = PatientState | AppointmentState | PrescriptionState | ServiceState;

export interface DatabaseInterface {
  // 病患操作
  createPatient(id: string, data: PatientState): Promise<boolean>;
  readPatient(id: string): Promise<PatientState | null>;
  updatePatient(id: string, data: PatientState): Promise<boolean>;
  deletePatient(id: string): Promise<boolean>;
  findAllPatients(): Promise<PatientState[]>;
  
  // 預約操作
  createAppointment(id: string, data: AppointmentState): Promise<boolean>;
  readAppointment(id: string): Promise<AppointmentState | null>;
  updateAppointment(id: string, data: AppointmentState): Promise<boolean>;
  deleteAppointment(id: string): Promise<boolean>;
  findAllAppointments(): Promise<AppointmentState[]>;
  
  // 處方操作
  createPrescription(id: string, data: PrescriptionState): Promise<boolean>;
  readPrescription(id: string): Promise<PrescriptionState | null>;
  updatePrescription(id: string, data: PrescriptionState): Promise<boolean>;
  deletePrescription(id: string): Promise<boolean>;
  findAllPrescriptions(): Promise<PrescriptionState[]>;
  
  // 醫療服務操作
  createService(id: string, data: ServiceState): Promise<boolean>;
  readService(id: string): Promise<ServiceState | null>;
  updateService(id: string, data: ServiceState): Promise<boolean>;
  deleteService(id: string): Promise<boolean>;
  findAllServices(): Promise<ServiceState[]>;
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