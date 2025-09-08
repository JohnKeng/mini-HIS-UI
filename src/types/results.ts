/**
 * mini-HIS 結果類型定義
 * 
 * 這個文件定義了操作結果的類型，用於處理成功和失敗情況
 */

// 錯誤代碼枚舉
export const ErrorCode = {
  // 通用錯誤
  NotFound: 'NOT_FOUND',
  Unauthorized: 'UNAUTHORIZED',
  ValidationFailed: 'VALIDATION_FAILED',
  SystemError: 'SYSTEM_ERROR',
  
  // 病患相關錯誤
  PatientAlreadyExists: 'PATIENT_ALREADY_EXISTS',
  PatientNotFound: 'PATIENT_NOT_FOUND',
  InvalidPatientState: 'INVALID_PATIENT_STATE',
  
  // 預約相關錯誤
  AppointmentNotFound: 'APPOINTMENT_NOT_FOUND',
  AppointmentSlotUnavailable: 'APPOINTMENT_SLOT_UNAVAILABLE',
  InvalidAppointmentState: 'INVALID_APPOINTMENT_STATE',
  
  // 處方相關錯誤
  PrescriptionNotFound: 'PRESCRIPTION_NOT_FOUND',
  InvalidPrescriptionState: 'INVALID_PRESCRIPTION_STATE',
  MedicationNotFound: 'MEDICATION_NOT_FOUND',

  // 醫療服務相關錯誤
  InvalidServiceState: 'INVALID_SERVICE_STATE',
} as const;
export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

// 錯誤詳情
export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// 成功結果
export interface Success<T> {
  success: true;
  data: T;
}

// 失敗結果
export interface Failure {
  success: false;
  error: ErrorDetails;
}

// 操作結果類型 - 這是一個代數資料類型 (ADT)
export type Result<T> = Success<T> | Failure;

// 創建成功結果的輔助函數
export function success<T>(data: T): Success<T> {
  return {
    success: true,
    data,
  };
}

// 創建失敗結果的輔助函數
export function failure(code: ErrorCode, message: string, details?: Record<string, unknown>): Failure {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

// 類型守衛：檢查結果是否成功
export function isSuccess<T>(result: Result<T>): result is Success<T> {
  return result.success === true;
}

// 類型守衛：檢查結果是否失敗
export function isFailure<T>(result: Result<T>): result is Failure {
  return result.success === false;
}
