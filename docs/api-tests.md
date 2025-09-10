# mini-HIS API 規格 + 測試 + UX 人工驗證

本文件整合 API 規格、以 curl 為主的測試腳本，以及前端 UX 的人工測試流程，作為單一事實來源。端點清單亦見 `README.md`。

## 0) 通用約定
- 基底網址：`http://localhost:5000`
- 資料格式：`application/json`
- 時間格式：ISO 8601（`YYYY-MM-DDTHH:mm:ss.sssZ`）
- ID 產生：伺服器產生單調遞增 ID（如 `pt-...`、`appt-...`、`rx-...`、`svc-...`、`dr-...`）。部分表單（如患者 `info.id`）可自帶人類可讀卡號。
- 統一回應包（Result ADT）：
  - 成功：`{ success: true, data: <EntityOrState> }`
  - 失敗：`{ success: false, error: { message, code? } }`
  - 驗證/狀態錯誤常見代碼：`VALIDATION_FAILED`、`INVALID_APPOINTMENT_STATE`、`INVALID_PRESCRIPTION_STATE`、`INVALID_SERVICE_STATE` 等；部分系統錯誤僅含 message。

---

## 1) 病患（Patients）

### 1.1 建立病患（註冊）
- `POST /api/patients`
- Body：`{ patientInfo: { id, name, birthDate, gender, contactNumber?, address{ street, city, state?, postalCode, country }, ... } }`
- 回應（示例）：
```json
{
  "success": true,
  "data": {
    "tag": "Registered",
    "patientId": "pt-20240910-0001",
    "registeredAt": "2024-09-10T07:00:00.000Z",
    "info": {
      "id": "card-001",
      "name": "測試患者",
      "birthDate": "1990-01-01",
      "gender": "male",
      "contactNumber": "0912345678",
      "address": { "street": "測試路1號", "city": "台北", "postalCode": "100", "country": "台灣" }
    }
  }
}
```
- 測試：
```bash
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "patientInfo": {
      "id": "card-001",
      "name": "測試患者",
      "birthDate": "1990-01-01",
      "gender": "male",
      "contactNumber": "0912345678",
      "address": {"street": "測試路1號", "city": "台北", "postalCode": "100", "country": "台灣"}
    }
  }'
```

### 1.2 取得清單 / 單筆
```bash
curl http://localhost:5000/api/patients
curl http://localhost:5000/api/patients/PT_ID
```

### 1.3 更新病患（僅 info 可編輯欄位）
```bash
curl -X PUT http://localhost:5000/api/patients/PT_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"新名","address":{"street":"新地址","city":"台北","postalCode":"100","country":"台灣"}}'
```

### 1.4 刪除病患
```bash
curl -X DELETE http://localhost:5000/api/patients/PT_ID
```

---

## 2) 預約（Appointments）

狀態機：Requested → Confirmed → CheckedIn → InProgress → Completed

### 2.1 建立 / 清單
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patientId":"PT_ID",
    "doctorId":"dr-001",
    "department":"內科",
    "timeSlot":{"start":"2025-01-15T14:00:00.000Z","end":"2025-01-15T14:30:00.000Z"},
    "purpose":"定期檢查"
  }'
curl http://localhost:5000/api/appointments
```

### 2.2 逐步操作
```bash
curl -X POST http://localhost:5000/api/appointments/APPT_ID/confirm \
  -H "Content-Type: application/json" -d '{"confirmationNumber":"CONF-001"}'
curl -X POST http://localhost:5000/api/appointments/APPT_ID/checkin
curl -X POST http://localhost:5000/api/appointments/APPT_ID/start
curl -X POST http://localhost:5000/api/appointments/APPT_ID/complete \
  -H "Content-Type: application/json" -d '{"followUpNeeded":false, "notes":"OK"}'
```

---

## 3) 處方（Prescriptions）

狀態機：Created → Submitted → InPreparation → Prepared → Dispensed

### 3.1 開立 / 清單
```bash
curl -X POST http://localhost:5000/api/prescriptions \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PT_ID",
    "doctorId": "dr-001",
    "items": [{
      "medicationId":"med-001",
      "medication": {"id":"med-001","name":"阿斯匹靈","code":"ASP","dosageForm":"tab","strength":"100mg"},
      "dosage":"1錠","frequency":"每日三次","route":"口服","duration":"7天","instructions":"飯後"
    }],
    "notes": "緩解疼痛"
  }'
