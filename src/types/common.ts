/**
 * mini-HIS 通用類型定義
 * 
 * 這個文件包含系統中共用的基礎類型定義
 */

// 唯一識別碼類型
export type ID = string;

// 日期時間類型 (使用 ISO 字符串表示)
export type DateTime = string;

// 性別類型（以常數物件 + 字面量聯合取代 TS enum）
export const Gender = {
  Male: 'male',
  Female: 'female',
  Other: 'other',
} as const;
export type Gender = typeof Gender[keyof typeof Gender];

// 人員基本資訊
export interface Person {
  id: ID;
  name: string;
  birthDate: DateTime;
  gender: Gender;
  contactNumber?: string;
  email?: string;
}

// 地址資訊
export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// 醫療專業人員類型
export const MedicalStaffType = {
  Doctor: 'doctor',
  Nurse: 'nurse',
  Pharmacist: 'pharmacist',
  LabTechnician: 'labTechnician',
  Administrator: 'administrator',
} as const;
export type MedicalStaffType = typeof MedicalStaffType[keyof typeof MedicalStaffType];

// 醫療專業人員
export interface MedicalStaff extends Person {
  staffType: MedicalStaffType;
  department: string;
  specialization?: string;
  licenseNumber: string;
}

// 診斷資訊
export interface Diagnosis {
  id: ID;
  code: string;
  description: string;
  diagnosedAt: DateTime;
  diagnosedBy: ID; // 醫生的 ID
}

// 藥物資訊
export interface Medication {
  id: ID;
  name: string;
  code: string;
  description?: string;
  dosageForm: string; // 例如：錠劑、注射劑等
  strength: string;   // 例如：10mg, 500ml 等
}

// 時間段
export interface TimeSlot {
  start: DateTime;
  end: DateTime;
}

// 醫師（設定用，僅包含 id 與姓名）
export interface Doctor {
  id: ID;
  name: string;
}
