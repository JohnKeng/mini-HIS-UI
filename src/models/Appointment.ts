/**
 * 預約系統模組
 * 
 * 這個模組展示如何使用代數資料類型 (ADT) 來表示預約的不同狀態，
 * 以及如何通過類型來引導預約流程的邏輯實現。
 */

import type { ID, DateTime, TimeSlot } from '../types/common.ts';
import type { Result } from '../types/results.ts';
import { success, failure, ErrorCode } from '../types/results.ts';

// 預約基本資訊
export interface AppointmentInfo {
  id: ID;
  patientId: ID;
  doctorId: ID;
  department: string;
  timeSlot: TimeSlot;
  purpose: string;
  notes?: string;
}

// ===== 預約狀態的代數資料類型 (ADT) =====

// 1. 已請求狀態 - 病患已請求預約，但尚未確認
export interface Requested {
  tag: 'Requested';
  info: AppointmentInfo;
  requestedAt: DateTime;
}

// 2. 已確認狀態 - 預約已被醫療機構確認
export interface Confirmed {
  tag: 'Confirmed';
  info: AppointmentInfo;
  requestedAt: DateTime;
  confirmedAt: DateTime;
  confirmationNumber: string;
}

// 3. 已報到狀態 - 病患已在預約時間報到
export interface CheckedIn {
  tag: 'CheckedIn';
  info: AppointmentInfo;
  requestedAt: DateTime;
  confirmedAt: DateTime;
  confirmationNumber: string;
  checkedInAt: DateTime;
}

// 4. 進行中狀態 - 病患正在接受診療
export interface InProgress {
  tag: 'InProgress';
  info: AppointmentInfo;
  requestedAt: DateTime;
  confirmedAt: DateTime;
  confirmationNumber: string;
  checkedInAt: DateTime;
  startedAt: DateTime;
}

// 5. 已完成狀態 - 預約已完成
export interface Completed {
  tag: 'Completed';
  info: AppointmentInfo;
  requestedAt: DateTime;
  confirmedAt: DateTime;
  confirmationNumber: string;
  checkedInAt: DateTime;
  startedAt: DateTime;
  completedAt: DateTime;
  followUpNeeded: boolean;
  followUpNotes?: string;
}

// 6. 已取消狀態 - 預約已被取消
export interface Cancelled {
  tag: 'Cancelled';
  info: AppointmentInfo;
  requestedAt: DateTime;
  confirmedAt?: DateTime;
  confirmationNumber?: string;
  cancelledAt: DateTime;
  cancelledBy: 'patient' | 'doctor' | 'system';
  cancellationReason: string;
}

// 7. 未出席狀態 - 病患未出席預約
export interface NoShow {
  tag: 'NoShow';
  info: AppointmentInfo;
  requestedAt: DateTime;
  confirmedAt: DateTime;
  confirmationNumber: string;
  recordedAt: DateTime;
  notes?: string;
}

// 預約狀態聯合類型 - 這是一個代數資料類型 (ADT)
export type AppointmentState = 
  | Requested
  | Confirmed
  | CheckedIn
  | InProgress
  | Completed
  | Cancelled
  | NoShow;

// ===== 預約狀態轉換函數 =====

// 請求新預約
export function requestAppointment(
  patientId: ID,
  doctorId: ID,
  department: string,
  timeSlot: TimeSlot,
  purpose: string,
  notes?: string
): Result<Requested> {
  // 在實際應用中，這裡可能會有驗證邏輯，例如檢查時間段是否可用
  const now = new Date().toISOString();
  const appointmentId = `appt-${Date.now()}`; // 簡單的 ID 生成方式，實際應用中可能會更複雜
  
  return success({
    tag: 'Requested',
    info: {
      id: appointmentId,
      patientId,
      doctorId,
      department,
      timeSlot,
      purpose,
      notes,
    },
    requestedAt: now,
  });
}

// 確認預約
export function confirmAppointment(
  appointment: Requested,
  confirmationNumber: string
): Result<Confirmed> {
  // 只有處於 Requested 狀態的預約才能被確認
  if (appointment.tag !== 'Requested') {
    return failure(
      ErrorCode.InvalidAppointmentState,
      "Cannot confirm appointment: must be in 'Requested' state."
    );
  }
  
  const now = new Date().toISOString();
  
  return success({
    tag: 'Confirmed',
    info: appointment.info,
    requestedAt: appointment.requestedAt,
    confirmedAt: now,
    confirmationNumber,
  });
}

// 病患報到
export function checkInAppointment(
  appointment: Confirmed
): Result<CheckedIn> {
  // 只有處於 Confirmed 狀態的預約才能報到
  if (appointment.tag !== 'Confirmed') {
    return failure(
      ErrorCode.InvalidAppointmentState,
      "Cannot check in appointment: must be in 'Confirmed' state."
    );
  }
  
  // 檢查是否在預約時間前後 24 小時內報到 (示範用途，放寬時間限制)
  const now = new Date();
  const appointmentTime = new Date(appointment.info.timeSlot.start);
  const timeDiff = Math.abs(now.getTime() - appointmentTime.getTime());
  const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
  
  if (hoursDiff > 24) {
    return failure(
      ErrorCode.ValidationFailed,
      `Check-in time is outside the allowed window (24 hours before or after the appointment time).`
    );
  }
  
  return success({
    tag: 'CheckedIn',
    info: appointment.info,
    requestedAt: appointment.requestedAt,
    confirmedAt: appointment.confirmedAt,
    confirmationNumber: appointment.confirmationNumber,
    checkedInAt: now.toISOString(),
  });
}

