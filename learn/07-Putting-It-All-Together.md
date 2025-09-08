# 第七部分：整合所有模組 (Putting It All Together)

在前面的章節中，我們逐一探討了 `Patient`、`Appointment`、`Prescription` 和 `MedicalService` 四個核心模組。現在，我們將它們全部整合起來，模擬一個真實世界中的醫院工作流程。這個過程將展示代數資料類型（ADT）如何在一個複雜的系統中協同工作，確保資料的一致性和流程的正確性。

我們的整合示範位於 `src/index.ts`，它模擬了一個完整的病患就診流程。

## 完整流程概覽

整個流程遵循以下步驟，每個步驟都依賴於前一個狀態的成功轉變：

1.  **病患掛號 (Patient Registration)**：一個新病患來到醫院，我們為其建立一個新的病歷。
2.  **建立預約 (Appointment Request)**：為病患安排一次門診。
3.  **確認預約 (Appointment Confirmation)**：醫院後台確認預約時間和資源。
4.  **病患入院 (Patient Admission)**：病患在預約當天來到醫院，辦理入院手續。
5.  **開立處方 (Prescription Creation)**：醫生為病患開立藥物處方。
6.  **送出處方 (Prescription Submission)**：處方被送至藥局進行處理。
7.  **藥物調劑 (Prescription Preparation & Dispensing)**：藥局藥師準備並發放藥物。
8.  **請求醫療服務 (Medical Service Request)**：醫生為病患安排一項檢查（例如 X 光）。
9.  **排程與執行服務 (Medical Service Scheduling & Execution)**：醫院安排並執行該項醫療服務。
10. **完成預約 (Appointment Completion)**：病患完成所有診療活動。
11. **病患出院 (Patient Discharge)**：病患康復，辦理出院手續。

接下來，我們將逐一解析 `src/index.ts` 中的關鍵程式碼。

## 步驟解析

### 1. 病患掛號

流程始於 `registerPatient` 函式。我們傳入一個包含病患基本資訊的物件，成功後會得到一個 `PatientState` 為 `{ tag: 'Registered', ... }` 的狀態。

```typescript
// src/index.ts

const patientResult = registerPatient(
  {
    id: newPatientId,
    name: '王小明',
    // ... 其他個人資訊
  },
  newPatientId
);

if (isFailure(patientResult)) {
  // 錯誤處理
}

let patient: PatientState = patientResult.data;
// patient.tag === 'Registered'
```

### 2. 建立與確認預約

接著，我們為這位已掛號的病患建立一個預約。`requestAppointment` 需要 `patientId`，並返回一個 `{ tag: 'Requested', ... }` 的 `AppointmentState`。隨後，我們使用 `confirmAppointment` 將其狀態更新為 `Confirmed`。

```typescript
// src/index.ts

const appointmentResult = requestAppointment(...);
let appointment: AppointmentState = appointmentResult.data;
// appointment.tag === 'Requested'

const confirmedAppointmentResult = confirmAppointment(appointment, ...);
appointment = confirmedAppointmentResult.data;
// appointment.tag === 'Confirmed'
```

### 3. 病患入院

當病患來到醫院時，我們使用 `admitPatient` 函式處理入院流程。此函式接收一個 `Registered` 狀態的病患，並將其轉換為 `Admitted` 狀態。

```typescript
// src/index.ts

const admittedPatientResult = admitPatient(
  patient, // 必須是 Registered 狀態
  'ward-101',
  'bed-05',
  'doc-001'
);

patient = admittedPatientResult.data;
// patient.tag === 'Admitted'
```

### 4. 處方與藥物流程

入院後，醫生可以為病患開立處方。從 `createPrescription` 開始，處方經歷了 `Draft` -> `Submitted` -> `Preparing` -> `ReadyForDispensing` -> `Dispensed` 的完整生命週期。

```typescript
// src/index.ts

// 建立處方 (Draft)
let prescription: PrescriptionState = createPrescription(...).data;

// 送出至藥局 (Submitted)
prescription = submitPrescription(prescription).data;

// 開始調劑 (Preparing)
prescription = startPrescriptionPreparation(prescription, ...).data;

// 完成調劑 (ReadyForDispensing)
prescription = completePreparing(prescription, ...).data;

// 發放藥物 (Dispensed)
prescription = dispensePrescription(prescription, ...).data;
```

### 5. 醫療服務流程

同時，醫生可能還需要為病患安排醫療服務。這個流程從 `requestService` 開始，狀態依序為 `Requested` -> `Scheduled` -> `Preparing` -> `InProgress` -> `Completed`。

```typescript
// src/index.ts

// 請求服務 (Requested)
let service: ServiceState = requestService(...).data;

// 排程服務 (Scheduled)
service = scheduleService(service, ...).data;

// ... 後續狀態轉換
service = completeService(service, ...).data;
// service.tag === 'Completed'
```

### 6. 完成預約與出院

當所有診療活動結束後，我們首先完成預約，將其狀態從 `InProgress` 更新為 `Completed`。最後，使用 `dischargePatient` 為病患辦理出院，病患狀態最終變為 `Discharged`。

```typescript
// src/index.ts

// 完成預約
const completedAppointmentResult = completeAppointment(inProgressAppointment, ...);
appointment = completedAppointmentResult.data;
// appointment.tag === 'Completed'

// 病患出院
const dischargedPatientResult = dischargePatient(patient, ...);
patient = dischargedPatientResult.data;
// patient.tag === 'Discharged'
```

## 總結

`src/index.ts` 不僅是一個示範，它更是我們設計哲學的體現。透過將各個模組的 ADT 狀態串連起來，我們構建了一個可預測、類型安全的系統。每個函式都明確定義了它接受的狀態和返回的狀態，任何不符合流程的操作都會在編譯時期被 TypeScript 捕捉到。

這種「型別驅動」的開發模式，讓我們能夠充滿信心地處理複雜的業務邏輯，因為我們的程式碼不僅僅是在執行指令，它還在描述一個經過嚴格定義的狀態機。

在下一個章節，我們將對整個專案進行總結，並探討這種架構的優勢與未來發展方向。