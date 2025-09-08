/**
 * 醫療服務模組
 * 
 * 這個模組展示如何使用代數資料類型 (ADT) 來表示醫療服務的不同狀態，
 * 以及如何通過類型來引導服務流程的邏輯實現。
 */

import type { ID, DateTime, MedicalStaff } from '../types/common.ts';
import type { Result } from '../types/results.ts';
import { success, failure, ErrorCode } from '../types/results.ts';

// 醫療服務類型（以常數物件 + 字面量聯合取代 TS enum）
export const ServiceType = {
  Consultation: 'Consultation',      // 諮詢
  Examination: 'Examination',        // 檢查
  Treatment: 'Treatment',            // 治療
  Surgery: 'Surgery',                // 手術
  Rehabilitation: 'Rehabilitation',  // 復健
  Vaccination: 'Vaccination',        // 疫苗接種
  LabTest: 'LabTest',                // 實驗室檢測
  Imaging: 'Imaging',                // 影像檢查
} as const;
export type ServiceType = typeof ServiceType[keyof typeof ServiceType];

// 服務優先級
export const Priority = {
  Low: 'Low',
  Normal: 'Normal',
  High: 'High',
  Urgent: 'Urgent',
  Emergency: 'Emergency',
} as const;
export type Priority = typeof Priority[keyof typeof Priority];

// 醫療服務基本資訊
export interface ServiceInfo {
  id: ID;
  patientId: ID;
  serviceType: ServiceType;
  description: string;
  priority: Priority;
  estimatedDuration: number; // 以分鐘為單位
  requiredResources?: string[];
  notes?: string;
}

// ===== 醫療服務狀態的代數資料類型 (ADT) =====

// 1. 已請求狀態 - 服務已被請求但尚未排程
export interface Requested {
  tag: 'Requested';
  info: ServiceInfo;
  requestedAt: DateTime;
  requestedBy: ID;
}

// 2. 已排程狀態 - 服務已被排程
export interface Scheduled {
  tag: 'Scheduled';
  info: ServiceInfo;
  requestedAt: DateTime;
  requestedBy: ID;
  scheduledAt: DateTime;
  scheduledBy: ID;
  scheduledTime: DateTime;
  assignedStaff?: MedicalStaff[];
  location?: string;
}

// 3. 準備中狀態 - 服務準備中
export interface InPreparation {
  tag: 'InPreparation';
  info: ServiceInfo;
  requestedAt: DateTime;
  requestedBy: ID;
  scheduledAt: DateTime;
  scheduledBy: ID;
  scheduledTime: DateTime;
  preparationStartedAt: DateTime;
  assignedStaff: MedicalStaff[];
  location: string;
  preparationNotes?: string;
}

// 4. 進行中狀態 - 服務正在進行
export interface InProgress {
  tag: 'InProgress';
  info: ServiceInfo;
  requestedAt: DateTime;
  requestedBy: ID;
  scheduledAt: DateTime;
  scheduledBy: ID;
  scheduledTime: DateTime;
  preparationStartedAt: DateTime;
  startedAt: DateTime;
  assignedStaff: MedicalStaff[];
  location: string;
  actualStaff: MedicalStaff[];
  progressNotes?: string[];
}

// 5. 已完成狀態 - 服務已完成
export interface Completed {
  tag: 'Completed';
  info: ServiceInfo;
  requestedAt: DateTime;
  requestedBy: ID;
  scheduledAt: DateTime;
  scheduledBy: ID;
  scheduledTime: DateTime;
  preparationStartedAt: DateTime;
  startedAt: DateTime;
  completedAt: DateTime;
  assignedStaff: MedicalStaff[];
  location: string;
  actualStaff: MedicalStaff[];
  outcome: string;
  followUpRecommendations?: string;
  actualDuration: number; // 以分鐘為單位
}

// 6. 已取消狀態 - 服務已被取消
export interface Cancelled {
  tag: 'Cancelled';
  info: ServiceInfo;
  requestedAt: DateTime;
  requestedBy: ID;
  scheduledAt?: DateTime;
  scheduledBy?: ID;
  scheduledTime?: DateTime;
  preparationStartedAt?: DateTime;
  cancelledAt: DateTime;
  cancelledBy: ID;
  cancellationReason: string;
  rescheduled: boolean;
}

// 7. 已延期狀態 - 服務已被延期
export interface Postponed {
  tag: 'Postponed';
  info: ServiceInfo;
  requestedAt: DateTime;
  requestedBy: ID;
  scheduledAt: DateTime;
  scheduledBy: ID;
  originalScheduledTime: DateTime;
  postponedAt: DateTime;
  postponedBy: ID;
  postponementReason: string;
  newScheduledTime?: DateTime;
}

