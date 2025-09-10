import type { Database } from './interface.ts';
import type { PatientState } from '../models/Patient.ts';
import type { AppointmentState } from '../models/Appointment.ts';
import type { PrescriptionState } from '../models/Prescription.ts';
import type { ServiceState } from '../models/MedicalService.ts';
import type { MedicalRecordState } from '../models/MedicalRecord.ts';
import type { Doctor } from '../types/common.ts';
import { StorageEngine } from './storage-engine.ts';
import { makeCollection } from './collection.ts';
import type { DatabaseSchema } from './schema.ts';

type EntityState = PatientState | AppointmentState | PrescriptionState | ServiceState | MedicalRecordState;

export class JsonDatabase implements Database {
  private engine: StorageEngine;
  private colPatients: any;
  private colAppointments: any;
  private colPrescriptions: any;
  private colServices: any;
  private colMedicalRecords: any;
  private colDoctors: any;

  constructor(jsonPath: string = 'src/db.json') {
    this.engine = new StorageEngine(jsonPath);
    // rebind collections after engine constructed
    this.colPatients = makeCollection(this.engine, 'patients');
    this.colAppointments = makeCollection(this.engine, 'appointments');
    this.colPrescriptions = makeCollection(this.engine, 'prescriptions');
    this.colServices = makeCollection(this.engine, 'services');
    this.colMedicalRecords = makeCollection(this.engine, 'medicalRecords');
    this.colDoctors = makeCollection(this.engine, 'doctors', (d: any) => String(d?.id || ''));
  }

  private getEntityId(entity: EntityState): string {
    if ('info' in entity && entity.info && typeof entity.info === 'object' && 'id' in entity.info) {
      return entity.info.id as string;
    }
    return '';
  }

  // 病患操作
  async createPatient(id: string, data: PatientState): Promise<boolean> {
    const existing = await this.colPatients.getById(id);
    if (existing) return false;
    return this.colPatients.upsert(data);
  }

  async readPatient(id: string): Promise<PatientState | null> {
    return (await this.colPatients.getById(id)) as PatientState | null;
  }

  async updatePatient(id: string, data: PatientState): Promise<boolean> {
    const existing = await this.colPatients.getById(id);
    if (!existing) return false;
    return this.colPatients.upsert(data);
  }

  async deletePatient(id: string): Promise<boolean> {
    return this.colPatients.remove(id);
  }

  async findAllPatients(): Promise<PatientState[]> {
    return (await this.colPatients.list()) as PatientState[];
  }

  // 預約操作
  async createAppointment(id: string, data: AppointmentState): Promise<boolean> {
    const existing = await this.colAppointments.getById(id);
    if (existing) return false;
    return this.colAppointments.upsert(data);
  }

  async readAppointment(id: string): Promise<AppointmentState | null> {
    return (await this.colAppointments.getById(id)) as AppointmentState | null;
  }

  async updateAppointment(id: string, data: AppointmentState): Promise<boolean> {
    const existing = await this.colAppointments.getById(id);
    if (!existing) return false;
    return this.colAppointments.upsert(data);
  }

  async deleteAppointment(id: string): Promise<boolean> {
    return this.colAppointments.remove(id);
  }

  async findAllAppointments(): Promise<AppointmentState[]> {
    return (await this.colAppointments.list()) as AppointmentState[];
  }

  // 處方操作
  async createPrescription(id: string, data: PrescriptionState): Promise<boolean> {
    const existing = await this.colPrescriptions.getById(id);
    if (existing) return false;
    return this.colPrescriptions.upsert(data);
  }

  async readPrescription(id: string): Promise<PrescriptionState | null> {
    return (await this.colPrescriptions.getById(id)) as PrescriptionState | null;
  }

  async updatePrescription(id: string, data: PrescriptionState): Promise<boolean> {
    const existing = await this.colPrescriptions.getById(id);
    if (!existing) return false;
    return this.colPrescriptions.upsert(data);
  }

  async deletePrescription(id: string): Promise<boolean> {
    return this.colPrescriptions.remove(id);
  }

  async findAllPrescriptions(): Promise<PrescriptionState[]> {
    return (await this.colPrescriptions.list()) as PrescriptionState[];
  }

  // 醫療服務操作
  async createService(id: string, data: ServiceState): Promise<boolean> {
    const existing = await this.colServices.getById(id);
    if (existing) return false;
    return this.colServices.upsert(data);
  }

  async readService(id: string): Promise<ServiceState | null> {
    return (await this.colServices.getById(id)) as ServiceState | null;
  }

  async updateService(id: string, data: ServiceState): Promise<boolean> {
    const existing = await this.colServices.getById(id);
    if (!existing) return false;
    return this.colServices.upsert(data);
  }

  async deleteService(id: string): Promise<boolean> {
    return this.colServices.remove(id);
  }

  async findAllServices(): Promise<ServiceState[]> {
    return (await this.colServices.list()) as ServiceState[];
  }

  // 病歷操作
  async createMedicalRecord(id: string, data: MedicalRecordState): Promise<boolean> {
    const existing = await this.colMedicalRecords.getById(id);
    if (existing) return false;
    return this.colMedicalRecords.upsert(data);
  }

  async readMedicalRecord(id: string): Promise<MedicalRecordState | null> {
    return (await this.colMedicalRecords.getById(id)) as MedicalRecordState | null;
  }

  async updateMedicalRecord(id: string, data: MedicalRecordState): Promise<boolean> {
    const existing = await this.colMedicalRecords.getById(id);
    if (!existing) return false;
    return this.colMedicalRecords.upsert(data);
  }

  async deleteMedicalRecord(id: string): Promise<boolean> {
    return this.colMedicalRecords.remove(id);
  }

  async findMedicalRecordsByPatient(patientId: string): Promise<MedicalRecordState[]> {
    const list = (await this.colMedicalRecords.list()) as MedicalRecordState[];
    return list.filter(r => r.info.patientId === patientId);
  }

  // 醫師（設定）
  async createDoctor(id: string, data: Doctor): Promise<boolean> {
    const existing = await this.colDoctors.getById(id);
    if (existing) return false;
    // only id/name persisted by design
    return this.colDoctors.upsert({ id: data.id, name: data.name } as any);
  }

  async readDoctor(id: string): Promise<Doctor | null> {
    return (await this.colDoctors.getById(id)) as Doctor | null;
  }

  async updateDoctor(oldId: string, data: Doctor): Promise<boolean> {
    // perform atomic check-replace
    let ok = false;
    await this.engine.atomicWrite('doctors', (ctx) => {
      const d = ctx.data;
      const arr = d.doctors.slice();
      const idx = arr.findIndex(x => x.id === oldId);
      if (idx === -1) return;
      if (oldId !== data.id) {
        const conflict = arr.some(x => x.id === data.id);
        if (conflict) return;
      }
      arr[idx] = { id: data.id, name: data.name };
      ok = true;
      ctx.setData({ ...d, doctors: arr });
    });
    return ok;
  }

  async deleteDoctor(id: string): Promise<boolean> {
    return this.colDoctors.remove(id);
  }

  async findAllDoctors(): Promise<Doctor[]> {
    return (await this.colDoctors.list()) as Doctor[];
  }
}
