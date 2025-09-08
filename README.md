# mini-HIS: 醫院資訊系統示範專案

這是一個使用 TypeScript 開發的醫院資訊系統 (Hospital Information System) 示範專案，旨在展示「先寫類型再寫邏輯」的開發方法，以及如何使用代數資料類型 (Algebraic Data Types, ADT) 來規範和簡化程式碼邏輯。

專案包含完整的 **前後端實現**，具備資料庫抽象層設計，前端使用 **TailwindCSS** 和原生 JavaScript，後端使用 **Express.js** 提供 RESTful API。

## 功能特色

🏥 **完整的醫院工作流程**
- 病患管理：註冊、入院、出院
- 預約系統：預約、確認、報到、開始、完成
- 處方管理：開立、送出、調劑、完成、發藥
- 醫療服務：請求、排程、準備、執行、完成

🔧 **技術架構**
- **前端**：HTML + TailwindCSS + 原生 JavaScript
- **後端**：Node.js + Express.js + TypeScript
- **資料庫抽象層**：CQRS 模式，目前使用 JSON 檔案，可無縫切換其他資料庫
- **類型系統**：完全使用 TypeScript ADT 實現狀態管理

## 開發理念

### 先寫類型再寫邏輯

在傳統開發中，我們常常先考慮程式的行為和邏輯，然後才定義資料結構。這種方式容易導致類型不一致、邊界情況處理不當等問題。在本專案中，我們將採用相反的方式：

1. **先定義完整的類型系統**：包括實體類型、狀態類型、操作結果類型等。
2. **利用類型來引導邏輯實現**：讓編譯器幫助我們檢查是否處理了所有可能的情況。
3. **使用類型來表達業務規則**：將業務規則編碼到類型系統中，而不是散落在各處的條件判斷。

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

### 資料庫抽象層設計

專案採用 CQRS (Command Query Responsibility Segregation) 模式設計資料庫抽象層：

```typescript
export interface Database {
  // 病患操作
  createPatient(id: string, data: PatientState): Promise<boolean>;
  readPatient(id: string): Promise<PatientState | null>;
  updatePatient(id: string, data: PatientState): Promise<boolean>;
  // ... 其他實體的 CQRS 操作
}
```

**設計優勢**：
- 🔄 **無縫切換**：可輕鬆從 JSON 切換到 PostgreSQL、MongoDB 等資料庫
- 🎯 **明確職責**：讀寫操作分離，職責清晰
- 🛡️ **類型安全**：每個操作都有明確的輸入輸出類型
- 🧪 **易於測試**：可輕鬆模擬資料庫操作進行單元測試

## 專案結構

```txt
mini-HIS/
├── README.md         # 專案說明文件
├── src/
│   ├── public/       # 前端靜態檔案
│   │   ├── index.html # 主頁面 (使用 TailwindCSS CDN)
│   │   └── app.js     # 前端 JavaScript 邏輯
│   ├── database/     # 資料庫抽象層
│   │   ├── interface.ts     # 資料庫介面定義 (CQRS)
│   │   ├── json-database.ts # JSON 資料庫實作
│   │   └── index.ts         # 資料庫實例匯出
│   ├── types/        # 類型定義
│   │   ├── common.ts # 通用類型
│   │   └── results.ts # 結果類型 (ADT)
│   ├── models/       # 模型定義
│   │   ├── Patient.ts       # 病患管理模組
│   │   ├── Appointment.ts   # 預約系統模組
│   │   ├── Prescription.ts  # 藥物處方模組
│   │   └── MedicalService.ts # 醫療服務模組
│   ├── db.json       # JSON 資料庫檔案
│   ├── server.ts     # Express 後端服務器
│   └── index.ts      # 控制台示範程式
├── package.json      # Node.js 專案配置
└── tsconfig.json     # TypeScript 配置
```

## 如何運行

### 環境需求
- Node.js 22+ (支援原生 TypeScript)
- TypeScript (用於類型檢查)

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

使用帶 tag 的聯合型別建模狀態，並以轉換函式限制可執行操作：

