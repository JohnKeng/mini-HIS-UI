import type { ID, DateTime } from '../types/common.ts';
import { createId } from '../utils/id.ts';

export interface MedicalRecordInfo {
  id: ID;
  patientId: ID;
  appointmentId?: ID;
  doctorId?: ID;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface MedicalRecordData {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  physicalExam: string;
  diagnosis: string;
  treatmentPlan: string;
}

export interface MedicalRecordState {
  info: MedicalRecordInfo;
  data: MedicalRecordData;
}

export function createMedicalRecord(
  patientId: ID,
  doctorId: ID | undefined,
  appointmentId: ID | undefined,
  data: MedicalRecordData
): MedicalRecordState {
  const now = new Date().toISOString();
  return {
    info: {
      id: createId('mr'),
      patientId,
      appointmentId,
      doctorId,
      createdAt: now,
      updatedAt: now,
    },
    data,
  };
}

export function updateMedicalRecord(
  record: MedicalRecordState,
  updates: Partial<MedicalRecordData>
): MedicalRecordState {
  return {
    ...record,
    info: {
      ...record.info,
      updatedAt: new Date().toISOString(),
    },
    data: {
      ...record.data,
      ...updates,
    },
  };
}