// 醫療服務狀態聯合類型 - 這是一個代數資料類型 (ADT)
export type ServiceState = 
  | Requested
  | Scheduled
  | InPreparation
  | InProgress
  | Completed
  | Cancelled
  | Postponed;

// ===== 醫療服務狀態轉換函數 =====

// 請求新的醫療服務
export function requestService(
  patientId: ID,
  serviceType: ServiceType,
  description: string,
  priority: Priority,
  estimatedDuration: number,
  requestedBy: ID,
  requiredResources?: string[],
  notes?: string
): Result<Requested> {
  // 在實際應用中，這裡可能會有驗證邏輯
  if (estimatedDuration <= 0) {
    return failure(
      ErrorCode.ValidationFailed,
      'Estimated duration must be greater than 0 minutes.'
    );
  }
  
  const now = new Date().toISOString();
  const serviceId = `svc-${Date.now()}`; // 簡單的 ID 生成方式
  
  return success({
    tag: 'Requested',
    info: {
      id: serviceId,
      patientId,
      serviceType,
      description,
      priority,
      estimatedDuration,
      requiredResources,
      notes
    },
    requestedAt: now,
    requestedBy
  });
}

// 排程醫療服務
export function scheduleService(
  service: Requested,
  scheduledTime: DateTime,
  scheduledBy: ID,
  assignedStaff?: MedicalStaff[],
  location?: string
): Result<Scheduled> {
  // 只有處於 Requested 狀態的服務才能被排程
  if (service.tag !== 'Requested') {
    return failure(
      ErrorCode.InvalidServiceState,
      "Cannot schedule service: must be in 'Requested' state."
    );
  }
  
  // 檢查排程時間是否在未來
  const now = new Date();
  const scheduledDate = new Date(scheduledTime);
  if (scheduledDate <= now) {
    return failure(
      ErrorCode.ValidationFailed,
      'Scheduled time must be in the future.'
    );
  }
  
  const nowIso = now.toISOString();
  
  return success({
    tag: 'Scheduled',
    info: service.info,
    requestedAt: service.requestedAt,
    requestedBy: service.requestedBy,
    scheduledAt: nowIso,
    scheduledBy,
    scheduledTime,
    assignedStaff,
    location
  });
}

// 開始準備醫療服務
export function startPreparation(
  service: Scheduled,
  assignedStaff: MedicalStaff[],
  location: string,
  preparationNotes?: string
): Result<InPreparation> {
  // 只有處於 Scheduled 狀態的服務才能開始準備
  if (service.tag !== 'Scheduled') {
    return failure(
      ErrorCode.InvalidServiceState,
      "Cannot start preparation: service must be in 'Scheduled' state."
    );
  }
  
  // 檢查是否有指派的醫療人員
  if (assignedStaff.length === 0) {
    return failure(
      ErrorCode.ValidationFailed,
      'At least one staff member must be assigned to the service.'
    );
  }
  
  const now = new Date().toISOString();
  
  return success({
    tag: 'InPreparation',
    info: service.info,
    requestedAt: service.requestedAt,
    requestedBy: service.requestedBy,
    scheduledAt: service.scheduledAt,
    scheduledBy: service.scheduledBy,
    scheduledTime: service.scheduledTime,
    preparationStartedAt: now,
    assignedStaff,
    location,
    preparationNotes
  });
}

// 開始進行醫療服務
export function startService(
  service: InPreparation,
  actualStaff: MedicalStaff[],
  progressNotes?: string[]
): Result<InProgress> {
  // 只有處於 InPreparation 狀態的服務才能開始進行
  if (service.tag !== 'InPreparation') {
    return failure(
      ErrorCode.InvalidServiceState,
      "Cannot start service: must be in 'InPreparation' state."
    );
  }
  
  // 檢查是否有實際執行的醫療人員
  if (actualStaff.length === 0) {
    return failure(
      ErrorCode.ValidationFailed,
      'At least one staff member must be present to perform the service.'
    );
  }
  
  const now = new Date().toISOString();
  
  return success({
    tag: 'InProgress',
    info: service.info,
    requestedAt: service.requestedAt,
    requestedBy: service.requestedBy,
    scheduledAt: service.scheduledAt,
    scheduledBy: service.scheduledBy,
    scheduledTime: service.scheduledTime,
    preparationStartedAt: service.preparationStartedAt,
    startedAt: now,
    assignedStaff: service.assignedStaff,
    location: service.location,
    actualStaff,
    progressNotes
  });
}