// 開始診療
export function startAppointment(
  appointment: CheckedIn
): Result<InProgress> {
  // 只有處於 CheckedIn 狀態的預約才能開始診療
  if (appointment.tag !== 'CheckedIn') {
    return failure(
      ErrorCode.InvalidAppointmentState,
      "Cannot start appointment: must be in 'CheckedIn' state."
    );
  }
  
  const now = new Date().toISOString();
  
  return success({
    tag: 'InProgress',
    info: appointment.info,
    requestedAt: appointment.requestedAt,
    confirmedAt: appointment.confirmedAt,
    confirmationNumber: appointment.confirmationNumber,
    checkedInAt: appointment.checkedInAt,
    startedAt: now,
  });
}

// 完成預約
export function completeAppointment(
  appointment: InProgress,
  followUpNeeded: boolean,
  followUpNotes?: string
): Result<Completed> {
  // 只有處於 InProgress 狀態的預約才能被完成
  if (appointment.tag !== 'InProgress') {
    return failure(
      ErrorCode.InvalidAppointmentState,
      "Cannot complete appointment: must be in 'InProgress' state."
    );
  }
  
  const now = new Date().toISOString();
  
  return success({
    tag: 'Completed',
    info: appointment.info,
    requestedAt: appointment.requestedAt,
    confirmedAt: appointment.confirmedAt,
    confirmationNumber: appointment.confirmationNumber,
    checkedInAt: appointment.checkedInAt,
    startedAt: appointment.startedAt,
    completedAt: now,
    followUpNeeded,
    followUpNotes,
  });
}

// 取消預約
export function cancelAppointment(
  appointment: Requested | Confirmed,
  cancelledBy: 'patient' | 'doctor' | 'system',
  cancellationReason: string
): Result<Cancelled> {
  // 只有處於 Requested 或 Confirmed 狀態的預約才能被取消
  if (appointment.tag !== 'Requested' && appointment.tag !== 'Confirmed') {
    return failure(
      ErrorCode.InvalidAppointmentState,
        "Cannot cancel appointment: must be in 'Requested' or 'Confirmed' state."
    );
  }
  
  const now = new Date().toISOString();
  
  // 根據預約的當前狀態構建取消後的狀態
  const cancelled: Cancelled = {
    tag: 'Cancelled',
    info: appointment.info,
    requestedAt: appointment.requestedAt,
    cancelledAt: now,
    cancelledBy,
    cancellationReason,
  };
  
  // 如果預約已確認，則添加確認相關資訊
  if (appointment.tag === 'Confirmed') {
    cancelled.confirmedAt = appointment.confirmedAt;
    cancelled.confirmationNumber = appointment.confirmationNumber;
  }
  
  return success(cancelled);
}

// 記錄未出席
export function recordNoShow(
  appointment: Confirmed,
  notes?: string
): Result<NoShow> {
  // 只有處於 Confirmed 狀態的預約才能被標記為未出席
  if (appointment.tag !== 'Confirmed') {
    return failure(
      ErrorCode.InvalidAppointmentState,
      "Cannot record no-show: must be in 'Confirmed' state."
    );
  }
  
  // 檢查預約時間是否已過
  const now = new Date();
  const appointmentEndTime = new Date(appointment.info.timeSlot.end);
  
  if (now < appointmentEndTime) {
    return failure(
      ErrorCode.ValidationFailed,
      `Cannot record no-show before the appointment end time.`
    );
  }
  
  return success({
    tag: 'NoShow',
    info: appointment.info,
    requestedAt: appointment.requestedAt,
    confirmedAt: appointment.confirmedAt,
    confirmationNumber: appointment.confirmationNumber,
    recordedAt: now.toISOString(),
    notes,
  });
}

// ===== 類型守衛函數 =====

// 檢查預約是否處於已請求狀態
export function isRequested(appointment: AppointmentState): appointment is Requested {
  return appointment.tag === 'Requested';
}

// 檢查預約是否處於已確認狀態
export function isConfirmed(appointment: AppointmentState): appointment is Confirmed {
  return appointment.tag === 'Confirmed';
}

// 檢查預約是否處於已報到狀態
export function isCheckedIn(appointment: AppointmentState): appointment is CheckedIn {
  return appointment.tag === 'CheckedIn';
}

// 檢查預約是否處於進行中狀態
export function isInProgress(appointment: AppointmentState): appointment is InProgress {
  return appointment.tag === 'InProgress';
}

// 檢查預約是否處於已完成狀態
export function isCompleted(appointment: AppointmentState): appointment is Completed {
  return appointment.tag === 'Completed';
}

// 檢查預約是否處於已取消狀態
export function isCancelled(appointment: AppointmentState): appointment is Cancelled {
  return appointment.tag === 'Cancelled';
}

// 檢查預約是否處於未出席狀態
export function isNoShow(appointment: AppointmentState): appointment is NoShow {
  return appointment.tag === 'NoShow';
}
