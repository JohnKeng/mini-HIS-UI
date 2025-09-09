// 主應用模組 - 處理初始化和導航

// 表單處理
document.addEventListener('DOMContentLoaded', async () => {
    // 小工具：等待指定全域模組可用
    async function waitFor(conditionFn, timeout = 3000, interval = 50) {
        const start = Date.now();
        return new Promise(resolve => {
            const timer = setInterval(() => {
                try {
                    if (conditionFn()) {
                        clearInterval(timer);
                        resolve(true);
                    } else if (Date.now() - start >= timeout) {
                        clearInterval(timer);
                        resolve(false);
                    }
                } catch {
                    // ignore
                }
            }, interval);
        });
    }

    // 初始化資料（先載入患者以便選單/名稱解析）
    await waitFor(() => window.patient && typeof window.patient.loadPatients === 'function');
    if (window.patient?.loadPatients) {
        await window.patient.loadPatients();
    } else {
        console.warn('[init] patient module not ready, skipping initial load');
    }

    // 預設顯示 Dashboard（appointment 面板）並載入資料
    window.ui.showPanel('appointment');
    if (window.patient?.loadPatients) await window.patient.loadPatients();
    if (window.appointment?.loadAppointments) window.appointment.loadAppointments();
    if (window.utils?.loadPatientOptions) window.utils.loadPatientOptions('appointmentPatientList');
    
    // 患者表單處理
    document.getElementById('patientForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const patientInfo = {
            id: `p-${Date.now()}`,
            name: document.getElementById('patientName').value,
            birthDate: document.getElementById('patientBirthDate').value,
            gender: document.querySelector('input[name="gender"]:checked')?.value || '',
            contactNumber: document.getElementById('patientPhone').value,
            address: {
                street: document.getElementById('patientAddress').value,
                city: '台北市',
                zipCode: '100'
            }
        };
        
        const result = await window.api.apiRequest(`${window.api.API_BASE}/patients`, {
            method: 'POST',
            body: JSON.stringify({ patientInfo })
        });
        
        if (result.success) {
            window.ui.showMessage('患者建立成功', 'success');
            document.getElementById('patientForm').reset();
            if (window.patient?.loadPatients) window.patient.loadPatients();
        } else {
            window.ui.showMessage(`建立失敗: ${result.error.message}`, 'error');
        }
    });

    // 預約表單處理
    document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const appointmentData = {
            id: `a-${Date.now()}`,
            patientId: document.getElementById('appointmentPatientId').getAttribute('data-patient-id') || document.getElementById('appointmentPatientId').value,
            doctorId: document.getElementById('appointmentDoctorId').value,
            department: document.getElementById('appointmentDepartment').value,
            timeSlot: {
                start: new Date(document.getElementById('appointmentTime').value).toISOString(),
                end: new Date(new Date(document.getElementById('appointmentTime').value).getTime() + 30 * 60000).toISOString()
            }
        };
        
        const result = await window.api.apiRequest(`${window.api.API_BASE}/appointments`, {
            method: 'POST',
            body: JSON.stringify(appointmentData)
        });
        
        if (result.success) {
            window.ui.showMessage('預約建立成功', 'success');
            document.getElementById('appointmentForm').reset();
            window.appointment.loadAppointments();
        } else {
            window.ui.showMessage(`預約失敗: ${result.error.message}`, 'error');
        }
    });

    // 處方表單處理
    document.getElementById('prescriptionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const prescriptionData = {
            patientId: document.getElementById('prescriptionPatientId').getAttribute('data-patient-id') || document.getElementById('prescriptionPatientId').value,
            doctorId: document.getElementById('prescriptionDoctorId').value,
            items: [
                {
                    medicationId: 'med-001',
                    medication: {
                        id: 'med-001',
                        name: document.getElementById('medicationName').value,
                        code: 'ASPIRIN',
                        dosageForm: '錠劑',
                        strength: '100mg'
                    },
                    dosage: document.getElementById('medicationDosage').value,
                    frequency: document.getElementById('medicationFrequency').value,
                    route: '口服',
                    duration: document.getElementById('medicationDuration').value,
                    instructions: '飯後服用'
                }
            ],
            notes: document.getElementById('prescriptionNotes').value
        };
        
        const result = await window.api.apiRequest(`${window.api.API_BASE}/prescriptions`, {
            method: 'POST',
            body: JSON.stringify(prescriptionData)
        });
        
        if (result.success) {
            window.ui.showMessage('處方開立成功', 'success');
            document.getElementById('prescriptionForm').reset();
            window.prescription.loadPrescriptions();
        } else {
            window.ui.showMessage(`開立失敗: ${result.error.message}`, 'error');
        }
    });

    // 醫療服務表單處理
    document.getElementById('serviceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const serviceData = {
            patientId: document.getElementById('servicePatientId').getAttribute('data-patient-id') || document.getElementById('servicePatientId').value,
            serviceType: document.getElementById('serviceType').value,
            // 同時送出 description 與 serviceName 以相容後端
            description: document.getElementById('serviceName').value,
            serviceName: document.getElementById('serviceName').value,
            priority: document.getElementById('servicePriority').value,
            estimatedDuration: parseInt(document.getElementById('serviceDuration').value),
            requestedBy: document.getElementById('serviceRequestedBy').value,
            requiredResources: ['X光機', '技術人員'],
            notes: document.getElementById('serviceNotes').value
        };
        
        const result = await window.api.apiRequest(`${window.api.API_BASE}/services`, {
            method: 'POST',
            body: JSON.stringify(serviceData)
        });
        
        if (result.success) {
            window.ui.showMessage('服務請求成功', 'success');
            document.getElementById('serviceForm').reset();
            window.service.loadServices();
        } else {
            window.ui.showMessage(`請求失敗: ${result.error.message}`, 'error');
        }
    });
    
    // 患者選擇監聽器 - 僅保留欄位中的患者ID，避免提交混入姓名
    function setupPatientSelectionDisplay(inputId, datalistId) {
        const input = document.getElementById(inputId);
        const datalist = document.getElementById(datalistId);
        
        if (input && datalist) {
            input.addEventListener('input', () => {
                const selectedOption = datalist.querySelector(`option[value="${input.value}"]`);
                if (selectedOption) {
                    const patientId = selectedOption.getAttribute('data-id');
                    if (patientId) {
                        // 僅記錄患者ID，不改寫輸入框為「ID + 姓名」
                        input.value = patientId;
                        input.setAttribute('data-patient-id', patientId);
                    }
                } else {
                    // 非有效選項時，移除已選患者ID
                    input.removeAttribute('data-patient-id');
                }
            });
            
            input.addEventListener('change', () => {
                const selectedOption = datalist.querySelector(`option[value="${input.value}"]`);
                if (selectedOption) {
                    const patientId = selectedOption.getAttribute('data-id');
                    if (patientId) {
                        // 維持輸入框只顯示純ID
                        input.value = patientId;
                        input.setAttribute('data-patient-id', patientId);
                    }
                } else {
                    // 如果輸入的不是有效選項，清除 data-patient-id
                    input.removeAttribute('data-patient-id');
                }
            });
        }
    }
    
    // 設置所有患者選擇器
    setupPatientSelectionDisplay('appointmentPatientId', 'appointmentPatientList');
    setupPatientSelectionDisplay('prescriptionPatientId', 'prescriptionPatientList');
    setupPatientSelectionDisplay('servicePatientId', 'servicePatientList');

    // 若切換到設定面板，載入醫師清單
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.getAttribute('data-panel');
            if (panel === 'settings' && window.settings?.loadDoctors) {
                window.settings.loadDoctors();
            }
        });
    });
});

