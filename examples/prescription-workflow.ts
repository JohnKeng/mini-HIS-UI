/**
 * 處方工作流示例
 * 
 * 這個示例展示了如何使用代數資料類型 (ADT) 來處理處方從開立到發放的完整流程。
 * 通過這個例子，我們可以看到 ADT 如何幫助我們避免不合法的狀態轉換，以及如何通過類型來引導程式邏輯的實現。
 */

import {
  createPrescription,
  submitPrescription,
  startPreparation,
  completePreparing,
  dispensePrescription,
  rejectPrescription,
  isCreated,
  isSubmitted,
  isInPreparation,
  isPrepared,
  isDispensed,
  isCancelled,
  isRejected
} from '../src/models/Prescription.ts';
import type { PrescriptionState } from '../src/models/Prescription.ts';

import { isSuccess } from '../src/types/results.ts';

/**
 * 這個函數展示了如何使用類型來引導處方流程的邏輯實現。
 * 注意觀察如何通過類型守衛函數來確保在正確的狀態下執行正確的操作。
 */
function processPrescription(prescription: PrescriptionState): void {
  console.log(`\n處理處方 ID: ${prescription.info.id}，當前狀態: ${prescription.tag}`);
  
  // 使用類型守衛函數來檢查處方的狀態
  if (isCreated(prescription)) {
    console.log('處方已開立，但尚未送至藥局');
    console.log('可以執行的操作: 送出處方、取消處方');
    
    // 示範送出處方操作
    const submitResult = submitPrescription(prescription);
    
    if (isSuccess(submitResult)) {
      console.log('處方已成功送至藥局');
      // 遞迴調用，處理送出後的處方
      processPrescription(submitResult.data);
    } else {
      console.error(`送出處方失敗: ${submitResult.error.message}`);
    }
  } 
  else if (isSubmitted(prescription)) {
    console.log('處方已送至藥局，等待調劑');
    console.log('可以執行的操作: 開始調劑、拒絕處方、取消處方');
    
    // 示範開始調劑操作
    const prepareResult = startPreparation(prescription, 'pharm-001');
    
    if (isSuccess(prepareResult)) {
      console.log('處方開始調劑');
      // 遞迴調用，處理調劑中的處方
      processPrescription(prepareResult.data);
    } else {
      console.error(`開始調劑失敗: ${prepareResult.error.message}`);
      
      // 示範拒絕處方操作
      console.log('\n嘗試拒絕處方...');
      const rejectResult = rejectPrescription(
        prescription,
        'pharm-001',
        '藥物交互作用風險',
        '建議更換為替代藥物'
      );
      
      if (isSuccess(rejectResult)) {
        console.log('處方已被拒絕');
        processPrescription(rejectResult.data);
      } else {
        console.error(`拒絕處方失敗: ${rejectResult.error.message}`);
      }
    }
  } 
  else if (isInPreparation(prescription)) {
    console.log('處方正在調劑中');
    console.log('可以執行的操作: 完成調劑、取消處方');
    
    // 示範完成調劑操作
    const completeResult = completePreparing(prescription, '已確認藥物劑量和交互作用');
    
    if (isSuccess(completeResult)) {
      console.log('處方調劑完成');
      // 遞迴調用，處理調劑完成的處方
      processPrescription(completeResult.data);
    } else {
      console.error(`完成調劑失敗: ${completeResult.error.message}`);
    }
  } 
  else if (isPrepared(prescription)) {
    console.log('處方已調劑完成，等待發放');
    console.log('可以執行的操作: 發放處方');
    
    // 示範發放處方操作
    const dispenseResult = dispensePrescription(
      prescription,
      'pharm-001',
      '請按照指示服用藥物，如有不適請立即聯繫醫生'
    );
    
    if (isSuccess(dispenseResult)) {
      console.log('處方已發放給病患');
      // 遞迴調用，處理發放後的處方
      processPrescription(dispenseResult.data);
    } else {
      console.error(`發放處方失敗: ${dispenseResult.error.message}`);
    }
  } 
  else if (isDispensed(prescription)) {
    console.log('處方已發放給病患，流程結束');
    // 處方已發放，流程結束
  } 
  else if (isCancelled(prescription)) {
    console.log('處方已取消，流程結束');
    // 處方已取消，流程結束
  } 
  else if (isRejected(prescription)) {
    console.log('處方已被拒絕，流程結束');
    console.log(`拒絕原因: ${prescription.rejectionReason}`);
    if (prescription.alternativeSuggestion) {
      console.log(`替代建議: ${prescription.alternativeSuggestion}`);
    }
    // 處方已拒絕，流程結束
  }
}

/**
 * 這個函數展示了嘗試執行不合法的狀態轉換時，系統如何通過類型檢查來防止錯誤。
 */
function demonstrateInvalidTransitions(prescription: PrescriptionState): void {
  console.log('\n===== 示範不合法的狀態轉換 =====');
  
  // 嘗試從已發放狀態取消處方
  if (isDispensed(prescription)) {
    console.log('嘗試取消已發放的處方...');
    
    // TypeScript 會在編譯時報錯，因為 cancelPrescription 只接受 Created | Submitted | InPreparation 類型
    // 以下代碼在編譯時會報錯，這裡只是為了示範
    // const cancelResult = cancelPrescription(
    //   prescription, // 類型錯誤: Dispensed 不能賦值給 Created | Submitted | InPreparation
    //   'doc-001',
    //   '不需要了'
    // );
    
    console.log('無法取消已發放的處方，因為類型系統會在編譯時阻止這種操作');
  }
  
  // 嘗試從已取消狀態開始調劑處方
  if (isCancelled(prescription)) {
    console.log('嘗試調劑已取消的處方...');
    
    // TypeScript 會在編譯時報錯，因為 startPreparation 只接受 Submitted 類型
    // 以下代碼在編譯時會報錯，這裡只是為了示範
    // const prepareResult = startPreparation(
    //   prescription, // 類型錯誤: Cancelled 不能賦值給 Submitted
    //   'pharm-001'
    // );
    
    console.log('無法調劑已取消的處方，因為類型系統會在編譯時阻止這種操作');
  }
  
  console.log('通過使用代數資料類型 (ADT)，我們可以在編譯時就防止不合法的狀態轉換');
  console.log('這比在運行時才發現錯誤要好得多，因為它可以提前發現並修復潛在的問題');
}

// 主函數
function main() {
  console.log('===== 處方工作流示例 =====');
  
  // 創建一個新處方
  const prescriptionResult = createPrescription(
    'pat-001', // 病患 ID
    'doc-001', // 醫生 ID
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
  
  if (isSuccess(prescriptionResult)) {
    // 處理處方的正常流程
    processPrescription(prescriptionResult.data);
    
    // 示範不合法的狀態轉換
    // 注意：這裡我們傳入的是已發放的處方，實際上這個函數內部的代碼在編譯時就會報錯
    // 這裡只是為了示範 ADT 如何在編譯時防止不合法的狀態轉換
    demonstrateInvalidTransitions(prescriptionResult.data);
  } else {
    console.error(`創建處方失敗: ${prescriptionResult.error.message}`);
  }
  
  console.log('\n===== 示例結束 =====');
}

// 執行示例
main();
