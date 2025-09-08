# 教學 02: 核心類型 - 通用與結果類型

在 `mini-HIS` 專案中，類型系統是整個架構的基石。在我們深入探討各個業務模組之前，必須先理解位於 `src/types/` 目錄下的兩個核心檔案：`common.ts` 和 `results.ts`。它們定義了系統中最基礎、最通用的構建模塊。

## `common.ts` - 建立一致的語義

`common.ts` 的目標是為整個應用程式提供一組一致且具有明確語義的基礎類型。這有助於避免在不同模組中使用模糊或不一致的類型定義（例如，有時用 `string` 代表 ID，有時用 `number`）。

### 基礎別名

我們首先定義了兩個非常基礎的類型別名：

```typescript
export type ID = string;
export type DateTime = string; // (使用 ISO 字符串表示)
```

-   `ID`: 雖然它本質上是一個 `string`，但將其命名為 `ID` 提供了更強的語義。當我們在函式簽章中看到 `patientId: ID`，我們會立刻明白這是一個識別碼，而不僅僅是任意的字串。
-   `DateTime`: 同樣地，這清楚地表明該字串應該是一個符合 ISO 8601 格式的日期時間字串，例如 `"2023-10-27T10:00:00Z"`。

### 以常數取代 Enum

你可能注意到我們使用 `as const` 的方式來定義性別和醫療人員類型，而不是 TypeScript 的 `enum`。

```typescript
// 性別類型
export const Gender = {
  Male: 'male',
  Female: 'female',
  Other: 'other',
} as const; // <--- as const 很重要！
export type Gender = typeof Gender[keyof typeof Gender];
```

這種模式有幾個優點：

1.  **更輕量**：它不會像 `enum` 那樣在編譯後的 JavaScript 中產生額外的程式碼。
2.  **更透明**：`Gender.Male` 的值就是字串 `'male'`，在偵錯或序列化時更直觀。
3.  **類型安全**：`typeof Gender[keyof typeof Gender]` 會建立一個聯合類型 `'male' | 'female' | 'other'`，TypeScript 編譯器會確保任何 `Gender` 型別的變數都只能是這三個值之一。

### 介面 (Interfaces)

檔案中還定義了一些共用的介面，如 `Person`, `Address`, `MedicalStaff` 等。這些介面是構建更複雜業務實體的基礎。

```typescript
// 人員基本資訊
export interface Person {
  id: ID;
  name: string;
  birthDate: DateTime;
  gender: Gender;
  contactNumber?: string;
  email?: string;
}

// 醫療專業人員
export interface MedicalStaff extends Person {
  staffType: MedicalStaffType;
  department: string;
  specialization?: string;
  licenseNumber: string;
}
```

注意 `MedicalStaff` 是如何透過 `extends Person` 來繼承並擴展 `Person` 的屬性，這展示了介面的組合能力。

## `results.ts` - 優雅地處理成功與失敗

`results.ts` 是本專案錯誤處理哲學的核心。我們不使用傳統的 `try...catch` 或回傳 `null`/`undefined`，而是採用了一個更具類型安全性的模式：`Result` 代數資料類型 (ADT)。

### `Result` ADT

`Result` 類型是一個標籤聯合類型，它明確地表示一個操作只可能有兩種結果：成功或失敗。

```typescript
// 成功結果
export interface Success<T> {
  success: true;
  data: T;
}

// 失敗結果
export interface Failure {
  success: false;
  error: ErrorDetails;
}

// 操作結果類型
export type Result<T> = Success<T> | Failure;
```

-   `Success<T>`: 代表操作成功，並包含一個 `data` 屬性，其類型為泛型 `T`。
-   `Failure`: 代表操作失敗，並包含一個 `error` 屬性，其中有詳細的錯誤資訊。
-   `Result<T>`: 任何函式的回傳值如果是 `Result<T>`，就意味著它**必須**是 `Success<T>` 或 `Failure` 其中之一。

### 為什麼這很重要？

這種模式強制函式的呼叫者**必須處理**失敗的可能性。編譯器會強迫你檢查 `success` 屬性是 `true` 還是 `false`，然後才能安全地存取 `data` 或 `error`。

```typescript
const result: Result<Patient> = findPatientById('123');

if (result.success) {
  // 在這個區塊中，TypeScript 知道 result 是 Success<Patient>
  console.log(result.data.name); // 安全地存取 data
} else {
  // 在這個區塊中，TypeScript 知道 result 是 Failure
  console.error(result.error.message); // 安全地存取 error
}
```

這消除了整類潛在的執行階段錯誤，例如「Cannot read property 'name' of null」。

### 輔助函式與類型守衛

為了讓 `Result` ADT 更易於使用，`results.ts` 提供了幾個輔助工具：

-   **`success(data)` 和 `failure(code, message)` 函式**: 這些是建立 `Success` 和 `Failure` 物件的工廠函式，使程式碼更簡潔。

    ```typescript
    return success({ id: 'p001', name: 'John Doe' });
    return failure(ErrorCode.PatientNotFound, 'Patient with ID 123 not found.');
    ```

-   **`isSuccess(result)` 和 `isFailure(result)` 類型守衛**: 這些函式不僅會回傳布林值，還能幫助 TypeScript 編譯器在 `if` 判斷式中縮小類型範圍，提供了另一種處理結果的方式。

    ```typescript
    if (isSuccess(result)) {
      console.log(result.data.name);
    }
    ```

## 總結

`common.ts` 和 `results.ts` 共同定義了我們應用程式的「詞彙」。前者提供了一致的名詞（資料類型），後者則提供了一致的動詞結果（操作結果）。理解了這些核心概念後，我們就可以更有信心地去探索更複雜的業務模組了。

在下一章，我們將深入 `Patient.ts` 模組，看看這些核心類型如何在實際的業務邏輯中發揮作用。