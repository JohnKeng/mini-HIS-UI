import type { PatientState } from '../models/Patient.ts';
import type { AppointmentState } from '../models/Appointment.ts';
import type { PrescriptionState } from '../models/Prescription.ts';
import type { ServiceState } from '../models/MedicalService.ts';
import type { MedicalRecordState } from '../models/MedicalRecord.ts';
import type { Doctor } from '../types/common.ts';

export interface DatabaseSchema {
  patients: PatientState[];
  appointments: AppointmentState[];
  prescriptions: PrescriptionState[];
  services: ServiceState[];
  medicalRecords: MedicalRecordState[];
  doctors: Doctor[];
}

export function createEmptySchema(): DatabaseSchema {
  return {
    patients: [],
    appointments: [],
    prescriptions: [],
    services: [],
    medicalRecords: [],
    doctors: []
  };
}

