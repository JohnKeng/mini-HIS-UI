# 教學 03: 病患模組 - 以類型驅動狀態管理

歡迎來到 `mini-HIS` 的核心業務邏輯。`Patient.ts` 模組是我們「先寫類型，再寫邏輯」哲學的最佳體現。它完美地展示了如何利用 TypeScript 的代數資料類型 (ADT) 來管理複雜的實體狀態，從而消除無效狀態，使程式碼更健壯、更易於理解。

## 核心問題：如何表示一個「病患」？

在傳統的物件導向或資料庫設計中，一個「病患」物件可能長這樣：

```typescript
// 傳統方式 (有缺陷)
class Patient {
  status: string; // 'registered', 'admitted', 'discharged'...
  admittedAt?: Date;
  dischargeSummary?: string;
  causeOfDeath?: string;
  // ... 其他幾十個可選屬性
}
```

這種設計充滿了問題：

1.  **無效狀態的可能性**：一個病患的 `status` 可能是 `'discharged'`，但 `dischargeSummary` 卻是 `undefined`。或者 `status` 是 `'registered'`，但 `causeOfDeath` 卻有值。這些都是無效的、不合邏輯的狀態，但類型系統卻無法阻止它們的發生。
2.  **充滿 `if` 和 `null` 檢查**：程式碼中會充斥著 `if (patient.status === 'admitted' && patient.admittedAt)` 這類的檢查，非常繁瑣且容易出錯。

## ADT 解決方案：讓無效狀態不可表示

`Patient.ts` 採用了完全不同的方法。我們不定義一個龐大而鬆散的 `Patient` 類別，而是為病患生命週期中的**每一個有效狀態**定義一個精確的介面。

### 定義各個狀態

我們為病患定義了五種可能的狀態，每種狀態都有一個 `tag` 屬性作為區分符，並且只包含**該狀態下必定存在**的屬性：

1.  **`Registered`**: 病患已登記，但未入院。只包含最基本的登記資訊。
    ```typescript
    export interface Registered {
      tag: 'Registered';
      patientId: ID;
      registeredAt: DateTime;
      info: PatientInfo;
    }
    ```
2.  **`Admitted`**: 病患已入院。除了登記資訊，還**必須**有入院時間、病房號、主治醫生等。
    ```typescript
    export interface Admitted {
      tag: 'Admitted';
      // ...
      admittedAt: DateTime;
      wardNumber: string;
      // ...
    }
    ```
3.  **`Discharged`**: 病患已出院。**必須**有出院小結。
4.  **`Referred`**: 病患已轉診。**必須**有轉診機構和原因。
5.  **`Deceased`**: 病患已過世。**必須**有死亡原因。

### `PatientState` 聯合類型

然後，我們將這些狀態組合成一個聯合類型 `PatientState`，這就是我們的代數資料類型：

```typescript
export type PatientState = 
  | Registered
  | Admitted
  | Discharged
  | Referred
  | Deceased;
```

這行程式碼的威力在於，它向 TypeScript 編譯器宣告：一個 `PatientState` 型別的變數，**必然**是這五種狀態介面中的**一種且僅僅一種**。這就從根本上排除了無效狀態的可能性。你不可能創建一個 `tag` 是 `'Discharged'` 但沒有 `dischargeSummary` 的病患物件，因為它不符合 `Discharged` 介面的定義，編譯會直接失敗。

## 類型驅動的狀態轉換

定義了狀態之後，我們需要定義狀態之間的轉換。這就是那些函式如 `admitPatient`, `dischargePatient` 的作用。它們的函式簽章本身就構成了業務規則的文檔。

### `admitPatient` 函式

讓我們看看 `admitPatient` 的簽章：

```typescript
export function admitPatient(
  patient: Registered, // <--- 注意這裡！
  // ...
): Result<Admitted> {
  // ...
}
```

這個簽章告訴我們一個非常重要的業務規則：

-   **輸入**：`admitPatient` 函式**只能**接受一個狀態為 `Registered` 的病患。
-   **輸出**：如果成功，它會回傳一個狀態為 `Admitted` 的病患。

你甚至不能嘗試將一個 `Admitted` 或 `Discharged` 狀態的病患傳遞給這個函式，因為類型不匹配，編譯器會阻止你。這就是「以類型驅動邏輯」。我們在函式內部做的第一件事就是利用 `tag` 屬性進行類型收窄，儘管在這個例子中，函式簽章已經為我們保證了類型。

### `dischargePatient` 函式

同樣地，看看 `dischargePatient`：

```typescript
export function dischargePatient(
  patient: Admitted, // <--- 只能是 Admitted
  // ...
): Result<Discharged> { // ---> 會變成 Discharged
  // ...
}
```

規則清晰可見：只有入院的病患才能被出院，而出院後，他們的狀態會轉變為 `Discharged`。

## `switch` 模式匹配

當你需要根據病患的當前狀態執行不同操作時，`switch` 陳述式與 ADT 是天作之合。TypeScript 的類型收窄能力會在這裡大放異彩。

```typescript
function getPatientSummary(patient: PatientState): string {
  switch (patient.tag) {
    case 'Registered':
      // 在這裡，TypeScript 知道 `patient` 是 `Registered` 類型
      return `Patient ${patient.info.name} is registered.`;

    case 'Admitted':
      // 在這裡，TypeScript 知道 `patient` 是 `Admitted` 類型
      return `Patient is in ward ${patient.wardNumber}.`;

    case 'Discharged':
      // `patient` 是 `Discharged` 類型
      return `Discharged with summary: ${patient.dischargeSummary}`;

    // ... 處理其他所有情況
  }
}
```

如果你的 `switch` 沒有處理所有可能的 `tag`，TypeScript 編譯器還會發出警告（如果你開啟了 `strict` 模式），確保你處理了所有情況。

## 總結

`Patient.ts` 模組透過 ADT 向我們展示了一種更安全、更聲明式的方式來建模複雜的業務邏輯。我們不是在命令式地追蹤和驗證狀態，而是**描述了所有可能的有效狀態**，並定義了它們之間清晰、類型安全的轉換路徑。這種方法減少了 bug，增強了程式碼的可讀性和可維護性。

接下來，我們將探討 `Appointment.ts` 模組，看看類似的原則如何應用於預約管理。