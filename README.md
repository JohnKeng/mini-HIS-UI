# mini-HIS: 醫院資訊系統示範專案

這是一個使用 TypeScript 開發的醫院資訊系統 (Hospital Information System) 示範專案，旨在展示「先寫類型再寫邏輯」的開發方法，以及如何使用代數資料類型 (Algebraic Data Types, ADT) 來規範和簡化程式碼邏輯。

## 開發理念

### 先寫類型再寫邏輯

在傳統開發中，我們常常先考慮程式的行為和邏輯，然後才定義資料結構。這種方式容易導致類型不一致、邊界情況處理不當等問題。在本專案中，我們將採用相反的方式：

1. **先定義完整的類型系統**：包括實體類型、狀態類型、操作結果類型等。
2. **利用類型來引導邏輯實現**：讓編譯器幫助我們檢查是否處理了所有可能的情況。
3. **使用類型來表達業務規則**：將業務規則編碼到類型系統中，而不是散落在各處的條件判斷。

這種方法有以下優點：

- **提早發現錯誤**：在編譯時就能發現許多潛在的錯誤。
- **自文檔化**：類型定義本身就是一種文檔，清晰地表達了數據的結構和約束。
- **引導實現**：類型定義為實現提供了明確的指導，使得實現更加直觀和可靠。
- **促進模組化**：清晰的類型邊界有助於設計更加模組化的系統。

### 代數資料類型 (ADT) 的應用

代數資料類型是函數式程式設計中的重要概念，在 TypeScript 中主要通過聯合類型 (Union Types) 和介面 (Interfaces) 來實現。我們將特別關注：

1. **狀態建模**：使用標籤聯合類型 (Tagged Union Types) 來表示不同狀態。
2. **結果處理**：使用 Result 類型來處理可能的成功或失敗情況。
3. **類型守衛**：使用類型守衛 (Type Guards) 來安全地處理不同類型的值。

例如，我們使用 ADT 來表示病患的不同狀態：

```typescript
// 病患可能處於的不同狀態
export type PatientState = 
  | Registered   // 已掛號
  | Admitted     // 已入院
  | Discharged   // 已出院
  | Transferred; // 已轉院
```

通過這種方式，我們可以確保病患只能處於這些預定義的狀態之一，並且每種狀態都有其特定的屬性和行為。

## 專案結構

```txt
mini-HIS/
├── README.md         # 專案說明文件
├── src/
│   ├── types/        # 類型定義
│   │   ├── common.ts # 通用類型
│   │   └── results.ts # 結果類型 (ADT)
│   ├── models/       # 模型定義
│   │   ├── Patient.ts       # 病患管理模組
│   │   ├── Appointment.ts   # 預約系統模組
│   │   ├── Prescription.ts  # 藥物處方模組
│   │   └── MedicalService.ts # 醫療服務模組
│   └── index.ts      # 主入口文件
└── examples/         # 示例代碼
    ├── patient-workflow.ts      # 病患工作流示例
    └── prescription-workflow.ts # 處方工作流示例
```

## 如何運行

環境：Node.js 22+

本專案零依賴，可直接以 strip-only 模式執行 .ts：

```bash
node --experimental-strip-types src/index.ts
```

## 核心模組說明

### 1. 病患管理 (Patient.ts)

這個模組以帶 tag 的聯合型別建模狀態，並以轉換函式限制可執行操作。

範例片段：

```ts
// 狀態定義（節錄）
export interface Registered { tag: 'Registered'; patientId: ID; registeredAt: DateTime; info: PatientInfo; }
export interface Admitted   { tag: 'Admitted';   patientId: ID; admittedAt: DateTime; wardNumber: string; bedNumber: string; attendingDoctorId: ID; info: PatientInfo; diagnoses: Diagnosis[]; }
export type PatientState = Registered | Admitted | Discharged | Referred | Deceased;

// 狀態轉換（僅允許 Registered → Admitted）
export function admitPatient(patient: Registered, ward: string, bed: string, doctorId: ID): Result<Admitted> { /* 驗證 → success/failure */ }

// 類型守衛
export function isAdmitted(p: PatientState): p is Admitted { return p.tag === 'Admitted'; }
```

### 2. 預約系統 (Appointment.ts)

