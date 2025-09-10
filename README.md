# mini-HIS: 醫院資訊系統示範專案

這是一個使用 TypeScript 開發的醫院資訊系統 (Hospital Information System) 示範專案，旨在展示「先寫類型再寫邏輯」的開發方法，以及如何使用代數資料類型 (Algebraic Data Types, ADT) 來規範和簡化程式碼邏輯。

專案包含完整的 **前後端實現**，具備資料庫抽象層設計，前端使用 **TailwindCSS** 和原生 JavaScript，後端使用 **Express.js** 提供 RESTful API。

## 功能特色

🏥 **完整的醫院工作流程**
- 病患管理：註冊
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
├── README.md                   # 專案說明文件
├── src/
│   ├── public/                 # 前端靜態檔案
│   │   ├── index.html
│   │   ├── medical-record.html
│   │   └── js/
│   │       ├── api.js
│   │       ├── appointment.js
│   │       ├── main.js
│   │       ├── medical_record.js
│   │       ├── patient.js
│   │       ├── prescription.js
│   │       ├── service.js
│   │       ├── settings.js
│   │       └── utils.js
│   ├── database/               # 資料庫抽象層 + JSON 實作
│   │   ├── collection.ts       # 泛型集合 API（list/getById/upsert/remove）
│   │   ├── index.ts            # 資料庫實例匯出
│   │   ├── interface.ts        # Database 介面 (CQRS)
│   │   ├── json-database.ts    # JSON 資料庫實作
│   │   ├── migrations.ts       # 開機遷移與集合補齊
│   │   ├── schema.ts           # 檔案結構 schema 定義
│   │   └── storage-engine.ts   # 原子寫入引擎（tmp → fsync → rename）
│   ├── models/                 # 業務模型（ADT 狀態機）
│   │   ├── Appointment.ts
│   │   ├── MedicalRecord.ts
│   │   ├── MedicalService.ts
│   │   ├── Patient.ts
│   │   └── Prescription.ts
│   ├── types/                  # 類型定義
│   │   ├── common.ts
│   │   └── results.ts
│   ├── utils/
│   │   └── id.ts               # 單調遞增 ID 產生器
│   ├── db.json                 # JSON 資料庫檔案
│   ├── server.ts               # Express 後端服務
│   └── index.ts                # 控制台示範程式（npm run demo）
├── package.json                # Node.js 專案配置（Node 22 strip types）
├── tsconfig.json               # TypeScript 設定（型別檢查用）
├── Dockerfile
├── package-lock.json | pnpm-lock.yaml
└── docs/
    └── api-tests.md           # API 測試與驗證（由原 test.md 整合而來）
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

## 測試與驗證

- API 實測指引與 curl 範例請見：`docs/api-tests.md`
- 端點完整列表仍以本文件的「API 端點」章節為準

## API 端點

### 病患管理
- `POST /api/patients` - 註冊新病患
- `GET /api/patients` - 獲取所有病患
- `GET /api/patients/:id` - 獲取指定病患
- `PUT /api/patients/:id` - 更新病患資訊
- `DELETE /api/patients/:id` - 刪除病患

### 醫療病歷（Medical Records）
- `GET /api/medical-records?patientId=:id` - 依病患查詢病歷
- `GET /api/medical-records/:id` - 取得病歷
- `POST /api/medical-records` - 新增病歷
- `PUT /api/medical-records/:id` - 更新病歷
- `DELETE /api/medical-records/:id` - 刪除病歷（若實作）

### 預約系統
- `POST /api/appointments` - 建立新預約
- `GET /api/appointments` - 獲取所有預約
- `POST /api/appointments/:id/confirm` - 確認預約
- `POST /api/appointments/:id/checkin` - 預約報到
- `POST /api/appointments/:id/start` - 開始預約
- `POST /api/appointments/:id/complete` - 完成預約
- `DELETE /api/appointments/:id` - 刪除預約

