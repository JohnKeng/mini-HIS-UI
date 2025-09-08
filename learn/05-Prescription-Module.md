# 教學 05: 處方模組 - 處理複雜資料與狀態的結合

`Prescription.ts` 模組將我們的代數資料類型（ADT）應用提升到一個新的層次。處方不僅有自己的生命週期（開立、調劑、發放），還包含一組複雜的關聯資料——處方項目（`PrescriptionItem`）。這個模組完美展示了如何用類型來確保核心業務資料的完整性與狀態的同步。

## 處方資料的核心結構

在深入狀態之前，我們先看處方的基本構成：

```typescript
// 處方項目
export interface PrescriptionItem {
  medicationId: ID;
  medication: Medication;
  dosage: string;       // 劑量
  frequency: string;    // 頻率
  route: string;        // 途徑 (口服、注射)
  duration: string;     // 療程
  instructions?: string; // 特別指示
}

// 處方基本資訊
export interface PrescriptionInfo {
  id: ID;
  patientId: ID;
  doctorId: ID;
  items: PrescriptionItem[]; // <-- 處方可以包含多個藥物項目
  notes?: string;
}
```

`PrescriptionInfo` 是處方的核心資料載體，它與處方的**狀態**是分離的。這種設計非常重要，因為無論處方處於哪個生命週期階段（`Created`, `Dispensed`, `Cancelled`），其核心的藥物內容 `items` 是不變的。狀態的改變只是為這個核心資料附加了額外的、與該階段相關的資訊。

## 處方的生命週期與 ADT

`Prescription.ts` 定義了七種狀態，涵蓋了從醫生開立到藥師調劑再到病患領取的完整流程：

1.  **`Created`**: 醫生已開立，但尚未提交至藥局。
2.  **`Submitted`**: 已發送至藥局，等待處理。
3.  **`InPreparation`**: 藥師已開始調劑。
4.  **`Prepared`**: 調劑完成，等待領取。
5.  **`Dispensed`**: 病患已領取藥物。
6.  **`Cancelled`**: 處方被取消。
7.  **`Rejected`**: 處方因故（如藥物交互作用）被藥師拒絕。

這些狀態被聯合起來，構成了 `PrescriptionState` ADT：

```typescript
export type PrescriptionState = 
  | Created
  | Submitted
  | InPreparation
  | Prepared
  | Dispensed
  | Cancelled
  | Rejected;
```

## 狀態轉換的嚴謹性

狀態轉換函式再次體現了類型驅動開發的精髓。它們不僅定義了狀態流轉的路徑，還嵌入了關鍵的業務驗證邏輯。

### `createPrescription`

```typescript
export function createPrescription(
  patientId: ID,
  doctorId: ID,
  items: PrescriptionItem[], // <-- 核心資料
  notes?: string
): Result<Created> {         // <-- 初始狀態
  if (items.length === 0) {
    return failure(
      ErrorCode.ValidationFailed,
      'Prescription must contain at least one medication item.'
    );
  }
  // ...
}
```

-   **資料驗證**：函式首先檢查了最基本的業務規則——一張處方至少要有一個藥物項目。如果沒有，它會返回一個 `Failure` 結果，從源頭上阻止了無效資料的產生。
-   **初始狀態**：成功建立的處方，其初始狀態必然是 `Created`。

### `submitPrescription`

```typescript
export function submitPrescription(
  prescription: Created // <-- 必須從 'Created' 開始
): Result<Submitted> {    // <-- 必然轉換為 'Submitted'
  // ...
}
```

這個函式的簽章本身就說明了一切：只有 `Created` 狀態的處方才能被提交。你不可能意外地提交一張已經被取消或已經發放的處方。

### `startPreparation`

```typescript
export function startPreparation(
  prescription: Submitted, // <-- 必須是 'Submitted'
  pharmacistId: ID
): Result<InPreparation> { // <-- 轉換為 'InPreparation'
  // ...
}
```

這裡我們看到，狀態轉換不僅改變了 `tag`，還引入了新的上下文資訊——`pharmacistId`。`InPreparation` 狀態精確地記錄了是**哪位**藥師在**什麼時候**開始調劑的，資料的完整性和準確性在類型層面得到了保障。

## 總結

`Prescription.ts` 模組是我們目前為止最複雜的例子，但它所遵循的原則與之前的模組完全一致：

1.  **分離核心資料與狀態**：將不變的業務資料（`PrescriptionInfo`）與描述其生命週期的狀態（`PrescriptionState`）分開建模。
2.  **為每個狀態量身訂製資料結構**：每個狀態介面只包含該階段必要且充分的資訊。
3.  **使用類型簽章定義狀態流轉規則**：函式的輸入和輸出類型清晰地定義了業務流程。
4.  **在函式內部執行細粒度的業務驗證**。

這種方法使得處理複雜業務流程的程式碼變得異常清晰、健壯和易於維護。它強迫開發者在編寫程式碼時就思考清楚所有的邊界情況和狀態轉換，而不是等到執行時才發現邏輯漏洞。

接下來，我們將探討 `MedicalService.ts`，看看如何為一個相對簡單、沒有複雜生命週期的實體進行建模。