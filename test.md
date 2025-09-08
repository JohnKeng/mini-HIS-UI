# mini-HIS API 測試文件

本文件包含所有 mini-HIS API 端點的 curl 測試命令。

## 測試環境
- 伺服器地址：http://localhost:5000
- 所有請求使用 JSON 格式

## 1. 病患管理 API

### 1.1 註冊新病患
```bash
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "patientInfo": {
      "id": "pt-test-001",
      "name": "測試患者",
      "birthDate": "1990-01-01",
      "gender": "Male",
      "contactNumber": "0912345678",
      "address": {
        "street": "測試街道123號",
        "city": "台北市",
        "state": "信義區",
        "postalCode": "110",
        "country": "台灣"
      }
    }
  }'
```

### 1.2 獲取所有病患
```bash
curl -X GET http://localhost:5000/api/patients
```

### 1.3 獲取指定病患
```bash
curl -X GET http://localhost:5000/api/patients/pt-test-001
```

### 1.4 病患入院
```bash
curl -X POST http://localhost:5000/api/patients/pt-test-001/admit \
  -H "Content-Type: application/json" \
  -d '{
    "wardNumber": "A101",
    "bedNumber": "001",
    "attendingDoctorId": "doc-001"
  }'
```

### 1.5 病患出院
```bash
curl -X POST http://localhost:5000/api/patients/pt-test-001/discharge \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "治療完成，恢復良好",
    "followUpDate": "2024-02-01T10:00:00.000Z"
  }'
```

## 2. 預約系統 API

### 2.1 建立新預約
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "pt-test-001",
    "doctorId": "doc-001",
    "department": "內科",
    "timeSlot": {
      "start": "2024-01-15T14:00:00.000Z",
      "end": "2024-01-15T14:30:00.000Z"
    },
    "purpose": "定期檢查"
  }'
```

### 2.2 獲取所有預約
```bash
curl -X GET http://localhost:5000/api/appointments
```

### 2.3 確認預約
```bash
curl -X POST http://localhost:5000/api/appointments/APPOINTMENT_ID/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "confirmationNumber": "CONF-001"
  }'
```

### 2.4 預約報到
```bash
curl -X POST http://localhost:5000/api/appointments/APPOINTMENT_ID/checkin
```

### 2.5 開始預約
```bash
curl -X POST http://localhost:5000/api/appointments/APPOINTMENT_ID/start
```

### 2.6 完成預約
```bash
curl -X POST http://localhost:5000/api/appointments/APPOINTMENT_ID/complete \
  -H "Content-Type: application/json" \
  -d '{
    "followUpNeeded": true,
    "notes": "建議一個月後回診"
  }'
```

## 3. 處方管理 API

### 3.1 開立新處方
```bash
curl -X POST http://localhost:5000/api/prescriptions \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "pt-test-001",
    "doctorId": "doc-001",
    "items": [
      {
        "medicationId": "med-001",
        "medication": {
          "id": "med-001",
          "name": "阿斯匹靈",
          "code": "ASPIRIN",
          "dosageForm": "錠劑",
          "strength": "100mg"
        },
        "dosage": "1錠",
        "frequency": "每日三次",
        "route": "口服",
        "duration": "7天",
        "instructions": "飯後服用"
      }
    ],
    "notes": "緩解疼痛和發炎"
  }'
```

### 3.2 獲取所有處方
```bash
curl -X GET http://localhost:5000/api/prescriptions
```

### 3.3 送出處方
```bash
curl -X POST http://localhost:5000/api/prescriptions/PRESCRIPTION_ID/submit
```

### 3.4 開始調劑
```bash
curl -X POST http://localhost:5000/api/prescriptions/PRESCRIPTION_ID/start-preparation \
  -H "Content-Type: application/json" \
  -d '{
    "pharmacistId": "pharm-001"
  }'
```

### 3.5 完成調劑
```bash
curl -X POST http://localhost:5000/api/prescriptions/PRESCRIPTION_ID/complete-preparing \
  -H "Content-Type: application/json" \
  -d '{
    "preparationNotes": "已完成調劑，藥品品質正常"
  }'