curl http://localhost:5000/api/prescriptions
```

### 3.2 逐步操作
```bash
curl -X POST http://localhost:5000/api/prescriptions/RX_ID/submit
curl -X POST http://localhost:5000/api/prescriptions/RX_ID/start-preparing \
  -H "Content-Type: application/json" -d '{"pharmacistId":"pharm-001"}'
curl -X POST http://localhost:5000/api/prescriptions/RX_ID/complete-preparing \
  -H "Content-Type: application/json" -d '{"preparationNotes":"核對完畢"}'
curl -X POST http://localhost:5000/api/prescriptions/RX_ID/dispense \
  -H "Content-Type: application/json" -d '{"dispensedBy":"pharm-001","instructions":"按時"}'
```

---

## 4) 醫療服務（Services）

狀態機：Requested → Scheduled → InPreparation → InProgress → Completed

### 4.1 請求 / 清單
```bash
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "patientId":"PT_ID",
    "serviceType":"Examination",
    "description":"胸部 X 光",
    "priority":"Normal",
    "estimatedDuration":45,
    "requestedBy":"dr-001",
    "requiredResources":["X光機"],
    "notes":"PA view"
  }'
curl http://localhost:5000/api/services
```

### 4.2 逐步操作
```bash
curl -X POST http://localhost:5000/api/services/SVC_ID/schedule \
  -H "Content-Type: application/json" \
  -d '{"scheduledTime":"2025-01-15T16:00:00.000Z","scheduledBy":"staff-001","staff":[{"id":"tech-001","name":"技術員","role":"放射技師"}],"location":"放射科X光室1"}'

curl -X POST http://localhost:5000/api/services/SVC_ID/start-preparing \
  -H "Content-Type: application/json" \
  -d '{"staff":[{"id":"tech-001","name":"技術員","role":"放射技師"}],"location":"放射科X光室1","preparationNotes":"設備檢查完成"}'

curl -X POST http://localhost:5000/api/services/SVC_ID/start \
  -H "Content-Type: application/json" \
  -d '{"performingStaff":[{"id":"tech-001","name":"技術員","role":"放射技師"}],"serviceNotes":["開始檢查"]}'

curl -X POST http://localhost:5000/api/services/SVC_ID/complete \
  -H "Content-Type: application/json" \
  -d '{"results":"影像清晰","actualDuration":30,"followUpInstructions":"24小時內判讀"}'
```

---

## 5) 醫療病歷（Medical Records）

### 5.1 依患者查詢 / 取得單筆
```bash
curl 'http://localhost:5000/api/medical-records?patientId=PT_ID'
curl http://localhost:5000/api/medical-records/MR_ID
```

### 5.2 建立 / 更新
```bash
curl -X POST http://localhost:5000/api/medical-records \
  -H "Content-Type: application/json" \
  -d '{
    "patientId":"PT_ID",
    "doctorId":"dr-001",
    "appointmentId":"APPT_ID",
    "data":{
      "chiefComplaint":"胸悶",
      "historyOfPresentIllness":"X 光前評估",
      "pastMedicalHistory":"NAD",
      "physicalExam":"胸部清",
      "diagnosis":"觀察",
      "treatmentPlan":"待影像判讀"
    }
  }'

curl -X PUT http://localhost:5000/api/medical-records/MR_ID \
  -H "Content-Type: application/json" \
  -d '{"data":{"diagnosis":"正常","treatmentPlan":"返家"}}'