### 處方管理
- `POST /api/prescriptions` - 開立新處方
- `GET /api/prescriptions` - 獲取所有處方
- `POST /api/prescriptions/:id/submit` - 送出處方
- `POST /api/prescriptions/:id/start-preparing` - 開始調劑
- `POST /api/prescriptions/:id/complete-preparing` - 完成調劑
- `POST /api/prescriptions/:id/dispense` - 發放藥物
- `DELETE /api/prescriptions/:id` - 刪除處方

### 醫療服務
- `POST /api/services` - 請求新服務
- `GET /api/services` - 獲取所有服務
- `POST /api/services/:id/schedule` - 排程服務
- `POST /api/services/:id/start-preparing` - 開始準備
- `POST /api/services/:id/start` - 開始服務
- `POST /api/services/:id/complete` - 完成服務
- `DELETE /api/services/:id` - 刪除服務

### 醫師（設定）
- `GET /api/doctors` - 取得所有醫師
- `GET /api/doctors/:id` - 取得單一醫師
- `POST /api/doctors` - 新增醫師（body: `{ name }`；ID 由伺服器以單調時間產生 `dr-...`）
- `PUT /api/doctors/:id` - 更新醫師姓名（ID 不可修改）
- `DELETE /api/doctors/:id` - 刪除醫師

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

## 近期改動與優化（mini-HIS-UI 重構）

- 資料層
  - 新增 `StorageEngine`（`src/database/storage-engine.ts`）：提供原子寫入（tmp → fsync → rename → fsync 目錄），提升資料可靠性。
  - 新增 `migrations`（`src/database/migrations.ts`）：啟動時自動補齊缺漏集合（如 `medicalRecords`、`doctors`），替代以往讀取時的硬編碼補丁。
  - 新增泛型 `Collection` API（`src/database/collection.ts`）：統一 `list/getById/upsert/remove`，消除 JsonDatabase 內大量重複 CRUD 模板。
  - 重構 `JsonDatabase`（`src/database/json-database.ts`）：委派至 Collection/StorageEngine，保留既有 `Database` 介面，無痛相容。

- API / 路由
  - 移除重複端點：統一使用 `/start-preparing`（處方、服務），移除舊 `/start-preparation`。
  - Server 層不再重複檢查 `tag`，統一交由 model 轉換函式驗證（Result ADT），減少樣板與分散邏輯。
  - 新增通用 ID 產生器 `createId(prefix)`（`src/utils/id.ts`）：取代 `Date.now()`，避免同毫秒碰撞（單調序列）。

- 前端對齊
  - `src/public/js/prescription.js`：
    - `startPreparingPrescription` 攜帶 `{ pharmacistId }`
    - `dispensePrescription` 攜帶 `{ dispensedBy, instructions }`
  - `src/public/js/service.js`：
    - `scheduleService` 攜帶 `{ scheduledTime, scheduledBy, location }`
    - `startPreparingService` 攜帶 `{ staff, location, preparationNotes }`
    - `completeService` 攜帶 `{ results, actualDuration, followUpInstructions }`

效益
- 消除重複代碼與分散檢查，降低維護成本。
- I/O 原子性與遷移機制，強化資料安全與向後相容。
- API/前端契約清晰一致，降低錯誤率，提升可測性。

## 專案亮點

### 🎯 類型優先設計
這個專案展示了如何讓類型系統引導業務邏輯的實現，而非僅僅作為註解。每個狀態轉換都有明確的類型約束，編譯器會確保我們不會遺漏任何邊界情況。

### 🏗️ 資料庫抽象層
設計了完整的 CQRS 資料庫抽象層，目前使用 JSON 檔案儲存，但可以輕鬆切換到 PostgreSQL、MongoDB 或任何其他資料庫，而不需要修改業務邏輯代碼。

### 🔄 ADT 狀態機
使用代數資料類型實現的狀態機確保了醫院業務流程的正確性，每個狀態轉換都是類型安全的，避免了常見的狀態管理錯誤。

## 授權

ISC License
