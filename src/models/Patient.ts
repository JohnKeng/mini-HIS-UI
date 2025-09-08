/**
 * 病患管理模組
 * 
 * 這個模組展示如何使用代數資料類型 (ADT) 來表示病患的不同狀態，
 * 以及如何通過類型來引導邏輯實現。
 */

import type { ID, DateTime, Person, Address, Diagnosis } from '../types/common.ts';
import type { Result } from '../types/results.ts';
import { success, failure, ErrorCode } from '../types/results.ts';

// 病患基本資訊
export interface PatientInfo extends Person {
  address: Address;
  emergencyContact?: {
    name: string;
    relationship: string;
    contactNumber: string;
  };
  insuranceNumber?: string;
  bloodType?: 'A' | 'B' | 'AB' | 'O' | 'unknown';
  allergies?: string[];
}

// ===== 病患狀態的代數資料類型 (ADT) =====

// 1. 已登記狀態 - 病患已在系統中登記，但尚未入院
export interface Registered {
  tag: 'Registered';
  patientId: ID;
  registeredAt: DateTime;
  info: PatientInfo;
}

// 2. 已入院狀態 - 病患已入院並正在接受治療
export interface Admitted {
  tag: 'Admitted';
  patientId: ID;
  registeredAt: DateTime;
  admittedAt: DateTime;
  wardNumber: string;
  bedNumber: string;
  attendingDoctorId: ID;
  info: PatientInfo;
  diagnoses: Diagnosis[];
}

// 3. 已出院狀態 - 病患已完成治療並出院
export interface Discharged {
  tag: 'Discharged';
  patientId: ID;
  registeredAt: DateTime;
  admittedAt: DateTime;
  dischargedAt: DateTime;
  info: PatientInfo;
  diagnoses: Diagnosis[];
  dischargeSummary: string;
  followUpDate?: DateTime;
}

// 4. 已轉診狀態 - 病患已被轉診到其他醫療機構
export interface Referred {
  tag: 'Referred';
  patientId: ID;
  registeredAt: DateTime;
  referredAt: DateTime;
  info: PatientInfo;
  referredTo: string; // 轉診醫療機構名稱
  referredDoctorName: string;
  referralReason: string;
}

// 5. 已過世狀態 - 病患已過世
export interface Deceased {
  tag: 'Deceased';
  patientId: ID;
  registeredAt: DateTime;
  admittedAt?: DateTime;
  deceasedAt: DateTime;
  info: PatientInfo;
  diagnoses: Diagnosis[];
  causeOfDeath: string;
}

// 病患狀態聯合類型 - 這是一個代數資料類型 (ADT)
export type PatientState = 
  | Registered
  | Admitted
  | Discharged
  | Referred
  | Deceased;

// ===== 病患狀態轉換函數 =====

// 登記新病患
export function registerPatient(info: PatientInfo, patientId: ID): Result<Registered> {
  // 在實際應用中，這裡可能會有驗證邏輯
  const now = new Date().toISOString();
  
  return success({
    tag: 'Registered',
    patientId,
    registeredAt: now,
    info,
  });
}

// 病患入院
export function admitPatient(
  patient: Registered,
  wardNumber: string,
  bedNumber: string,
  attendingDoctorId: ID,
  initialDiagnosis?: Diagnosis
): Result<Admitted> {
  // 只有處於 Registered 狀態的病患才能入院
  if (patient.tag !== 'Registered') {
    return failure(
      ErrorCode.InvalidPatientState,
      "Cannot admit patient: must be in 'Registered' state."
    );
  }
  
  const now = new Date().toISOString();
  const diagnoses = initialDiagnosis ? [initialDiagnosis] : [];
  
  return success({
    tag: 'Admitted',
    patientId: patient.patientId,
    registeredAt: patient.registeredAt,
    admittedAt: now,
    wardNumber,
    bedNumber,
    attendingDoctorId,
    info: patient.info,
    diagnoses,
  });
}

// 病患出院
export function dischargePatient(
  patient: Admitted,
  dischargeSummary: string,
  followUpDate?: DateTime
): Result<Discharged> {
  // 只有處於 Admitted 狀態的病患才能出院
  if (patient.tag !== 'Admitted') {
    return failure(
      ErrorCode.InvalidPatientState,
      "Cannot discharge patient: must be in 'Admitted' state."
    );
  }
  
  const now = new Date().toISOString();
  
  return success({
    tag: 'Discharged',
    patientId: patient.patientId,
    registeredAt: patient.registeredAt,
    admittedAt: patient.admittedAt,
    dischargedAt: now,
    info: patient.info,
    diagnoses: patient.diagnoses,
    dischargeSummary,
    followUpDate,
  });
}

// 轉診病患
export function referPatient(
  patient: PatientState,
  referredTo: string,
  referredDoctorName: string,
  referralReason: string
): Result<Referred> {
  // 只有處於 Registered 或 Admitted 狀態的病患才能被轉診
  if (patient.tag !== 'Registered' && patient.tag !== 'Admitted') {
    return failure(
      ErrorCode.InvalidPatientState,
      `Cannot refer patient in '${patient.tag}' state. Patient must be in 'Registered' or 'Admitted' state.`
    );
  }
  
  const now = new Date().toISOString();
  
  return success({
    tag: 'Referred',
    patientId: patient.patientId,
    registeredAt: patient.registeredAt,
    referredAt: now,
    info: patient.info,
    referredTo,
    referredDoctorName,
    referralReason,
  });
}

// 記錄病患過世
export function recordDeceased(
  patient: PatientState,
  causeOfDeath: string,
  deceasedAt: DateTime = new Date().toISOString()
): Result<Deceased> {
  // 病患可以在任何狀態下過世，但我們需要根據不同狀態提取不同的資訊
  const diagnoses: Diagnosis[] = [];
  let admittedAt: DateTime | undefined;
  
  if (patient.tag === 'Admitted' || patient.tag === 'Discharged') {
    diagnoses.push(...patient.diagnoses);
    admittedAt = patient.admittedAt;
  }
  
  return success({
    tag: 'Deceased',
    patientId: patient.patientId,
    registeredAt: patient.registeredAt,
    admittedAt,
    deceasedAt,
    info: patient.info,
    diagnoses,
    causeOfDeath,
  });
}

// 添加診斷
export function addDiagnosis(
  patient: Admitted,
  diagnosis: Diagnosis
): Result<Admitted> {
  // 只有處於 Admitted 狀態的病患才能添加診斷
  if (patient.tag !== 'Admitted') {
    return failure(
      ErrorCode.InvalidPatientState,
      "Cannot add diagnosis: patient must be in 'Admitted' state."
    );
  }
  
  return success({
    ...patient,
    diagnoses: [...patient.diagnoses, diagnosis],
  });
}

// ===== 類型守衛函數 =====

// 檢查病患是否處於已登記狀態
export function isRegistered(patient: PatientState): patient is Registered {
  return patient.tag === 'Registered';
}

// 檢查病患是否處於已入院狀態
export function isAdmitted(patient: PatientState): patient is Admitted {
  return patient.tag === 'Admitted';
}

// 檢查病患是否處於已出院狀態
export function isDischarged(patient: PatientState): patient is Discharged {
  return patient.tag === 'Discharged';
}

// 檢查病患是否處於已轉診狀態
export function isReferred(patient: PatientState): patient is Referred {
  return patient.tag === 'Referred';
}

// 檢查病患是否處於已過世狀態
export function isDeceased(patient: PatientState): patient is Deceased {
  return patient.tag === 'Deceased';
}