```

---

## 6) 醫師（設定 / Doctors）

```bash
curl http://localhost:5000/api/doctors
curl -X POST http://localhost:5000/api/doctors -H 'Content-Type: application/json' -d '{"name":"王大明"}'
curl http://localhost:5000/api/doctors/DR_ID
curl -X PUT http://localhost:5000/api/doctors/DR_ID -H 'Content-Type: application/json' -d '{"name":"王小明"}'
curl -X DELETE http://localhost:5000/api/doctors/DR_ID
```

---

## 7) 失敗案例與狀態規則（重點）
- 預約：非 Confirmed 狀態呼叫 `/checkin` 應回 400 + `INVALID_APPOINTMENT_STATE`
- 預約：非 CheckedIn 狀態呼叫 `/start` 應回 400 + `INVALID_APPOINTMENT_STATE`
- 處方：非 Submitted 狀態呼叫 `/start-preparing` 應回 400 + `INVALID_PRESCRIPTION_STATE`
- 處方：非 InPreparation 狀態呼叫 `/complete-preparing` 應回 400 + `INVALID_PRESCRIPTION_STATE`
- 服務：非 Scheduled 狀態呼叫 `/start-preparing` 應回 400 + `INVALID_SERVICE_STATE`
- 服務：`/complete` 的 `actualDuration <= 0` 應回 400 + `VALIDATION_FAILED`
- 找不到資源：應回 404 + `{ success:false, error:{ message: '...not found' } }`

---

## 8) 端到端情境測試（可直接複製）

```bash
set -euo pipefail
BASE=http://localhost:5000
HDR='Content-Type: application/json'

echo '1) 建立病患' && PT=$(curl -s -X POST $BASE/api/patients -H "$HDR" -d '{
  "patientInfo": {"id":"card-002","name":"小測","birthDate":"1995-05-05","gender":"male","contactNumber":"0900","address":{"street":"A","city":"TPE","postalCode":"100","country":"台灣"}}
}' | jq -r '.data.patientId') && echo "PT_ID=$PT"

echo '2) 建立預約' && APPT=$(curl -s -X POST $BASE/api/appointments -H "$HDR" -d '{
  "patientId":"'$PT'","doctorId":"dr-001","department":"內科",
  "timeSlot":{"start":"2030-01-01T09:00:00.000Z","end":"2030-01-01T09:30:00.000Z"},"purpose":"檢查"
}' | jq -r '.data.info.id') && echo "APPT_ID=$APPT"

curl -s -X POST $BASE/api/appointments/$APPT/confirm -H "$HDR" -d '{"confirmationNumber":"C1"}' >/dev/null
curl -s -X POST $BASE/api/appointments/$APPT/checkin >/dev/null
curl -s -X POST $BASE/api/appointments/$APPT/start >/dev/null
curl -s -X POST $BASE/api/appointments/$APPT/complete -H "$HDR" -d '{"followUpNeeded":false}' >/dev/null

echo '3) 開立處方' && RX=$(curl -s -X POST $BASE/api/prescriptions -H "$HDR" -d '{
  "patientId":"'$PT'","doctorId":"dr-001","items":[{"medicationId":"m1","medication":{"id":"m1","name":"ASP","code":"ASP","dosageForm":"tab","strength":"100mg"},"dosage":"1","frequency":"TID","route":"PO","duration":"7d"}]}' | jq -r '.data.info.id') && echo "RX_ID=$RX"

curl -s -X POST $BASE/api/prescriptions/$RX/submit >/dev/null
curl -s -X POST $BASE/api/prescriptions/$RX/start-preparing -H "$HDR" -d '{"pharmacistId":"pharm-001"}' >/dev/null
curl -s -X POST $BASE/api/prescriptions/$RX/complete-preparing -H "$HDR" -d '{"preparationNotes":"ok"}' >/dev/null
curl -s -X POST $BASE/api/prescriptions/$RX/dispense -H "$HDR" -d '{"dispensedBy":"pharm-001","instructions":"按時"}' >/dev/null

echo '4) 請求服務' && SVC=$(curl -s -X POST $BASE/api/services -H "$HDR" -d '{
  "patientId":"'$PT'","serviceType":"Examination","description":"X-ray","priority":"Normal","estimatedDuration":45,"requestedBy":"dr-001"}' | jq -r '.data.info.id') && echo "SVC_ID=$SVC"

