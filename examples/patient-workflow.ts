/**
 * 病患工作流示例
 * 
 * 這個示例展示了如何使用代數資料類型 (ADT) 來處理病患從掛號到出院的完整流程。
 * 通過這個例子，我們可以看到「先寫類型再寫邏輯」的開發方法如何幫助我們確保系統的狀態轉換是類型安全的。
 */

import {
  registerPatient,
  admitPatient,
  dischargePatient,
  isAdmitted,
  isRegistered,
} from '../src/models/Patient.ts';
import type { PatientState } from '../src/models/Patient.ts';
import { Gender } from '../src/types/common.ts';

import { isSuccess } from '../src/types/results.ts';

/**
 * 這個函數展示了如何使用類型來引導程式邏輯的實現。
 * 注意觀察如何通過類型守衛函數來確保在正確的狀態下執行正確的操作。
 */
function processPatient(patient: PatientState): void {
  // 使用類型守衛函數來檢查病患的狀態
  if (isRegistered(patient)) {
    console.log(`病患 ${patient.info.name} 已掛號，但尚未入院。`);
    console.log('可以執行的操作: 入院、安排預約、取消掛號');
    
    // 示範入院操作
    const admitResult = admitPatient(
      patient,
      'ward-101',
      'bed-05',
      'doc-001'
    );
    
    if (isSuccess(admitResult)) {
      console.log(`病患 ${admitResult.data.info.name} 已成功入院。`);
      // 遞迴調用，處理入院後的病患
      processPatient(admitResult.data);
    } else {
      console.error(`入院失敗: ${admitResult.error.message}`);
    }
  } 
  else if (isAdmitted(patient)) {
    console.log(`病患 ${patient.info.name} 已入院，正在接受治療。`);
    console.log(`病房: ${patient.wardNumber}, 床位: ${patient.bedNumber}`);
    console.log('可以執行的操作: 安排檢查、開立處方、出院');
    
    // 示範出院操作
    const dischargeResult = dischargePatient(
      patient,
      '病情穩定，可以出院',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    );
    
    if (isSuccess(dischargeResult)) {
      console.log(`病患 ${dischargeResult.data.info.name} 已成功出院。`);
      // 遞迴調用，處理出院後的病患
      processPatient(dischargeResult.data);
    } else {
      console.error(`出院失敗: ${dischargeResult.error.message}`);
    }
  } 
  else {
    // 處理其他可能的狀態
    console.log(`病患 ${patient.info.name} 當前狀態: ${patient.tag}`);
    console.log('根據不同狀態可執行不同的操作');
  }
}

// 主函數
function main() {
  console.log('===== 病患工作流示例 =====');
  
  // 創建一個新病患
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
  
  if (isSuccess(patientResult)) {
    // 處理病患
    processPatient(patientResult.data);
  } else {
    console.error(`創建病患失敗: ${patientResult.error.message}`);
  }
  
  console.log('\n===== 示例結束 =====');
}

// 執行示例
main();