// 側邊導覽按鈕事件處理（含設定）
document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const panel = btn.getAttribute('data-panel');
        if (!panel) return;
        window.ui.showPanel(panel);
        // 載入對應面板資料
        if (panel === 'appointment') {
            if (window.patient?.loadPatients) await window.patient.loadPatients();
            if (window.appointment?.loadAppointments) window.appointment.loadAppointments();
            if (window.utils?.loadPatientOptions) window.utils.loadPatientOptions('appointmentPatientList');
        } else if (panel === 'patient') {
            if (window.patient?.loadPatients) await window.patient.loadPatients();
        } else if (panel === 'prescription') {
            if (window.patient?.loadPatients) await window.patient.loadPatients();
            if (window.prescription?.loadPrescriptions) window.prescription.loadPrescriptions();
            if (window.utils?.loadPatientOptions) window.utils.loadPatientOptions('prescriptionPatientList');
        } else if (panel === 'service') {
            if (window.patient?.loadPatients) await window.patient.loadPatients();
            if (window.service?.loadServices) window.service.loadServices();
            if (window.utils?.loadPatientOptions) window.utils.loadPatientOptions('servicePatientList');
        } else if (panel === 'settings') {
            if (window.settings?.loadDoctors) window.settings.loadDoctors();
        }
    });
});
