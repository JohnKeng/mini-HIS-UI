# 教學 04: 預約模組 - ADT 狀態管理的再實踐

繼 `Patient` 模組之後，`Appointment.ts` 模組是另一個絕佳的例子，展示了如何利用代數資料類型（ADT）來管理複雜的生命週期。預約系統比病患管理涉及更多、更細緻的狀態，這使得 ADT 的優勢更加凸顯。

## 預約的生命週期

一個預約從被請求到最終完成或取消，會經歷多個階段。傳統方法可能會用一個 `status` 欄位（如 `'requested'`, `'confirmed'`, `'cancelled'`）來追蹤，但這同樣會引發我們在病患模組中討論過的問題：

-   **狀態與資料不一致**：一個 `'cancelled'` 狀態的預約，理論上不應該有 `checkedInAt`（報到時間）的資料，但傳統的物件模型無法在類型層級上保證這一點。
-   **邏輯分散**：狀態轉換的邏輯（例如，只有 `Confirmed` 狀態的預約才能 `CheckIn`）會散佈在各個業務邏輯的 `if` 判斷中，難以維護。

`Appointment.ts` 透過為每個狀態定義精確的介面來解決這個問題。

### 精確的狀態定義

模組中定義了七種可能的預約狀態，每種狀態都只包含該階段**必須擁有**的資訊：

1.  **`Requested`**: 預約已提交，等待確認。
2.  **`Confirmed`**: 預約已獲批准，擁有 `confirmationNumber`。
3.  **`CheckedIn`**: 病患已到達並報到。
4.  **`InProgress`**: 診療正在進行中。
5.  **`Completed`**: 診療完成，包含 `followUpNeeded` 等後續資訊。
6.  **`Cancelled`**: 預約被取消，包含取消原因 `cancellationReason` 和執行者 `cancelledBy`。
7.  **`NoShow`**: 病患未在預約時間出現。

### `AppointmentState` 聯合類型

所有這些狀態介面被組合成一個強大的聯合類型：

```typescript
export type AppointmentState = 
  | Requested
  | Confirmed
  | CheckedIn
  | InProgress
  | Completed
  | Cancelled
  | NoShow;
```

這個 ADT 確保了任何一個 `AppointmentState` 型別的變數，都精確地對應其生命週期中的一個有效快照，不多也不少。無效的資料組合在類型層面上就被徹底消除了。

## 類型安全的狀態轉換函式

與病患模組一樣，狀態之間的轉換是透過嚴格定義的函式來實現的。這些函式的簽章本身就是最清晰的業務規則文檔。

### `confirmAppointment`

```typescript
export function confirmAppointment(
  appointment: Requested, // <-- 輸入必須是 'Requested'
  confirmationNumber: string
): Result<Confirmed> {      // <-- 輸出必然是 'Confirmed'
  // ...
}
```

-   **前提**：只有處於 `Requested` 狀態的預約才能被確認。
-   **結果**：確認成功後，狀態轉變為 `Confirmed`。

你無法將一個已經是 `Confirmed` 或 `Cancelled` 的預約傳遞給這個函式，TypeScript 會立即報錯。這就是「讓錯誤的程式碼看起來就是錯誤的」。

### `checkInAppointment`

```typescript
export function checkInAppointment(
  appointment: Confirmed // <-- 輸入必須是 'Confirmed'
): Result<CheckedIn> {    // <-- 輸出必然是 'CheckedIn'
  // ...
}
```

此函式不僅強制了輸入的狀態類型，其內部邏輯還包含了業務規則的驗證：

```typescript
// 檢查是否在預約時間前後 30 分鐘內報到
const now = new Date();
const appointmentTime = new Date(appointment.info.timeSlot.start);
// ... 計算時間差
if (minutesDiff > 30) {
  return failure(...);
}
```

這展示了我們的模式：

1.  **用類型簽章定義狀態流轉的大規則**。
2.  **在函式內部實現具體的業務邏輯驗證**。
3.  **使用 `Result` 類型來處理成功或失敗的結果**。

## 模式匹配的威力

當你需要處理一個 `AppointmentState` 型別的物件時，`switch` 陳述式再次成為你的得力助手。例如，一個顯示預約狀態的 UI 元件可以這樣寫：

```typescript
function displayAppointmentStatus(appointment: AppointmentState): void {
  switch (appointment.tag) {
    case 'Requested':
      console.log('Status: Awaiting Confirmation');
      break;
    case 'Confirmed':
      console.log(`Status: Confirmed. Number: ${appointment.confirmationNumber}`);
      break;
    case 'Cancelled':
      console.log(`Status: Cancelled by ${appointment.cancelledBy} due to: ${appointment.cancellationReason}`);
      break;
    // ... 處理所有其他 case
  }
}
```

TypeScript 的類型收窄功能確保在每個 `case` 區塊內，你都可以安全地存取該狀態特有的屬性（例如 `confirmationNumber` 或 `cancellationReason`），而無需進行任何手動的類型斷言或 `null` 檢查。

## 總結

`Appointment.ts` 模組強化了我們在 `Patient.ts` 中學到的概念。透過為每個狀態建立一個量身訂製的「形狀」，我們將複雜的業務流程轉化為一系列清晰、可預測且類型安全的狀態轉換。這種方法不僅減少了執行時錯誤，還大大提高了程式碼的可讀性和可維護性。

在下一個教學中，我們將深入 `Prescription.ts`，探討如何為藥物處方這種涉及更多關聯資料的場景建模。