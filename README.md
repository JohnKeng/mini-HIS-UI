# mini-HIS: 醫院資訊系統示範專案

這是一個使用 TypeScript 開發的醫院資訊系統 (Hospital Information System) 示範專案，旨在展示「先寫類型再寫邏輯」的開發方法，以及如何使用代數資料類型 (Algebraic Data Types, ADT) 來規範和簡化程式碼邏輯。

專案包含完整的 **前後端實現**，前端使用 **TailwindCSS** 和原生 JavaScript，後端使用 **Express.js** 提供 RESTful API。

## 功能特色

🏥 **完整的醫院工作流程**
- 病患管理：註冊、入院、出院
- 預約系統：預約、確認、報到、開始、完成
- 處方管理：開立、送出、調劑、完成、發藥
- 醫療服務：請求、排程、準備、執行、完成

🔧 **技術架構**
- **前端**：HTML + TailwindCSS + 原生 JavaScript
- **後端**：Node.js + Express.js + TypeScript
- **類型系統**：完全使用 TypeScript ADT 實現狀態管理
- **架構模式**：RESTful API + 狀態機設計

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
├── public/           # 前端靜態檔案
│   ├── index.html    # 主頁面 (使用 TailwindCSS CDN)
│   └── app.js        # 前端 JavaScript 邏輯
├── src/
│   ├── types/        # 類型定義
│   │   ├── common.ts # 通用類型
│   │   └── results.ts # 結果類型 (ADT)
│   ├── models/       # 模型定義
│   │   ├── Patient.ts       # 病患管理模組
│   │   ├── Appointment.ts   # 預約系統模組
│   │   ├── Prescription.ts  # 藥物處方模組
│   │   └── MedicalService.ts # 醫療服務模組
│   ├── server.ts     # Express 後端服務器
│   └── index.ts      # 控制台示範程式
├── package.json      # Node.js 專案配置
└── tsconfig.json     # TypeScript 配置
```

## 如何運行

### 環境需求
- Node.js 20+
- TypeScript

### 安裝依賴

```bash
npm install
```

### 運行方式

#### 1. 網頁應用程式 (推薦)
```bash
npm run start
# 或
npm run dev
```

訪問 `http://localhost:5000` 查看完整的醫院資訊系統網頁界面。

#### 2. 控制台示範程式
```bash
npm run demo
```

運行控制台版本的完整醫院工作流程示範。

## API 端點

### 病患管理
- `POST /api/patients` - 註冊新病患
- `GET /api/patients` - 獲取所有病患
- `GET /api/patients/:id` - 獲取指定病患
- `POST /api/patients/:id/admit` - 病患入院
- `POST /api/patients/:id/discharge` - 病患出院

### 預約系統
- `POST /api/appointments` - 建立新預約
- `GET /api/appointments` - 獲取所有預約
- `POST /api/appointments/:id/confirm` - 確認預約
- `POST /api/appointments/:id/checkin` - 預約報到
- `POST /api/appointments/:id/start` - 開始預約
- `POST /api/appointments/:id/complete` - 完成預約

### 處方管理
- `POST /api/prescriptions` - 開立新處方
- `GET /api/prescriptions` - 獲取所有處方
- `POST /api/prescriptions/:id/submit` - 送出處方
- `POST /api/prescriptions/:id/start-preparation` - 開始調劑
- `POST /api/prescriptions/:id/complete-preparing` - 完成調劑
- `POST /api/prescriptions/:id/dispense` - 發放藥物

### 醫療服務
- `POST /api/services` - 請求新服務
- `GET /api/services` - 獲取所有服務
- `POST /api/services/:id/schedule` - 排程服務
- `POST /api/services/:id/start-preparation` - 開始準備
- `POST /api/services/:id/start` - 開始服務
- `POST /api/services/:id/complete` - 完成服務

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

## Result ADT（統一成功/失敗回傳）

```ts
export type Result<T> = Success<T> | Failure;
export function success<T>(data: T): Success<T> { return { success: true, data }; }
export function failure(code: ErrorCode, message: string, details?: Record<string, unknown>): Failure { return { success: false, error: { code, message, details } }; }
export function isSuccess<T>(r: Result<T>): r is Success<T> { return r.success === true; }
```

## 設計重點（程式面）

- `Result<T>`：成功/失敗以 ADT 表示（`success`/`failure`），統一錯誤碼 `ErrorCode`。
- 狀態機：以帶 `tag` 的聯合型別描述狀態與轉換，避免非法轉換。
- 類型守衛：`isXxx` 讓分支內自動縮小型別，避免斷言。
- 零依賴直跑：用 const 物件 + 字面量聯合取代 enum，相容 TypeScript 編譯。

## 技術特色

✅ **類型安全**：使用 TypeScript 的強型別系統確保編譯時期的錯誤檢查  
✅ **狀態管理**：透過 ADT 實現清晰的狀態轉換和業務邏輯  
✅ **錯誤處理**：統一的 Result 類型處理成功和失敗情況  
✅ **模組化設計**：清晰的模組分工和職責分離  
✅ **現代化前端**：使用 TailwindCSS 實現響應式設計  
✅ **RESTful API**：標準的 REST API 設計，易於擴展和維護

## 授權

ISC License