# 教學 01: 專案結構解析

一個清晰的專案結構是軟體開發的基礎。它不僅能幫助團隊成員快速理解程式碼的組織方式，也能讓未來的維護工作更加輕鬆。`mini-HIS` 專案採用了功能導向的模組化結構，旨在將不同業務領域的程式碼清晰地分離開來。

## 專案目錄概覽

以下是本專案的完整目錄結構：

```txt
mini-HIS/
├── learn/              # 教學文件目錄 (我們正在建立的！)
│   ├── 00-Introduction.md
│   └── ...
├── README.md           # 專案說明文件，提供專案概覽與快速上手指南
├── tsconfig.json       # TypeScript 編譯器設定檔
├── src/                # 原始碼主目錄
│   ├── types/          # 全域類型定義
│   │   ├── common.ts   # 通用基礎類型 (如 ID, DateTime)
│   │   └── results.ts  # Result 代數資料類型 (ADT)
│   ├── models/         # 核心業務模組
│   │   ├── Patient.ts        # 病患管理模組
│   │   ├── Appointment.ts    # 預約系統模組
│   │   ├── Prescription.ts   # 藥物處方模組
│   │   └── MedicalService.ts # 醫療服務模組
│   └── index.ts        # 應用程式主入口，用於整合與示範
└── examples/           # 獨立的範例程式碼
    ├── patient-workflow.ts      # 病患工作流程範例
    └── prescription-workflow.ts # 處方工作流程範例
```

## 各部分詳解

### `src` - 原始碼核心

這是我們所有業務邏輯與類型定義的家。我們將其進一步劃分為幾個關鍵子目錄：

-   **`src/types/`**: 這個目錄存放了整個專案共享的類型定義。
    -   `common.ts`: 定義了最基礎、最通用的類型，例如 `ID` (字串)、`DateTime` (字串) 等。這些類型雖然簡單，但為我們的系統提供了一致的語義。
    -   `results.ts`: 這是我們實現 `Result` ADT 的地方。這個檔案定義了 `Success<T>` 和 `Failure` 類型，以及輔助函式 `success()` 和 `failure()`，是我們處理錯誤與回傳值的標準模式。

-   **`src/models/`**: 這裡是專案的核心，包含了各個獨立的業務模組。每個檔案都代表一個特定的業務領域，並封裝了與該領域相關的所有類型、狀態和函式。
    -   `Patient.ts`: 負責所有與病患相關的邏輯，包括病患的狀態 (已掛號、已入院等) 以及狀態之間的轉換函式。
    -   `Appointment.ts`: 管理預約流程，從請求、確認到完成的每一步都被精確地 моделирован。
    -   `Prescription.ts`: 處理藥物處方的生命週期，確保處方流程的每一步都符合規定。
    -   `MedicalService.ts`: 定義了醫療服務 (如檢查、諮詢) 的類型與流程。

-   **`src/index.ts`**: 作為一個整合性的入口點，這個檔案會匯入 `models` 中的各個模組，並將它們串聯起來，模擬一個完整的醫院運作流程。它主要用於示範各模組如何協同工作。

### `examples` - 獨立工作流程範例

為了更清晰地展示每個核心模組的獨立運作方式，我們在 `examples` 目錄中提供了針對特定工作流程的範例。

-   `patient-workflow.ts`: 專門演示 `Patient.ts` 模組，展示如何註冊一個新病患，並使其經歷入院、出院等一系列狀態變化。
-   `prescription-workflow.ts`: 專門演示 `Prescription.ts` 模組，展示如何從建立一張處方開始，逐步完成提交、調劑到發藥的完整流程。

這些範例檔案是理解單一模組內部邏輯的最佳起點。

### `tsconfig.json` - TypeScript 設定

這個檔案是 TypeScript 的大腦，它告訴編譯器如何檢查我們的程式碼。我們啟用了最嚴格的模式 (`"strict": true`)，以最大程度地利用 TypeScript 的類型檢查能力。同時，`"noEmit": true` 設定表示我們只使用 TypeScript 進行類型檢查，而不產生任何 JavaScript 檔案，因為本專案的 `.ts` 檔案可以直接由 Node.js 執行。

## 下一步

在下一個章節，我們將深入探討 `src/types/` 目錄，特別是強大的 `Result` ADT，看看它是如何徹底改變我們處理錯誤的方式。