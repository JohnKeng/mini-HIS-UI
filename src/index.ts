/**
 * mini-HIS 主入口文件
 * 
 * 這個文件展示如何使用我們已經實現的各個模組，
 * 並提供一些示例測試。
 */

// 導入所需的模組和類型
import {
  registerPatient,
  admitPatient,
  dischargePatient,
} from './models/Patient.ts';
import type { PatientState } from './models/Patient.ts';

import {
  requestAppointment,
  confirmAppointment,
  checkInAppointment,
  startAppointment,
  completeAppointment,
} from './models/Appointment.ts';
import type { AppointmentState } from './models/Appointment.ts';

import {
  createPrescription,
  submitPrescription,
  startPreparation as startPrescriptionPreparation,
  completePreparing,
  dispensePrescription
} from './models/Prescription.ts';
import type { PrescriptionState } from './models/Prescription.ts';

import {
  ServiceType,
  Priority,
  requestService,
  scheduleService,
  startPreparation as startServicePreparation,
  startService,
  completeService
} from './models/MedicalService.ts';
import type { ServiceState } from './models/MedicalService.ts';

import { isFailure } from './types/results.ts';
import { Gender, MedicalStaffType } from './types/common.ts';

// 模擬醫院系統的主要流程
function runHospitalDemo() {
  console.log('===== mini-HIS 示範 =====');
  console.log('這個示範展示了如何使用代數資料類型 (ADT) 來處理醫院信息系統中的不同狀態。');
  console.log('注意觀察每個步驟如何通過類型來引導程式邏輯的實現。');
  console.log('\n');

  // 步驟 1: 創建一個新病患
  console.log('步驟 1: 創建一個新病患');
  const newPatientId = `pt-${Date.now()}`;
  const patientResult = registerPatient(
    {
      id: newPatientId,
      name: '王小明',
      birthDate: '1990-05-15',
      gender: Gender.Male,
      contactNumber: '0912345678',
      address: {
        street: '健康路 123 號',
        city: '台北市',
        state: '信義區',
        postalCode: '110',
        country: '台灣',
      },
    },
    newPatientId
  );

  // 檢查結果是否成功
  if (isFailure(patientResult)) {
    console.error(`創建病患失敗: ${patientResult.error.message}`);
    return;
  }

  // 獲取病患資訊
  let patient: PatientState = patientResult.data;
  console.log(`病患 ${patient.info.name} 已創建，ID: ${patient.info.id}`);
  console.log(`病患狀態: ${patient.tag}`);
  console.log('\n');

  // 步驟 2: 為病患創建一個預約
  console.log('步驟 2: 為病患創建一個預約');
  // 將預約時間設在 5 分鐘後，方便立即報到（30 分鐘容許窗內）
  const startAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const endAt = new Date(new Date(startAt).getTime() + 30 * 60 * 1000).toISOString(); // 30 分鐘後
  const appointmentResult = requestAppointment(
    patient.info.id,
    'doc-001', // 醫生 ID
    'General', // 科別
    { start: startAt, end: endAt },
    '一般檢查'
  );

  // 檢查結果是否成功
  if (isFailure(appointmentResult)) {
    console.error(`創建預約失敗: ${appointmentResult.error.message}`);
    return;
  }

  // 獲取預約資訊
  let appointment: AppointmentState = appointmentResult.data;
  console.log(`預約已創建，ID: ${appointment.info.id}`);
  console.log(`預約狀態: ${appointment.tag}`);
  console.log('\n');

  // 步驟 3: 確認預約
  console.log('步驟 3: 確認預約');
  const confirmedAppointmentResult = confirmAppointment(appointment, `CONF-${Date.now()}`);

  // 檢查結果是否成功
  if (isFailure(confirmedAppointmentResult)) {
    console.error(`確認預約失敗: ${confirmedAppointmentResult.error.message}`);
    return;
  }

  // 獲取確認後的預約資訊
  appointment = confirmedAppointmentResult.data;
  console.log(`預約已確認，ID: ${appointment.info.id}`);
  console.log(`預約狀態: ${appointment.tag}`);
  console.log('\n');

  // 步驟 4: 病患入院
  console.log('步驟 4: 病患入院');
  const admittedPatientResult = admitPatient(
    patient,
    'ward-101',
    'bed-05',
    'doc-001'
  );

  // 檢查結果是否成功
  if (isFailure(admittedPatientResult)) {
    console.error(`病患入院失敗: ${admittedPatientResult.error.message}`);
    return;
  }

  // 獲取入院後的病患資訊
  patient = admittedPatientResult.data;
  console.log(`病患 ${patient.info.name} 已入院`);
  console.log(`病患狀態: ${patient.tag}`);
  console.log('\n');

  // 步驟 5: 為病患創建一個處方
  console.log('步驟 5: 為病患創建一個處方');
  const prescriptionResult = createPrescription(
    patient.info.id,
    'doc-001',
    [
      {
        medicationId: 'med-001',
        medication: {
          id: 'med-001',
          name: '阿斯匹靈',
          code: 'ASPIRIN',
          dosageForm: '錠劑',
          strength: '100mg'
        },
        dosage: '1 錠',
        frequency: '每日三次',
        route: '口服',
        duration: '7 天',
        instructions: '飯後服用'
      }
    ],
    '緩解疼痛和發炎'
  );

  // 檢查結果是否成功
  if (isFailure(prescriptionResult)) {
    console.error(`創建處方失敗: ${prescriptionResult.error.message}`);
    return;
  }

  // 獲取處方資訊
  let prescription: PrescriptionState = prescriptionResult.data;
  console.log(`處方已創建，ID: ${prescription.info.id}`);
  console.log(`處方狀態: ${prescription.tag}`);
  console.log('\n');

  // 步驟 6: 送出處方至藥局
  console.log('步驟 6: 送出處方至藥局');
  const submittedPrescriptionResult = submitPrescription(prescription);

  // 檢查結果是否成功
  if (isFailure(submittedPrescriptionResult)) {
    console.error(`送出處方失敗: ${submittedPrescriptionResult.error.message}`);
    return;
  }

  // 獲取送出後的處方資訊
  prescription = submittedPrescriptionResult.data;
  console.log(`處方已送出至藥局，ID: ${prescription.info.id}`);
  console.log(`處方狀態: ${prescription.tag}`);
  console.log('\n');

  // 步驟 7: 開始調劑處方
  console.log('步驟 7: 開始調劑處方');
  const preparingPrescriptionResult = startPrescriptionPreparation(
    prescription,
    'pharm-001' // 藥師 ID
  );

  // 檢查結果是否成功
  if (isFailure(preparingPrescriptionResult)) {
    console.error(`開始調劑處方失敗: ${preparingPrescriptionResult.error.message}`);
    return;
  }

  // 獲取調劑中的處方資訊
  prescription = preparingPrescriptionResult.data;
  console.log(`處方開始調劑，ID: ${prescription.info.id}`);
  console.log(`處方狀態: ${prescription.tag}`);
  console.log('\n');

  // 步驟 8: 完成處方調劑
  console.log('步驟 8: 完成處方調劑');
  const preparedPrescriptionResult = completePreparing(
    prescription,
    '已確認藥物劑量和交互作用'
  );

  // 檢查結果是否成功
  if (isFailure(preparedPrescriptionResult)) {
    console.error(`完成處方調劑失敗: ${preparedPrescriptionResult.error.message}`);
    return;
  }

  // 獲取調劑完成的處方資訊
  prescription = preparedPrescriptionResult.data;
  console.log(`處方調劑完成，ID: ${prescription.info.id}`);
  console.log(`處方狀態: ${prescription.tag}`);
  console.log('\n');

  // 步驟 9: 發放處方藥物給病患
  console.log('步驟 9: 發放處方藥物給病患');
  const dispensedPrescriptionResult = dispensePrescription(
    prescription,
    'pharm-001', // 發藥人員 ID
    '請按照指示服用藥物，如有不適請立即聯繫醫生'
  );

  // 檢查結果是否成功
  if (isFailure(dispensedPrescriptionResult)) {
    console.error(`發放處方藥物失敗: ${dispensedPrescriptionResult.error.message}`);
    return;
  }

  // 獲取發藥後的處方資訊
  prescription = dispensedPrescriptionResult.data;
  console.log(`處方藥物已發放給病患，ID: ${prescription.info.id}`);
  console.log(`處方狀態: ${prescription.tag}`);
  console.log('\n');

  // 步驟 10: 請求醫療服務
  console.log('步驟 10: 請求醫療服務');
  const serviceResult = requestService(
    patient.info.id,
    ServiceType.Examination,
    'X光檢查',
    Priority.Normal,
    45, // 45 分鐘
    'doc-001', // 請求者 ID
    ['X光機', '技術人員'],
    '檢查胸部'
  );

  // 檢查結果是否成功
  if (isFailure(serviceResult)) {
    console.error(`請求醫療服務失敗: ${serviceResult.error.message}`);
    return;
  }

  // 獲取醫療服務資訊
  let service: ServiceState = serviceResult.data;
  console.log(`醫療服務已請求，ID: ${service.info.id}`);
  console.log(`服務狀態: ${service.tag}`);
  console.log('\n');

  // 步驟 11: 排程醫療服務
  console.log('步驟 11: 排程醫療服務');
  const scheduledServiceResult = scheduleService(
    service,
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 兩天後
    'staff-001', // 排程人員 ID
    [
      {
        id: 'staff-002',
        name: '張醫師',
        birthDate: '1980-01-01',
        gender: Gender.Male,
        contactNumber: '0900000000',
        staffType: MedicalStaffType.Doctor,
        department: 'Radiology',
        specialization: 'Radiology',
        licenseNumber: 'LIC-DOCTOR-002',
      },
      {
        id: 'staff-003',
        name: '李技師',
        birthDate: '1988-02-02',
        gender: Gender.Female,
        contactNumber: '0900000001',
        staffType: MedicalStaffType.LabTechnician,
        department: 'Radiology',
        specialization: 'Imaging',
        licenseNumber: 'LIC-TECH-003',
      }
    ],
    'Room 305'
  );

  // 檢查結果是否成功
  if (isFailure(scheduledServiceResult)) {
    console.error(`排程醫療服務失敗: ${scheduledServiceResult.error.message}`);
    return;
  }

  // 獲取排程後的醫療服務資訊
  service = scheduledServiceResult.data;
  console.log(`醫療服務已排程，ID: ${service.info.id}`);
  console.log(`服務狀態: ${service.tag}`);
  console.log('\n');

  // 步驟 12: 開始準備醫療服務
  console.log('步驟 12: 開始準備醫療服務');
  const preparingServiceResult = startServicePreparation(
    service,
    [
      {
        id: 'staff-002',
        name: '張醫師',
        birthDate: '1980-01-01',
        gender: Gender.Male,
        contactNumber: '0900000000',
        staffType: MedicalStaffType.Doctor,
        department: 'Radiology',
        specialization: 'Radiology',
        licenseNumber: 'LIC-DOCTOR-002',
      },
      {
        id: 'staff-003',
        name: '李技師',
        birthDate: '1988-02-02',
        gender: Gender.Female,
        contactNumber: '0900000001',
        staffType: MedicalStaffType.LabTechnician,
        department: 'Radiology',
        specialization: 'Imaging',
        licenseNumber: 'LIC-TECH-003',
      }
    ],
    'Room 305',
    '準備 X 光設備'
  );

  // 檢查結果是否成功
  if (isFailure(preparingServiceResult)) {
    console.error(`開始準備醫療服務失敗: ${preparingServiceResult.error.message}`);
    return;
  }

  // 獲取準備中的醫療服務資訊
  service = preparingServiceResult.data;
  console.log(`醫療服務開始準備，ID: ${service.info.id}`);
  console.log(`服務狀態: ${service.tag}`);
  console.log('\n');

  // 步驟 13: 開始進行醫療服務
  console.log('步驟 13: 開始進行醫療服務');
  const inProgressServiceResult = startService(
    service,
    [
      {
        id: 'staff-002',
        name: '張醫師',
        birthDate: '1980-01-01',
        gender: Gender.Male,
        contactNumber: '0900000000',
        staffType: MedicalStaffType.Doctor,
        department: 'Radiology',
        specialization: 'Radiology',
        licenseNumber: 'LIC-DOCTOR-002',
      },
      {
        id: 'staff-003',
        name: '李技師',
        birthDate: '1988-02-02',
        gender: Gender.Female,
        contactNumber: '0900000001',
        staffType: MedicalStaffType.LabTechnician,
        department: 'Radiology',
        specialization: 'Imaging',
        licenseNumber: 'LIC-TECH-003',
      }
    ],
    ['病患已就位', '開始 X 光掃描']
  );

  // 檢查結果是否成功
  if (isFailure(inProgressServiceResult)) {
    console.error(`開始進行醫療服務失敗: ${inProgressServiceResult.error.message}`);
    return;
  }

  // 獲取進行中的醫療服務資訊
  service = inProgressServiceResult.data;
  console.log(`醫療服務開始進行，ID: ${service.info.id}`);
  console.log(`服務狀態: ${service.tag}`);
  console.log('\n');

  // 步驟 14: 完成醫療服務
  console.log('步驟 14: 完成醫療服務');
  const completedServiceResult = completeService(
    service,
    'X 光檢查完成，未發現異常',
    40, // 實際用時 40 分鐘
    '建議一週後複查'
  );

  // 檢查結果是否成功
  if (isFailure(completedServiceResult)) {
    console.error(`完成醫療服務失敗: ${completedServiceResult.error.message}`);
    return;
  }

  // 獲取完成的醫療服務資訊
  service = completedServiceResult.data;
  console.log(`醫療服務已完成，ID: ${service.info.id}`);
  console.log(`服務狀態: ${service.tag}`);
  console.log('\n');

  // 步驟 15: 完成預約
  console.log('步驟 15: 完成預約');
  // 補充預約報到與開始，然後完成預約
  const checkedInAppointmentResult = checkInAppointment(appointment);
  if (isFailure(checkedInAppointmentResult)) {
    console.error(`預約報到失敗: ${checkedInAppointmentResult.error.message}`);
    return;
  }
  const inProgressAppointmentResult = startAppointment(checkedInAppointmentResult.data);
  if (isFailure(inProgressAppointmentResult)) {
    console.error(`開始預約失敗: ${inProgressAppointmentResult.error.message}`);
    return;
  }
  const completedAppointmentResult = completeAppointment(
    inProgressAppointmentResult.data,
    true,
    '病患已完成所有檢查和治療'
  );

  // 檢查結果是否成功
  if (isFailure(completedAppointmentResult)) {
    console.error(`完成預約失敗: ${completedAppointmentResult.error.message}`);
    return;
  }

  // 獲取完成的預約資訊
  appointment = completedAppointmentResult.data;
  console.log(`預約已完成，ID: ${appointment.info.id}`);
  console.log(`預約狀態: ${appointment.tag}`);
  console.log('\n');

  // 步驟 16: 病患出院
  console.log('步驟 16: 病患出院');
  const dischargedPatientResult = dischargePatient(
    patient,
    '病情穩定，可以出院',
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  );

  // 檢查結果是否成功
  if (isFailure(dischargedPatientResult)) {
    console.error(`病患出院失敗: ${dischargedPatientResult.error.message}`);
    return;
  }

  // 獲取出院後的病患資訊
  patient = dischargedPatientResult.data;
  console.log(`病患 ${patient.info.name} 已出院`);
  console.log(`病患狀態: ${patient.tag}`);
  console.log('\n');

  console.log('===== 示範完成 =====');
  console.log('這個示範展示了如何使用代數資料類型 (ADT) 來處理醫院信息系統中的不同狀態。');
  console.log('通過先定義類型，再實現邏輯，我們可以確保系統的狀態轉換是類型安全的。');
  console.log('這種方法可以在編譯時就發現許多潛在的錯誤，而不是在運行時才發現。');
}

// 執行示範
runHospitalDemo();
