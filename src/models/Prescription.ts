/**
 * 藥物處方模組
 * 
 * 這個模組展示如何使用代數資料類型 (ADT) 來表示處方的不同狀態，
 * 以及如何通過類型來引導處方流程的邏輯實現。
 */

import type { ID, DateTime, Medication } from '../types/common.ts';
import type { Result } from '../types/results.ts';
import { success, failure, ErrorCode } from '../types/results.ts';
import { createId } from '../utils/id.ts';

// 處方項目
export interface PrescriptionItem {
  medicationId: ID;
  medication: Medication;
  dosage: string;        // 例如：「1 錠」
  frequency: string;     // 例如：「每日三次」
  route: string;         // 例如：「口服」
  duration: string;      // 例如：「7 天」
  instructions?: string; // 例如：「飯後服用」
}

// 處方基本資訊
export interface PrescriptionInfo {
  id: ID;
  patientId: ID;
  doctorId: ID;
  items: PrescriptionItem[];
  notes?: string;
}

// ===== 處方狀態的代數資料類型 (ADT) =====

// 1. 已開立狀態 - 醫生已開立處方，但尚未送至藥局
export interface Created {
  tag: 'Created';
  info: PrescriptionInfo;
  createdAt: DateTime;
}

// 2. 已送出狀態 - 處方已送至藥局，等待調劑
export interface Submitted {
  tag: 'Submitted';
  info: PrescriptionInfo;
  createdAt: DateTime;
  submittedAt: DateTime;
}

// 3. 調劑中狀態 - 藥師正在調劑處方
export interface InPreparation {
  tag: 'InPreparation';
  info: PrescriptionInfo;
  createdAt: DateTime;
  submittedAt: DateTime;
  preparationStartedAt: DateTime;
  pharmacistId: ID;
}

// 4. 已調劑狀態 - 處方已調劑完成，等待發放
export interface Prepared {
  tag: 'Prepared';
  info: PrescriptionInfo;
  createdAt: DateTime;
  submittedAt: DateTime;
  preparationStartedAt: DateTime;
  preparedAt: DateTime;
  pharmacistId: ID;
  verificationNotes?: string;
}

// 5. 已發放狀態 - 藥物已發放給病患
export interface Dispensed {
  tag: 'Dispensed';
  info: PrescriptionInfo;
  createdAt: DateTime;
  submittedAt: DateTime;
  preparationStartedAt: DateTime;
  preparedAt: DateTime;
  dispensedAt: DateTime;
  pharmacistId: ID;
  dispensedBy: ID;
  patientInstructions?: string;
}

// 6. 已取消狀態 - 處方已被取消
export interface Cancelled {
  tag: 'Cancelled';
  info: PrescriptionInfo;
  createdAt: DateTime;
  submittedAt?: DateTime;
  preparationStartedAt?: DateTime;
  cancelledAt: DateTime;
  cancelledBy: ID;
  cancellationReason: string;
}

// 7. 已拒絕狀態 - 處方被藥師拒絕（例如因為藥物交互作用）
export interface Rejected {
  tag: 'Rejected';
  info: PrescriptionInfo;
  createdAt: DateTime;
  submittedAt: DateTime;
  rejectedAt: DateTime;
  rejectedBy: ID;
  rejectionReason: string;
  alternativeSuggestion?: string;
}

// 處方狀態聯合類型 - 這是一個代數資料類型 (ADT)
export type PrescriptionState = 
  | Created
  | Submitted
  | InPreparation
  | Prepared
  | Dispensed
  | Cancelled
  | Rejected;

// ===== 處方狀態轉換函數 =====

// 開立新處方
export function createPrescription(
  patientId: ID,
  doctorId: ID,
  items: PrescriptionItem[],
  notes?: string
): Result<Created> {
  // 在實際應用中，這裡可能會有驗證邏輯，例如檢查藥物交互作用
  if (items.length === 0) {
    return failure(
      ErrorCode.ValidationFailed,
      'Prescription must contain at least one medication item.'
    );
  }
  
  const now = new Date().toISOString();
  const prescriptionId = createId('rx');
  
  return success({
    tag: 'Created',
    info: {
      id: prescriptionId,
      patientId,
      doctorId,
      items,
      notes,
    },
    createdAt: now,
  });
}

// 送出處方至藥局
export function submitPrescription(
  prescription: Created
): Result<Submitted> {
  // 只有處於 Created 狀態的處方才能被送出
  if (prescription.tag !== 'Created') {
    return failure(
      ErrorCode.InvalidPrescriptionState,
      "Cannot submit prescription: must be in 'Created' state."
    );
  }
  
  const now = new Date().toISOString();
  
  return success({
    tag: 'Submitted',
    info: prescription.info,
    createdAt: prescription.createdAt,
    submittedAt: now,
  });
}

// 開始調劑處方
export function startPreparation(
  prescription: Submitted,
  pharmacistId: ID
): Result<InPreparation> {
  // 只有處於 Submitted 狀態的處方才能開始調劑
  if (prescription.tag !== 'Submitted') {
    return failure(
      ErrorCode.InvalidPrescriptionState,
      "Cannot start preparation: prescription must be in 'Submitted' state."
    );
  }
  
  const now = new Date().toISOString();
  
  return success({
    tag: 'InPreparation',
    info: prescription.info,
    createdAt: prescription.createdAt,
    submittedAt: prescription.submittedAt,
    preparationStartedAt: now,
    pharmacistId,
  });
}

