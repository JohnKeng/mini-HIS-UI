# 教學 06: 醫療服務模組 - ADT 應用於多元業務流程

`MedicalService.ts` 模組是 ADT 應用的又一個典範。與預約或處方不同，醫療服務（如檢查、治療、手術）的生命週期更長，涉及的環節和角色也更多。這個模組展示了如何用 ADT 來精確描述和控制一個複雜、多步驟的業務流程。

## 服務的本質：ServiceInfo

如同之前的模組，我們首先定義了服務的核心資料 `ServiceInfo`：

```typescript
export interface ServiceInfo {
  id: ID;
  patientId: ID;
  serviceType: ServiceType; // 服務類型，如諮詢、檢查、手術
  description: string;
  priority: Priority;       // 優先級
  estimatedDuration: number; // 預計時長
  requiredResources?: string[];
  notes?: string;
}
```

`ServiceInfo` 捕捉了一項醫療服務不變的核心屬性。無論這個服務是剛被請求，還是已經完成，它「是什麼」的本質是不變的。變的是它的**狀態**以及伴隨狀態而生的**上下文資訊**。

## 服務的生命週期 ADT

`MedicalService.ts` 定義了七種狀態，完整地描繪了一項醫療服務從發起到結束的全過程：

1.  **`Requested`**: 服務已被請求，等待排程。
2.  **`Scheduled`**: 已排程，確定了時間、地點和人員。
3.  **`InPreparation`**: 服務前準備，例如準備手術室或儀器。
4.  **`InProgress`**: 服務正在進行中。
5.  **`Completed`**: 服務已完成，並記錄了結果。
6.  **`Cancelled`**: 服務被取消。
7.  **`Postponed`**: 服務被延期。

這些狀態共同構成了 `ServiceState` ADT，為複雜的流程提供了清晰的結構。

```typescript
export type ServiceState = 
  | Requested
  | Scheduled
  | InPreparation
  | InProgress
  | Completed
  | Cancelled
  | Postponed;
```

## 從狀態演進看資料的逐步豐富

`MedicalService` 的狀態轉換函式完美地詮釋了「資料隨著流程逐步豐富」的概念。每一步轉換不僅是狀態 `tag` 的改變，更是相關業務資料的精確記錄。

### `requestService` -> `Requested`

```typescript
export function requestService(
  // ... service details
): Result<Requested> {
  // ...
}
```

-   **入口**：這是服務生命週期的起點，產生一個 `Requested` 狀態的服務實例。
-   **核心資料**：此階段捕獲了服務的**所有**核心資訊（`ServiceInfo`），以及**誰**在**何時**請求了它。

### `scheduleService` -> `Scheduled`

```typescript
export function scheduleService(
  service: Requested, // <-- 輸入
  scheduledTime: DateTime,
  scheduledBy: ID,
  assignedStaff?: MedicalStaff[],
  location?: string
): Result<Scheduled> { // <-- 輸出
  // ...
}
```

-   **流程約束**：函式簽章明確規定，只有 `Requested` 狀態的服務才能被排程。
-   **資料豐富化**：從 `Requested` 到 `Scheduled`，我們添加了至關重要的排程資訊：`scheduledTime`、`scheduledBy`、`assignedStaff` 和 `location`。這些資訊在 `Requested` 階段是不存在的，也不應該存在。

### `startProgress` -> `InProgress`

```typescript
export function startProgress(
  service: InPreparation, // <-- 輸入
  actualStaff: MedicalStaff[]
): Result<InProgress> { // <-- 輸出
  // ...
}
```

-   **前置條件**：服務必須處於 `InPreparation`（準備中）狀態才能開始。
-   **現實記錄**：進入 `InProgress` 狀態時，我們不僅記錄了開始時間 `startedAt`，還記錄了 `actualStaff`（實際執行服務的人員）。這與 `assignedStaff`（預計指派的人員）可能是不同的，這裡體現了系統對現實世界複雜性的精確建模。

### `completeService` -> `Completed`

```typescript
export function completeService(
  service: InProgress, // <-- 輸入
  outcome: string,     // <-- 結果
  actualDuration: number // <-- 實際耗時
): Result<Completed> { // <-- 輸出
  // ...
}
```

-   **終點**：服務流程的主要成功路徑在此結束。
-   **結果記錄**：在 `Completed` 狀態中，我們添加了服務的產出性資訊：`outcome`（結果）、`followUpRecommendations`（後續建議）和 `actualDuration`（實際時長）。這些都是在服務完成後才能確定的。

## 總結

`MedicalService.ts` 模組向我們展示了，無論業務流程多麼複雜，只要遵循 ADT 的核心思想，我們就能建構出清晰、可預測且極度穩固的程式碼。

1.  **識別核心資料**：找出在整個生命週期中不變的核心實體屬性 (`ServiceInfo`)。
2.  **窮舉所有狀態**：清晰地定義出業務流程中的每一個穩定狀態。
3.  **為每個狀態附加精確的上下文資料**：不要把所有可能的欄位都放在一個巨大的介面中。每個狀態都應該是一個最小但完備的資料集合。
4.  **用函式簽章固化流程路徑**：`function(StateA): Result<StateB>` 的模式是最強大的流程保證。

透過這種方式，我們將業務規則直接翻譯成了 TypeScript 的類型定義，讓編譯器成為我們防止邏輯錯誤的第一道，也是最強大的一道防線。

在下一個教學中，我們將把所有這些獨立的模組放在一起，看看它們如何協同工作，構成一個完整的業務場景。