```

### 3.6 發放藥物
```bash
curl -X POST http://localhost:5000/api/prescriptions/PRESCRIPTION_ID/dispense \
  -H "Content-Type: application/json" \
  -d '{
    "dispensedBy": "pharm-001",
    "dispensingNotes": "已向病患說明用藥方式"
  }'
```

## 4. 醫療服務 API

### 4.1 請求新服務
```bash
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "pt-test-001",
    "serviceType": "Examination",
    "serviceName": "X光檢查",
    "priority": "Normal",
    "estimatedDuration": 45,
    "requestedBy": "doc-001",
    "requiredResources": ["X光機", "技術人員"],
    "notes": "檢查胸部"
  }'
```

### 4.2 獲取所有服務
```bash
curl -X GET http://localhost:5000/api/services
```

### 4.3 排程服務
```bash
curl -X POST http://localhost:5000/api/services/SERVICE_ID/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledTime": "2024-01-15T16:00:00.000Z",
    "scheduledBy": "admin-001",
    "staff": [
      {
        "id": "tech-001",
        "name": "技術員王小明",
        "role": "放射技師"
      }
    ],
    "location": "放射科X光室1"
  }'
```

### 4.4 開始準備服務
```bash
curl -X POST http://localhost:5000/api/services/SERVICE_ID/start-preparation \
  -H "Content-Type: application/json" \
  -d '{
    "preparingStaff": [
      {
        "id": "tech-001",
        "name": "技術員王小明",
        "role": "放射技師"
      }
    ],
    "preparationNotes": "設備檢查完成，準備就緒"
  }'
```

### 4.5 開始服務
```bash
curl -X POST http://localhost:5000/api/services/SERVICE_ID/start \
  -H "Content-Type: application/json" \
  -d '{
    "performingStaff": [
      {
        "id": "tech-001",
        "name": "技術員王小明",
        "role": "放射技師"
      }
    ],
    "serviceNotes": "開始進行X光檢查"
  }'
```

### 4.6 完成服務
```bash
curl -X POST http://localhost:5000/api/services/SERVICE_ID/complete \
  -H "Content-Type: application/json" \
  -d '{
    "results": "檢查完成，影像清晰",
    "actualDuration": 30,
    "followUpInstructions": "結果將在24小時內由醫師判讀"
  }'
```

## 測試流程建議

### 完整工作流程測試
1. **註冊病患** → 獲取病患ID
2. **建立預約** → 獲取預約ID → 確認 → 報到 → 開始 → 完成
3. **開立處方** → 獲取處方ID → 送出 → 開始調劑 → 完成調劑 → 發放
4. **請求服務** → 獲取服務ID → 排程 → 開始準備 → 開始服務 → 完成服務
5. **病患入院** → **病患出院**

### 注意事項
- 替換 `APPOINTMENT_ID`、`PRESCRIPTION_ID`、`SERVICE_ID` 為實際的ID
- 某些操作有狀態依賴，需要按順序執行
- 檢查每個請求的回應狀態碼和錯誤訊息

## 快速測試腳本

### 測試病患註冊
```bash
echo "=== 測試病患註冊 ==="
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"patientInfo":{"id":"pt-test-002","name":"快速測試","birthDate":"1985-05-15","gender":"Female","contactNumber":"0987654321","address":{"street":"快速街456號","city":"台北市","state":"大安區","postalCode":"106","country":"台灣"}}}' | jq .
```

### 測試獲取所有病患
```bash
echo "=== 測試獲取所有病患 ==="
curl -X GET http://localhost:5000/api/patients | jq .
```

### 測試建立預約
```bash
echo "=== 測試建立預約 ==="
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"patientId":"pt-test-002","doctorId":"doc-002","department":"婦產科","timeSlot":{"start":"2024-01-20T09:00:00.000Z","end":"2024-01-20T09:30:00.000Z"},"purpose":"產檢"}' | jq .
```