curl -s -X POST $BASE/api/services/$SVC/schedule -H "$HDR" -d '{"scheduledTime":"2030-01-02T10:00:00.000Z","scheduledBy":"dr-001","staff":[{"id":"tech-1","name":"技師","role":"放射技師"}],"location":"Room 1"}' >/dev/null
curl -s -X POST $BASE/api/services/$SVC/start-preparing -H "$HDR" -d '{"staff":[{"id":"tech-1","name":"技師","role":"放射技師"}],"location":"Room 1"}' >/dev/null
curl -s -X POST $BASE/api/services/$SVC/start -H "$HDR" -d '{"performingStaff":[{"id":"tech-1","name":"技師","role":"放射技師"}],"serviceNotes":["就位"]}' >/dev/null
curl -s -X POST $BASE/api/services/$SVC/complete -H "$HDR" -d '{"results":"OK","actualDuration":40,"followUpInstructions":"複查"}' >/dev/null

echo '5) 病歷建立與更新'
MR=$(curl -s -X POST $BASE/api/medical-records -H "$HDR" -d '{"patientId":"'$PT'","data":{"chiefComplaint":"C","historyOfPresentIllness":"H","pastMedicalHistory":"P","physicalExam":"E","diagnosis":"D","treatmentPlan":"T"}}' | jq -r '.data.info.id') && echo "MR_ID=$MR"
curl -s -X PUT $BASE/api/medical-records/$MR -H "$HDR" -d '{"data":{"diagnosis":"新診斷"}}' >/dev/null

echo '全部完成 ✅'
```

---

## 9) 前端 UX 人工測試流程

### 9.1 共通
- 啟動：`npm run dev` 後開 `http://localhost:5000/`。
- 導航：左側側欄切換模組時，右側「動作按鈕」區塊應同步切換（`src/public/js/ui.js`）。
- 錯誤提示：斷線或 4xx/5xx 時，`window.api.apiRequest` 會顯示 toast（`src/public/js/api.js`）。

### 9.2 患者（Patient）
- 新增：點右側「新增患者」→ 填表送出 → 列表出現新患者；雙擊列顯示詳情。
- 編輯：列表操作「編輯」→ 修改姓名/地址 → 儲存 → 列表同步更新。
- 刪除：列表操作「刪除」→ 二次確認 → 成功後從列表移除。

### 9.3 預約（Appointment）
- 新增：填入 `patientId`、醫師、時間區段 → 建立成功。
- 狀態流：對同一預約依序操作「確認 → 報到 → 開始 → 完成」，任一步驟逆序操作應得到 400 與狀態錯誤碼。
- 完成後：可前往病歷頁建立就診紀錄。

### 9.4 處方（Prescription）
- 新增：加入至少 1 個藥物項目 → 成功。
- 流程：送出 → 開始調劑（需帶 `pharmacistId`）→ 完成調劑（可填 `preparationNotes`）→ 發放（需帶 `dispensedBy`）。
- 錯誤：空白 `items` 應回 400 與 `VALIDATION_FAILED`。

### 9.5 服務（Service）
- 新增請求：輸入病患、類型、描述、優先級（`estimatedDuration > 0`）。
- 排程：時間需在未來；帶上 `staff` 與 `location`。
- 準備：以 `/start-preparing`，帶 `staff`、`location`、`preparationNotes`。
- 開始：以 `/start`，帶 `performingStaff` 與 `serviceNotes[]`。
- 完成：以 `/complete`，帶 `results`、`actualDuration > 0`、`followUpInstructions`。

### 9.6 病歷（Medical Records）
- 入口：頁面 `src/public/medical-record.html` 可透過 URL 參數 `?patientId=...` 開啟指定病患。
- 建立/更新：左側清單依建立/更新時間排序；切換項目表單同步；儲存提示正確。

---

## 10) 回歸與相容性
- 已移除舊端點 `/start-preparation`（請改用 `/start-preparing`）。
- 以舊 `db.json` 啟動時，啟動遷移會自動補齊集合與欄位，不影響 UI 操作。

---

## 11) 附註
- 此文件作為 API 規格與測試腳本之合一文件；如端點增減請同步更新本檔。
- 更完整端點總覽與專案說明，請參見 `README.md`。