// 完成處方調劑
export function completePreparing(
  prescription: InPreparation,
  verificationNotes?: string
): Result<Prepared> {
  // 只有處於 InPreparation 狀態的處方才能完成調劑
  if (prescription.tag !== 'InPreparation') {
    return failure(
      ErrorCode.InvalidPrescriptionState,
      "Cannot complete preparation: must be in 'InPreparation' state."
    );
  }
  
  const now = new Date().toISOString();
  
  return success({
    tag: 'Prepared',
    info: prescription.info,
    createdAt: prescription.createdAt,
    submittedAt: prescription.submittedAt,
    preparationStartedAt: prescription.preparationStartedAt,
    preparedAt: now,
    pharmacistId: prescription.pharmacistId,
    verificationNotes,
  });
}

// 發放處方藥物給病患
export function dispensePrescription(
  prescription: Prepared,
  dispensedBy: ID,
  patientInstructions?: string
): Result<Dispensed> {
  // 只有處於 Prepared 狀態的處方才能被發放
  if (prescription.tag !== 'Prepared') {
    return failure(
      ErrorCode.InvalidPrescriptionState,
      "Cannot dispense prescription: must be in 'Prepared' state."
    );
  }
  
  const now = new Date().toISOString();
  
  return success({
    tag: 'Dispensed',
    info: prescription.info,
    createdAt: prescription.createdAt,
    submittedAt: prescription.submittedAt,
    preparationStartedAt: prescription.preparationStartedAt,
    preparedAt: prescription.preparedAt,
    dispensedAt: now,
    pharmacistId: prescription.pharmacistId,
    dispensedBy,
    patientInstructions,
  });
}

// 取消處方
export function cancelPrescription(
  prescription: Created | Submitted | InPreparation,
  cancelledBy: ID,
  cancellationReason: string
): Result<Cancelled> {
  // 只有處於 Created、Submitted 或 InPreparation 狀態的處方才能被取消
  if (
    prescription.tag !== 'Created' && 
    prescription.tag !== 'Submitted' && 
    prescription.tag !== 'InPreparation'
  ) {
    return failure(
      ErrorCode.InvalidPrescriptionState,
        "Cannot cancel prescription. Prescription must be in 'Created', 'Submitted', or 'InPreparation' state."
    );
  }
  
  const now = new Date().toISOString();
  
  // 根據處方的當前狀態構建取消後的狀態
  const cancelled: Cancelled = {
    tag: 'Cancelled',
    info: prescription.info,
    createdAt: prescription.createdAt,
    cancelledAt: now,
    cancelledBy,
    cancellationReason,
  };
  
  // 如果處方已送出，則添加送出相關資訊
  if (prescription.tag === 'Submitted' || prescription.tag === 'InPreparation') {
    cancelled.submittedAt = prescription.submittedAt;
  }
  
  // 如果處方已開始調劑，則添加調劑開始相關資訊
  if (prescription.tag === 'InPreparation') {
    cancelled.preparationStartedAt = prescription.preparationStartedAt;
  }
  
  return success(cancelled);
}

// 拒絕處方（例如因為藥物交互作用）
export function rejectPrescription(
  prescription: Submitted,
  rejectedBy: ID,
  rejectionReason: string,
  alternativeSuggestion?: string
): Result<Rejected> {
  // 只有處於 Submitted 狀態的處方才能被拒絕
  if (prescription.tag !== 'Submitted') {
    return failure(
      ErrorCode.InvalidPrescriptionState,
      "Cannot reject prescription: must be in 'Submitted' state."
    );
  }
  
  const now = new Date().toISOString();
  
  return success({
    tag: 'Rejected',
    info: prescription.info,
    createdAt: prescription.createdAt,
    submittedAt: prescription.submittedAt,
    rejectedAt: now,
    rejectedBy,
    rejectionReason,
    alternativeSuggestion,
  });
}

// ===== 類型守衛函數 =====

// 檢查處方是否處於已開立狀態
export function isCreated(prescription: PrescriptionState): prescription is Created {
  return prescription.tag === 'Created';
}

// 檢查處方是否處於已送出狀態
export function isSubmitted(prescription: PrescriptionState): prescription is Submitted {
  return prescription.tag === 'Submitted';
}

// 檢查處方是否處於調劑中狀態
export function isInPreparation(prescription: PrescriptionState): prescription is InPreparation {
  return prescription.tag === 'InPreparation';
}

// 檢查處方是否處於已調劑狀態
export function isPrepared(prescription: PrescriptionState): prescription is Prepared {
  return prescription.tag === 'Prepared';
}

// 檢查處方是否處於已發放狀態
export function isDispensed(prescription: PrescriptionState): prescription is Dispensed {
  return prescription.tag === 'Dispensed';
}

// 檢查處方是否處於已取消狀態
export function isCancelled(prescription: PrescriptionState): prescription is Cancelled {
  return prescription.tag === 'Cancelled';
}

// 檢查處方是否處於已拒絕狀態
export function isRejected(prescription: PrescriptionState): prescription is Rejected {
  return prescription.tag === 'Rejected';
}