```typescript
// 狀態定義
export interface Registered { 
  tag: 'Registered'; 
  patientId: ID; 
  registeredAt: DateTime; 
  info: PatientInfo; 
}

export interface Admitted { 
  tag: 'Admitted'; 
  patientId: ID; 
  admittedAt: DateTime; 
  wardNumber: string; 
  bedNumber: string; 
  attendingDoctorId: ID; 
  info: PatientInfo; 
  diagnoses: Diagnosis[]; 
}

export type PatientState = Registered | Admitted | Discharged | Referred | Deceased;

// 狀態轉換（僅允許 Registered → Admitted）
export function admitPatient(
  patient: Registered, 
  ward: string, 
  bed: string, 
  doctorId: ID
): Result<Admitted> { 
  /* 驗證 → success/failure */ 
}
```

### 2. 預約系統 (Appointment.ts)

以最小合法單位建模每一步，函式參數即為前置狀態，避免非法轉換：

```typescript
// 請求 → 確認 → 報到 → 開始 → 完成
export function requestAppointment(
  patientId: ID, 
  doctorId: ID, 
  dept: string, 
  time: TimeSlot, 
  purpose: string
): Result<Requested>;

export function confirmAppointment(
  appt: Requested, 
  confirmationNumber: string
): Result<Confirmed>;

export function checkInAppointment(appt: Confirmed): Result<CheckedIn>;
export function startAppointment(appt: CheckedIn): Result<InProgress>;
export function completeAppointment(
  appt: InProgress, 
  followUpNeeded: boolean, 
  notes?: string
): Result<Completed>;
```

### 3. 資料庫抽象層 (database/)

CQRS 模式設計，目前使用 JSON 檔案，未來可無縫切換至其他資料庫：

```typescript
export interface Database {
  // 每個實體都有完整的 CRUD 操作
  createPatient(id: string, data: PatientState): Promise<boolean>;
  readPatient(id: string): Promise<PatientState | null>;
  updatePatient(id: string, data: PatientState): Promise<boolean>;
  deletePatient(id: string): Promise<boolean>;
  findAllPatients(): Promise<PatientState[]>;
  // ... 預約、處方、服務的對應操作
}
```

## Result ADT（統一成功/失敗回傳）

```typescript
export type Result<T> = Success<T> | Failure;

export function success<T>(data: T): Success<T> { 
  return { success: true, data }; 
}

export function failure(
  code: ErrorCode, 
  message: string, 
  details?: Record<string, unknown>
): Failure { 
  return { success: false, error: { code, message, details } }; 
}

export function isSuccess<T>(r: Result<T>): r is Success<T> { 
  return r.success === true; 
}
```

## 設計重點

- **Result\<T\>**：成功/失敗以 ADT 表示（`success`/`failure`），統一錯誤碼 `ErrorCode`
- **狀態機**：以帶 `tag` 的聯合型別描述狀態與轉換，避免非法轉換
- **類型守衛**：`isXxx` 讓分支內自動縮小型別，避免斷言
- **資料庫抽象**：CQRS 模式，可無縫切換不同資料庫實作
- **零依賴直跑**：用 const 物件 + 字面量聯合取代 enum，相容 TypeScript 編譯

## 技術特色

✅ **類型安全**：使用 TypeScript 的強型別系統確保編譯時期的錯誤檢查  
✅ **狀態管理**：透過 ADT 實現清晰的狀態轉換和業務邏輯  
✅ **錯誤處理**：統一的 Result 類型處理成功和失敗情況  
✅ **資料庫抽象**：CQRS 模式設計，可無縫切換資料庫實作  
✅ **模組化設計**：清晰的模組分工和職責分離  
✅ **現代化前端**：使用 TailwindCSS 實現響應式設計  
✅ **RESTful API**：標準的 REST API 設計，易於擴展和維護

## 專案亮點

### 🎯 類型優先設計
這個專案展示了如何讓類型系統引導業務邏輯的實現，而非僅僅作為註解。每個狀態轉換都有明確的類型約束，編譯器會確保我們不會遺漏任何邊界情況。

### 🏗️ 資料庫抽象層
設計了完整的 CQRS 資料庫抽象層，目前使用 JSON 檔案儲存，但可以輕鬆切換到 PostgreSQL、MongoDB 或任何其他資料庫，而不需要修改業務邏輯代碼。

### 🔄 ADT 狀態機
使用代數資料類型實現的狀態機確保了醫院業務流程的正確性，每個狀態轉換都是類型安全的，避免了常見的狀態管理錯誤。

## 授權

ISC License