// 完成醫療服務
export function completeService(
  service: InProgress,
  outcome: string,
  actualDuration: number,
  followUpRecommendations?: string
): Result<Completed> {
  // 只有處於 InProgress 狀態的服務才能被完成
  if (service.tag !== 'InProgress') {
    return failure(
      ErrorCode.InvalidServiceState,
      "Cannot complete service: must be in 'InProgress' state."
    );
  }
  
  // 檢查實際持續時間是否有效
  if (actualDuration <= 0) {
    return failure(
      ErrorCode.ValidationFailed,
      'Actual duration must be greater than 0 minutes.'
    );
  }
  
  const now = new Date().toISOString();
  
  return success({
    tag: 'Completed',
    info: service.info,
    requestedAt: service.requestedAt,
    requestedBy: service.requestedBy,
    scheduledAt: service.scheduledAt,
    scheduledBy: service.scheduledBy,
    scheduledTime: service.scheduledTime,
    preparationStartedAt: service.preparationStartedAt,
    startedAt: service.startedAt,
    completedAt: now,
    assignedStaff: service.assignedStaff,
    location: service.location,
    actualStaff: service.actualStaff,
    outcome,
    followUpRecommendations,
    actualDuration
  });
}

// 取消醫療服務
export function cancelService(
  service: Requested | Scheduled | InPreparation,
  cancelledBy: ID,
  cancellationReason: string,
  rescheduled: boolean = false
): Result<Cancelled> {
  // 只有處於 Requested、Scheduled 或 InPreparation 狀態的服務才能被取消
  if (
    service.tag !== 'Requested' && 
    service.tag !== 'Scheduled' && 
    service.tag !== 'InPreparation'
  ) {
    return failure(
      ErrorCode.InvalidServiceState,
        "Cannot cancel service. Service must be in 'Requested', 'Scheduled', or 'InPreparation' state."
    );
  }
  
  const now = new Date().toISOString();
  
  // 根據服務的當前狀態構建取消後的狀態
  const cancelled: Cancelled = {
    tag: 'Cancelled',
    info: service.info,
    requestedAt: service.requestedAt,
    requestedBy: service.requestedBy,
    cancelledAt: now,
    cancelledBy,
    cancellationReason,
    rescheduled
  };
  
  // 如果服務已排程，則添加排程相關資訊
  if (service.tag === 'Scheduled' || service.tag === 'InPreparation') {
    cancelled.scheduledAt = service.scheduledAt;
    cancelled.scheduledBy = service.scheduledBy;
    cancelled.scheduledTime = service.scheduledTime;
  }
  
  // 如果服務已開始準備，則添加準備開始相關資訊
  if (service.tag === 'InPreparation') {
    cancelled.preparationStartedAt = service.preparationStartedAt;
  }
  
  return success(cancelled);
}

// 延期醫療服務
export function postponeService(
  service: Scheduled,
  postponedBy: ID,
  postponementReason: string,
  newScheduledTime?: DateTime
): Result<Postponed> {
  // 只有處於 Scheduled 狀態的服務才能被延期
  if (service.tag !== 'Scheduled') {
    return failure(
      ErrorCode.InvalidServiceState,
      "Cannot postpone service: must be in 'Scheduled' state."
    );
  }
  
  // 如果提供了新的排程時間，檢查它是否在未來
  if (newScheduledTime) {
    const now = new Date();
    const newScheduledDate = new Date(newScheduledTime);
    if (newScheduledDate <= now) {
      return failure(
        ErrorCode.ValidationFailed,
        'New scheduled time must be in the future.'
      );
    }
  }
  
  const now = new Date().toISOString();
  
  return success({
    tag: 'Postponed',
    info: service.info,
    requestedAt: service.requestedAt,
    requestedBy: service.requestedBy,
    scheduledAt: service.scheduledAt,
    scheduledBy: service.scheduledBy,
    originalScheduledTime: service.scheduledTime,
    postponedAt: now,
    postponedBy,
    postponementReason,
    newScheduledTime
  });
}

// ===== 類型守衛函數 =====

// 檢查服務是否處於已請求狀態
export function isRequested(service: ServiceState): service is Requested {
  return service.tag === 'Requested';
}

// 檢查服務是否處於已排程狀態
export function isScheduled(service: ServiceState): service is Scheduled {
  return service.tag === 'Scheduled';
}

// 檢查服務是否處於準備中狀態
export function isInPreparation(service: ServiceState): service is InPreparation {
  return service.tag === 'InPreparation';
}

// 檢查服務是否處於進行中狀態
export function isInProgress(service: ServiceState): service is InProgress {
  return service.tag === 'InProgress';
}

// 檢查服務是否處於已完成狀態
export function isCompleted(service: ServiceState): service is Completed {
  return service.tag === 'Completed';
}

// 檢查服務是否處於已取消狀態
export function isCancelled(service: ServiceState): service is Cancelled {
  return service.tag === 'Cancelled';
}

// 檢查服務是否處於已延期狀態
export function isPostponed(service: ServiceState): service is Postponed {
  return service.tag === 'Postponed';
}