以最小合法單位建模每一步，函式參數即為前置狀態，避免非法轉換。

範例片段：

```ts
// 請求 → 確認 → 報到 → 開始 → 完成
export function requestAppointment(patientId: ID, doctorId: ID, dept: string, time: TimeSlot, purpose: string): Result<Requested>;
export function confirmAppointment(appt: Requested, confirmationNumber: string): Result<Confirmed>;
export function checkInAppointment(appt: Confirmed): Result<CheckedIn>;
export function startAppointment(appt: CheckedIn): Result<InProgress>;
export function completeAppointment(appt: InProgress, followUpNeeded: boolean, notes?: string): Result<Completed>;

// 時間窗驗證（30 分鐘）失敗時回傳 failure
if (minutesDiff > 30) return failure(ErrorCode.ValidationFailed, 'Check-in time is outside the allowed window ...');
```

### 3. 藥物處方 (Prescription.ts)

展示 Created → Submitted → InPreparation → Prepared → Dispensed 的線性流程，並以 `Result` 回報驗證錯誤。

範例片段：

```ts
// 開立處方（至少 1 個藥品項目）
export function createPrescription(patientId: ID, doctorId: ID, items: PrescriptionItem[], notes?: string): Result<Created> {
  if (items.length === 0) return failure(ErrorCode.ValidationFailed, 'Prescription must contain at least one medication item.');
  return success({ tag: 'Created', /* ... */ });
}

// 僅 Submitted 才能開始調劑
export function startPreparation(rx: Submitted, pharmacistId: ID): Result<InPreparation>;
```

### 4. 醫療服務 (MedicalService.ts)

使用常數物件 + 字面量聯合取代 enum，支援 Node 直跑；每步驟皆檢核必要條件。

範例片段：

```ts
// 類別與優先權（取代 enum）
export const ServiceType = { Consultation: 'Consultation', Examination: 'Examination', /* ... */ } as const;
export type ServiceType = typeof ServiceType[keyof typeof ServiceType];

// 排程（僅 Requested 可排程，時間需在未來）
export function scheduleService(svc: Requested, scheduledTime: DateTime, scheduledBy: ID, staff?: MedicalStaff[], location?: string): Result<Scheduled> {
  if (new Date(scheduledTime) <= new Date()) return failure(ErrorCode.ValidationFailed, 'Scheduled time must be in the future.');
  return success({ tag: 'Scheduled', /* ... */ });
}
```

---

補充：Result ADT（統一成功/失敗回傳）

```ts
export type Result<T> = Success<T> | Failure;
export function success<T>(data: T): Success<T> { return { success: true, data }; }
export function failure(code: ErrorCode, message: string, details?: Record<string, unknown>): Failure { return { success: false, error: { code, message, details } }; }
export function isSuccess<T>(r: Result<T>): r is Success<T> { return r.success === true; }
```

## 示例說明（精簡）

### 1. 病患工作流（`examples/patient-workflow.ts`）

- 狀態：Registered → Admitted → Discharged
- 重點：以型別守衛（`isRegistered`、`isAdmitted`）約束可用操作。
- 錯誤處理：以 `Result` ADT 統一處理。

### 2. 處方工作流（`examples/prescription-workflow.ts`）

- 狀態：Created → Submitted → InPreparation → Prepared → Dispensed
- 重點：每個轉換僅接受合法前置狀態（例如只有 `Submitted` 才能 `startPreparation`）。
- 類型守衛：`isCreated`、`isSubmitted`、`isInPreparation`…

### 3. 主流程（`src/index.ts`）

- 串接 Patient／Appointment／Prescription／MedicalService。
- 預約：request → confirm → check-in → start → complete（時間設為「5 分鐘後」方便示範）。

## 設計重點（程式面）

- `Result<T>`：成功/失敗以 ADT 表示（`success`/`failure`），統一錯誤碼 `ErrorCode`。
- 狀態機：以帶 `tag` 的聯合型別描述狀態與轉換，避免非法轉換。
- 類型守衛：`isXxx` 讓分支內自動縮小型別，避免斷言。
- 零依賴直跑：用 const 物件 + 字面量聯合取代 enum，相容 `--experimental-strip-types`。
